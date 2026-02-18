import chromium from '@sparticuz/chromium';
import type { AxeResults, ImpactValue, Result } from 'axe-core';
import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer-core';

interface AccessibilityIssue {
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

export async function POST(request: NextRequest) {
  let browser;

  try {
    const { url, wcagLevel = 'AA' } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Validate URL format
    let targetUrl: URL;
    try {
      targetUrl = new URL(url);
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 },
      );
    }

    // Launch headless browser with serverless-compatible configuration
    const isDev = process.env.NODE_ENV === 'development';

    browser = await puppeteer.launch({
      args: isDev
        ? [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
          ]
        : [...chromium.args, '--no-sandbox', '--disable-setuid-sandbox'],
      defaultViewport: {
        width: 1920,
        height: 1080,
      },
      executablePath: isDev
        ? process.env.PUPPETEER_EXECUTABLE_PATH ||
          '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
        : await chromium.executablePath(),
      headless: true,
    });

    const page = await browser.newPage();

    // Set timeout and navigate to the page
    await page.goto(targetUrl.toString(), {
      waitUntil: 'networkidle0',
      timeout: 30000,
    });

    // Inject axe-core into the page from CDN
    await page.addScriptTag({
      url: 'https://unpkg.com/axe-core@latest/axe.min.js',
    });

    // Run axe-core accessibility tests
    const results = (await page.evaluate((wcagLevel: string) => {
      return new Promise((resolve) => {
        // Configure axe based on WCAG level
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

    await browser.close();

    // Convert axe-core results to our format
    const issues: AccessibilityIssue[] = [];

    // Process violations (errors)
    results.violations.forEach((violation: Result) => {
      issues.push({
        type: mapImpactToType(violation.impact),
        message: violation.description,
        help: violation.help,
        helpUrl: violation.helpUrl,
        element: violation.nodes[0]?.html || violation.id,
        wcagLevel: getWcagLevel(violation.tags),
        wcagCriteria: getWcagCriteria(violation.tags),
        impact: violation.impact,
        nodes: violation.nodes.length,
      });
    });

    // Analyze checks for summary
    const checks = {
      hasLang: !results.violations.some((v) => v.id === 'html-has-lang'),
      hasTitle: !results.violations.some((v) => v.id === 'document-title'),
      hasMetaViewport: !results.violations.some(
        (v) => v.id === 'meta-viewport',
      ),
      hasSkipLink: !results.violations.some((v) => v.id === 'bypass'),
      hasAltTexts: !results.violations.some((v) => v.id === 'image-alt'),
      hasFormLabels: !results.violations.some(
        (v) => v.id === 'label' || v.id === 'label-title-only',
      ),
      hasHeadingStructure: !results.violations.some(
        (v) =>
          v.id === 'page-has-heading-one' ||
          v.id === 'heading-order' ||
          v.id === 'empty-heading',
      ),
      hasAriaLabels: !results.violations.some(
        (v) =>
          v.id === 'aria-hidden-focus' ||
          v.id === 'aria-input-field-name' ||
          v.id === 'button-name' ||
          v.id === 'link-name',
      ),
      hasLandmarks: !results.violations.some(
        (v) => v.id === 'landmark-one-main' || v.id === 'region',
      ),
      hasColorContrast: !results.violations.some(
        (v) => v.id === 'color-contrast',
      ),
    };

    // Calculate summary
    const errors = issues.filter((i) => i.type === 'error').length;
    const warnings = issues.filter((i) => i.type === 'warning').length;
    const info = issues.filter((i) => i.type === 'info').length;

    const report = {
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

    return NextResponse.json(report);
  } catch (error) {
    console.error('Accessibility check error:', error);

    // Ensure browser is closed on error
    if (browser) {
      await browser.close();
    }

    if (error instanceof Error) {
      if (error.name === 'TimeoutError' || error.message.includes('timeout')) {
        return NextResponse.json(
          { error: 'Request timeout - the website took too long to respond' },
          { status: 408 },
        );
      }
      if (error.message.includes('net::ERR')) {
        return NextResponse.json(
          {
            error:
              'Failed to fetch the website. It may be down or blocking requests.',
          },
          { status: 502 },
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to check accessibility' },
      { status: 500 },
    );
  }
}
