import { NextRequest, NextResponse } from 'next/server';

interface AccessibilityIssue {
  type: 'error' | 'warning' | 'info';
  message: string;
  element?: string;
  wcagLevel?: string;
  wcagCriteria?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

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

    // Fetch the webpage
    const response = await fetch(targetUrl.toString(), {
      method: 'GET',
      headers: {
        'User-Agent': 'Acolyte-Accessibility/1.0',
      },
      signal: AbortSignal.timeout(10000),
    });

    const html = await response.text();

    // Initialize issues array and checks
    const issues: AccessibilityIssue[] = [];
    const checks = {
      hasLang: false,
      hasTitle: false,
      hasMetaViewport: false,
      hasSkipLink: false,
      hasAltTexts: true,
      hasFormLabels: true,
      hasHeadingStructure: true,
      hasAriaLabels: true,
      hasLandmarks: true,
      hasColorContrast: true,
    };

    // Check for lang attribute
    const hasLang = /<html[^>]*\slang=/i.test(html);
    checks.hasLang = hasLang;
    if (!hasLang) {
      issues.push({
        type: 'error',
        message: 'HTML element is missing lang attribute',
        element: '<html>',
        wcagLevel: '2.1 Level A',
        wcagCriteria: '3.1.1 Language of Page',
      });
    }

    // Check for title
    const hasTitle = /<title[^>]*>([^<]+)<\/title>/i.test(html);
    checks.hasTitle = hasTitle;
    if (!hasTitle) {
      issues.push({
        type: 'error',
        message: 'Page is missing a title element',
        element: '<head>',
        wcagLevel: '2.1 Level A',
        wcagCriteria: '2.4.2 Page Titled',
      });
    }

