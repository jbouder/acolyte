import puppeteer, { type BrowserWorker } from '@cloudflare/puppeteer';
import type { AxeResults, ImpactValue, Result } from 'axe-core';
import { parseHttpUrl, ToolError } from '@/lib/server/errors';

// Injected into the scanned page; keep in step with the axe-core devDependency.
const AXE_CORE_VERSION = '4.13.0';

export type WcagLevel = 'A' | 'AA' | 'AAA';

export interface AccessibilityIssue {
  type: 'error' | 'warning' | 'info';
  message: string;
  element?: string;
  wcagLevel?: string;
  wcagCriteria?: string;
  help?: string;
  helpUrl?: string;
  impact?: ImpactValue | null;
  nodes?: number;
}

export interface AccessibilityReport {
  url: string;
  timestamp: string;
  summary: {
    totalIssues: number;
    errors: number;
    warnings: number;
    info: number;
  };
  issues: AccessibilityIssue[];
  checks: Record<string, boolean>;
  testEngine: {
    name: string;
    version: string;
  };
}

// Map axe-core impact levels to our severity types
const mapImpactToType = (
  impact?: ImpactValue | null,
): 'error' | 'warning' | 'info' => {
  switch (impact) {
    case 'critical':
    case 'serious':
      return 'error';
    case 'moderate':
      return 'warning';
    case 'minor':
      return 'info';
    default:
      return 'error';
  }
};

// Map axe-core tags to WCAG level
const getWcagLevel = (tags: string[]): string => {
  if (tags.includes('wcag2a') || tags.includes('wcag21a')) {
    return '2.1 Level A';
  }
  if (tags.includes('wcag2aa') || tags.includes('wcag21aa')) {
    return '2.1 Level AA';
  }
  if (tags.includes('wcag2aaa') || tags.includes('wcag21aaa')) {
    return '2.1 Level AAA';
  }
  return '';
};

// Extract WCAG criteria from tags
const getWcagCriteria = (tags: string[]): string => {
  const wcagTag = tags.find((tag) => tag.match(/wcag\d+/));
  return wcagTag || '';
};

// Drive Cloudflare Browser Rendering to load the page and run axe-core in it.
// `browser` is the BROWSER binding; callers must pass it through so this
// module works from both the Next.js route and the MCP Worker.
export async function checkAccessibility(
  browser: BrowserWorker | undefined,
  url: string,
  wcagLevel: WcagLevel = 'AA',
): Promise<AccessibilityReport> {
  const targetUrl = parseHttpUrl(url);

  if (!browser) {
    throw new ToolError(
      'Browser Rendering is unavailable. Check the BROWSER binding in wrangler.jsonc.',
      503,
    );
  }

  let instance: Awaited<ReturnType<typeof puppeteer.launch>> | undefined;

  try {
    instance = await puppeteer.launch(browser);

    const page = await instance.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    // Browser Rendering caps a browser instance at 60s of inactivity, so keep
    // navigation well inside that budget.
    await page.goto(targetUrl.toString(), {
      waitUntil: 'networkidle2',
      timeout: 20000,
    });

    await page.addScriptTag({
      url: `https://unpkg.com/axe-core@${AXE_CORE_VERSION}/axe.min.js`,
    });

    const results = (await page.evaluate((wcagLevel: string) => {
      return new Promise((resolve) => {
        const runOptions = {
          runOnly: {
            type: 'tag' as const,
            values:
              wcagLevel === 'A'
                ? ['wcag2a', 'wcag21a']
                : wcagLevel === 'AA'
                  ? ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']
                  : [
                      'wcag2a',
                      'wcag2aa',
                      'wcag2aaa',
                      'wcag21a',
                      'wcag21aa',
                      'wcag21aaa',
                    ],
          },
        };

        // @ts-expect-error axe is injected into the page
        window.axe.run(runOptions).then(resolve);
      });
    }, wcagLevel as string)) as AxeResults;

    const issues: AccessibilityIssue[] = results.violations.map(
      (violation: Result) => ({
        type: mapImpactToType(violation.impact),
        message: violation.description,
        help: violation.help,
        helpUrl: violation.helpUrl,
        element: violation.nodes[0]?.html || violation.id,
        wcagLevel: getWcagLevel(violation.tags),
        wcagCriteria: getWcagCriteria(violation.tags),
        impact: violation.impact,
        nodes: violation.nodes.length,
      }),
    );

    const failed = (...ids: string[]) =>
      results.violations.some((v) => ids.includes(v.id));

    const checks = {
      hasLang: !failed('html-has-lang'),
      hasTitle: !failed('document-title'),
      hasMetaViewport: !failed('meta-viewport'),
      hasSkipLink: !failed('bypass'),
      hasAltTexts: !failed('image-alt'),
      hasFormLabels: !failed('label', 'label-title-only'),
      hasHeadingStructure: !failed(
        'page-has-heading-one',
        'heading-order',
        'empty-heading',
      ),
      hasAriaLabels: !failed(
        'aria-hidden-focus',
        'aria-input-field-name',
        'button-name',
        'link-name',
      ),
      hasLandmarks: !failed('landmark-one-main', 'region'),
      hasColorContrast: !failed('color-contrast'),
    };

    const errors = issues.filter((i) => i.type === 'error').length;
    const warnings = issues.filter((i) => i.type === 'warning').length;
    const info = issues.filter((i) => i.type === 'info').length;

    return {
      url: targetUrl.toString(),
      timestamp: new Date().toISOString(),
      summary: {
        totalIssues: issues.length,
        errors,
        warnings,
        info,
      },
      issues,
      checks,
      testEngine: {
        name: 'axe-core',
        version: results.testEngine.version,
      },
    };
  } catch (error) {
    if (error instanceof ToolError) throw error;
    if (error instanceof Error) {
      if (error.name === 'TimeoutError' || error.message.includes('timeout')) {
        throw new ToolError(
          'Request timeout - the website took too long to respond',
          408,
        );
      }
      if (error.message.includes('net::ERR')) {
        throw new ToolError(
          'Failed to fetch the website. It may be down or blocking requests.',
          502,
        );
      }
    }
    console.error('Accessibility check error:', error);
    throw new ToolError('Failed to check accessibility', 500);
  } finally {
    // Browser Rendering allows only a few concurrent browsers per account, so
    // always hand this one back.
    if (instance) {
      await instance.close().catch(() => {});
    }
  }
}