    // Check for viewport meta tag
    const hasViewport = /<meta[^>]*name=["']viewport["']/i.test(html);
    checks.hasMetaViewport = hasViewport;
    if (!hasViewport) {
      issues.push({
        type: 'warning',
        message: 'Page is missing viewport meta tag for responsive design',
        element: '<head>',
        wcagLevel: '2.1 Level AA',
        wcagCriteria: '1.4.10 Reflow',
      });
    }

    // Check for skip links
    const hasSkipLink =
      /skip[- ]to[- ](main|content|navigation)/i.test(html) ||
      /<a[^>]*href=["']#(main|content|skip)/i.test(html);
    checks.hasSkipLink = hasSkipLink;
    if (!hasSkipLink) {
      issues.push({
        type: 'info',
        message: 'Consider adding a skip navigation link for keyboard users',
        wcagLevel: '2.1 Level A',
        wcagCriteria: '2.4.1 Bypass Blocks',
      });
    }

    // Check for images without alt text
    const imgMatches = html.matchAll(/<img[^>]*>/gi);
    let imagesWithoutAlt = 0;
    for (const match of imgMatches) {
      const img = match[0];
      if (
        !img.includes('alt=') ||
        /alt=["']["']/i.test(img) ||
        /alt=["']\s*["']/i.test(img)
      ) {
        imagesWithoutAlt++;
      }
    }
    if (imagesWithoutAlt > 0) {
      checks.hasAltTexts = false;
      issues.push({
        type: 'error',
        message: `Found ${imagesWithoutAlt} image(s) without proper alt text`,
        element: '<img>',
        wcagLevel: '2.1 Level A',
        wcagCriteria: '1.1.1 Non-text Content',
      });
    }

    // Check for form inputs without labels
    const inputMatches = html.matchAll(
      /<input[^>]*type=["']?(text|email|password|search|tel|url|number)[^>]*>/gi,
    );
    let inputsWithoutLabels = 0;
    for (const match of inputMatches) {
      const input = match[0];
      const hasId = /id=["']([^"']+)["']/i.exec(input);
      const hasAriaLabel = /aria-label=/i.test(input);
      const hasAriaLabelledby = /aria-labelledby=/i.test(input);

      if (!hasAriaLabel && !hasAriaLabelledby) {
        if (hasId) {
          const id = hasId[1];
          const hasLabelFor = new RegExp(
            `<label[^>]*for=["']${id}["']`,
            'i',
          ).test(html);
          if (!hasLabelFor) {
            inputsWithoutLabels++;
          }
        } else {
          inputsWithoutLabels++;
        }
      }
    }
    if (inputsWithoutLabels > 0) {
      checks.hasFormLabels = false;
      issues.push({
        type: 'error',
        message: `Found ${inputsWithoutLabels} form input(s) without associated labels`,
        element: '<input>',
        wcagLevel: '2.1 Level A',
        wcagCriteria: '1.3.1 Info and Relationships',
      });
    }

    // Check heading structure
    const h1Count = (html.match(/<h1[^>]*>/gi) || []).length;
    if (h1Count === 0) {
      checks.hasHeadingStructure = false;
      issues.push({
        type: 'error',
        message: 'Page is missing an h1 heading',
        wcagLevel: '2.1 Level A',
        wcagCriteria: '1.3.1 Info and Relationships',
      });
    } else if (h1Count > 1) {
      checks.hasHeadingStructure = false;
      issues.push({
        type: 'warning',
        message: `Page has ${h1Count} h1 headings, should have only one`,
        element: '<h1>',
        wcagLevel: '2.1 Level A',
        wcagCriteria: '1.3.1 Info and Relationships',
      });
    }

    // Check for ARIA landmarks
    const hasMain =
      /<main[^>]*>/i.test(html) || /role=["']main["']/i.test(html);
    const hasNav =
      /<nav[^>]*>/i.test(html) || /role=["']navigation["']/i.test(html);
    if (!hasMain) {
      checks.hasLandmarks = false;
      issues.push({
        type: 'warning',
        message: 'Page is missing a main landmark',
        element: '<main>',
        wcagLevel: '2.1 Level A',
        wcagCriteria: '1.3.1 Info and Relationships',
      });
    }
    if (!hasNav && /<a[^>]*href/i.test(html)) {
      issues.push({
        type: 'info',
        message: 'Consider adding a navigation landmark',
        element: '<nav>',
      });
    }

    // Check for buttons without accessible names
    const buttonMatches = html.matchAll(/<button[^>]*>([^<]*)<\/button>/gi);
    let buttonsWithoutText = 0;
    for (const match of buttonMatches) {
      const buttonContent = match[1].trim();
      const buttonTag = match[0];
      const hasAriaLabel = /aria-label=/i.test(buttonTag);
      const hasAriaLabelledby = /aria-labelledby=/i.test(buttonTag);

      if (!buttonContent && !hasAriaLabel && !hasAriaLabelledby) {
        buttonsWithoutText++;
      }
    }
    if (buttonsWithoutText > 0) {
      checks.hasAriaLabels = false;
      issues.push({
        type: 'error',
        message: `Found ${buttonsWithoutText} button(s) without accessible text`,
        element: '<button>',
        wcagLevel: '2.1 Level A',
        wcagCriteria: '4.1.2 Name, Role, Value',
      });
    }

    // Check for links without text
    const linkMatches = html.matchAll(/<a[^>]*href[^>]*>([^<]*)<\/a>/gi);
    let linksWithoutText = 0;
    for (const match of linkMatches) {
      const linkContent = match[1].trim();
      const linkTag = match[0];
      const hasAriaLabel = /aria-label=/i.test(linkTag);
      const hasAriaLabelledby = /aria-labelledby=/i.test(linkTag);
      const hasImage = /<img/i.test(linkTag);

      if (!linkContent && !hasAriaLabel && !hasAriaLabelledby && !hasImage) {
        linksWithoutText++;
      }
    }
    if (linksWithoutText > 0) {
      checks.hasAriaLabels = false;
      issues.push({
        type: 'error',
        message: `Found ${linksWithoutText} link(s) without accessible text`,
        element: '<a>',
        wcagLevel: '2.1 Level A',
        wcagCriteria: '2.4.4 Link Purpose',
      });
    }

    // Check for color contrast issues (basic check)
    const hasInlineStyles = /style=["'][^"']*color:/i.test(html);
    if (hasInlineStyles) {
      issues.push({
        type: 'info',
        message:
          'Inline color styles detected. Ensure sufficient color contrast (4.5:1 for normal text)',
        wcagLevel: '2.1 Level AA',
        wcagCriteria: '1.4.3 Contrast',
      });
    }

    // Check for tables without proper structure
    const tableMatches = html.matchAll(/<table[^>]*>/gi);
    let tablesWithoutHeaders = 0;
    for (const match of tableMatches) {
      const tableStart = match.index || 0;
      const tableEnd = html.indexOf('</table>', tableStart);
      if (tableEnd !== -1) {
        const tableContent = html.substring(tableStart, tableEnd);
        if (!/<th[^>]*>/i.test(tableContent)) {
          tablesWithoutHeaders++;
        }
      }
    }
    if (tablesWithoutHeaders > 0) {
      issues.push({
        type: 'warning',
        message: `Found ${tablesWithoutHeaders} table(s) without header cells`,
        element: '<table>',
        wcagLevel: '2.1 Level A',
        wcagCriteria: '1.3.1 Info and Relationships',
      });
    }

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
    };

    return NextResponse.json(report);
  } catch (error) {
    console.error('Accessibility check error:', error);

    if (error instanceof Error) {
      if (error.name === 'TimeoutError' || error.message.includes('timeout')) {
        return NextResponse.json(
          { error: 'Request timeout - the website took too long to respond' },
          { status: 408 },
        );
      }
      if (error.message.includes('fetch')) {
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
