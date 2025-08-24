import { NextRequest, NextResponse } from 'next/server';

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

    const startTime = Date.now();

    // Fetch the webpage
    const response = await fetch(targetUrl.toString(), {
      method: 'GET',
      headers: {
        'User-Agent': 'Acolyte-Stats/1.0',
      },
      // Set a reasonable timeout
      signal: AbortSignal.timeout(10000),
    });

    const endTime = Date.now();
    const responseTime = endTime - startTime;

    // Get response body
    const html = await response.text();
    const contentLength = new Blob([html]).size;

    // Parse HTML to extract metadata
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : 'No title found';

    const descriptionMatch = html.match(
      /<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["'][^>]*>/i,
    );
    const description = descriptionMatch
      ? descriptionMatch[1]
      : 'No description found';

    // Count various elements
    const linkCount = (html.match(/<a[^>]*href/gi) || []).length;
    const imageCount = (html.match(/<img[^>]*src/gi) || []).length;
    const scriptCount = (html.match(/<script[^>]*>/gi) || []).length;
    const styleCount = (html.match(/<style[^>]*>/gi) || []).length;
    const cssLinkCount = (
      html.match(/<link[^>]*rel=["']stylesheet["']/gi) || []
    ).length;

    // Extract meta tags
    const metaTags = [];
    const metaMatches = html.matchAll(/<meta[^>]*>/gi);
    for (const match of metaMatches) {
      const metaTag = match[0];
      const nameMatch = metaTag.match(/name=["']([^"']+)["']/i);
      const propertyMatch = metaTag.match(/property=["']([^"']+)["']/i);
      const contentMatch = metaTag.match(/content=["']([^"']+)["']/i);

      if ((nameMatch || propertyMatch) && contentMatch) {
        metaTags.push({
          name: nameMatch?.[1] || propertyMatch?.[1] || '',
          content: contentMatch[1],
        });
      }
    }

    // Get headers
    const headers: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      headers[key] = value;
    });

    // Calculate some additional metrics
    const wordCount = html
      .replace(/<[^>]*>/g, '')
      .split(/\s+/)
      .filter((word) => word.length > 0).length;
    const charCount = html.length;
    const htmlSizeKB = (contentLength / 1024).toFixed(2);

    // Check for common frameworks/libraries
    const hasJQuery = html.includes('jquery') || html.includes('jQuery');
    const hasReact = html.includes('react') || html.includes('React');
    const hasVue = html.includes('vue') || html.includes('Vue');
    const hasAngular = html.includes('angular') || html.includes('Angular');
    const hasBootstrap =
      html.includes('bootstrap') || html.includes('Bootstrap');

    // Check for CMS platforms
    const hasWordPress =
      html.includes('wp-content') ||
      html.includes('wp-includes') ||
      html.includes('wordpress') ||
      html.includes('WordPress') ||
      html.match(/\/wp-[a-z-]+\//i) ||
      headers['x-powered-by']?.includes('WordPress') ||
      html.includes('wp-json');

    const hasDrupal =
      html.includes('drupal') ||
      html.includes('Drupal') ||
      html.includes('sites/all/') ||
      html.includes('sites/default/') ||
      html.match(/\/sites\/[^\/]+\/files\//i) ||
      headers['x-drupal-cache'] ||
      headers['x-generator']?.includes('Drupal') ||
      html.includes('drupal.js') ||
      html.includes('misc/drupal.js');

    // Check for other popular frameworks/platforms
    const hasNextJs =
      html.includes('_next/') ||
      html.includes('__NEXT_DATA__') ||
      headers['x-powered-by']?.includes('Next.js');

    const hasNuxt =
      html.includes('_nuxt/') ||
      html.includes('__NUXT__') ||
      headers['x-powered-by']?.includes('Nuxt');

    const hasLaravel =
      html.includes('laravel_session') ||
      headers['set-cookie']?.includes('laravel_session') ||
      headers['x-powered-by']?.includes('Laravel');

    const hasShopify =
      html.includes('shopify') ||
      html.includes('Shopify') ||
      html.includes('cdn.shopify.com') ||
      html.includes('myshopify.com');

    const hasWix =
      html.includes('wix.com') ||
      html.includes('_wixCIDX') ||
      html.includes('static.parastorage.com');

    const hasSquarespace =
      html.includes('squarespace') ||
      html.includes('Squarespace') ||
      html.includes('static1.squarespace.com');

    const hasJoomla =
      html.includes('joomla') ||
      html.includes('Joomla') ||
      html.includes('/administrator/') ||
      html.includes('option=com_');

    const hasExpressJs =
      headers['x-powered-by']?.includes('Express') ||
      (html.includes('express') && html.includes('node'));

    // More specific Tailwind detection - check for explicit references first
    const hasTailwindExplicit =
      html.includes('tailwind') ||
      html.includes('Tailwind') ||
      html.includes('tailwindcss') ||
      html.includes('cdn.tailwindcss.com') ||
      html.includes('unpkg.com/tailwindcss');

    // USWDS detection - check for explicit references and usa- prefixed classes
    const hasUSWDS =
      html.includes('uswds') ||
      html.includes('USWDS') ||
      html.includes('U.S. Web Design System') ||
      html.includes('designsystem.digital.gov') ||
      html.match(/class="[^"]*\busa-[a-z-]+/) ||
      html.includes('usa.css') ||
      html.includes('uswds.css') ||
      html.includes('uswds.min.css');

    // Only check for Tailwind utility classes if USWDS is not detected and no explicit Tailwind references
    const hasTailwindUtilities =
      !hasUSWDS &&
      html.match(
        /class="[^"]*\b(bg-(red|blue|green|yellow|purple|pink|indigo|gray|slate|zinc|neutral|stone|orange|amber|lime|emerald|teal|cyan|sky|violet|fuchsia|rose)-(50|100|200|300|400|500|600|700|800|900)|text-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl)|space-(x|y)-(0|1|2|3|4|5|6|8|10|12|16|20|24|32|40|48|56|64)|rounded-(none|sm|md|lg|xl|2xl|3xl|full)|shadow-(sm|md|lg|xl|2xl|inner|none))/,
      );

    const hasTailwind = hasTailwindExplicit || hasTailwindUtilities;

    const hasMaterializeCSS =
      html.includes('materialize') || html.includes('Materialize');

    const hasBulma = html.includes('bulma') || html.includes('Bulma');

    const hasMUI =
      html.includes('@mui/') ||
      html.includes('material-ui') ||
      html.includes('Material-UI') ||
      html.includes('MuiThemeProvider') ||
      html.includes('makeStyles') ||
      html.includes('withStyles') ||
      html.match(/class="[^"]*\bMui[A-Z]/);

    // Analytics and tracking detection
    const hasGoogleAnalytics =
      html.includes('google-analytics.com') ||
      html.includes('googletagmanager.com') ||
      html.includes('gtag(') ||
      html.includes('ga(') ||
      html.includes('gtag-') ||
      html.includes('GA_MEASUREMENT_ID') ||
      html.includes('GA_TRACKING_ID') ||
      html.includes('GoogleAnalyticsObject') ||
      html.match(/['"]gtag['"]/) ||
      html.match(/google-analytics\.com\/gtag/) ||
      html.match(/gtag\('config',\s*['"][^'"]+['"]\)/) ||
      html.match(/ga\('create',\s*['"][^'"]+['"]\)/) ||
      html.match(/\bG-[A-Z0-9]{10}\b/) || // GA4 measurement ID format
      html.match(/\bUA-\d+-\d+\b/); // Universal Analytics tracking ID format

    const hasGoogleTagManager =
      html.includes('googletagmanager.com') ||
      html.includes('GTM-') ||
      html.match(/\bGTM-[A-Z0-9]+\b/);

    const hasFacebookPixel =
      html.includes('connect.facebook.net') ||
      html.includes('fbevents.js') ||
      html.includes('fbq(') ||
      html.match(/fbq\('init',/) ||
      html.includes('facebook-pixel');

    const hasHotjar =
      html.includes('hotjar.com') ||
      html.includes('hj(') ||
      html.match(/\bhj\(/);

    const hasMatomo =
      html.includes('matomo') ||
      html.includes('piwik') ||
      html.includes('_paq.push') ||
      html.match(/_paq\.push/);

    const hasAmplitude =
      html.includes('amplitude') ||
      html.includes('amplitude.com') ||
      html.match(/amplitude\.getInstance/);

    const hasSegment =
      html.includes('segment.com') ||
      html.includes('analytics.js') ||
      html.match(/analytics\.track/) ||
      html.match(/analytics\.page/);

    const hasZendesk =
      html.includes('zendesk') ||
      html.includes('zdassets.com') ||
      html.includes('zdchat') ||
      html.match(/zE\(/);

    // Security headers check
    const securityHeaders = {
      'x-frame-options': headers['x-frame-options'] || null,
      'x-content-type-options': headers['x-content-type-options'] || null,
      'strict-transport-security': headers['strict-transport-security'] || null,
      'content-security-policy': headers['content-security-policy'] || null,
      'referrer-policy': headers['referrer-policy'] || null,
      'permissions-policy': headers['permissions-policy'] || null,
    };

    const stats = {
      url: targetUrl.toString(),
      domain: targetUrl.hostname,
      protocol: targetUrl.protocol,
      statusCode: response.status,
      statusText: response.statusText,
      responseTime,
      timestamp: new Date().toISOString(),

      // Content analysis
      content: {
        title,
        description,
        contentLength,
        htmlSizeKB: parseFloat(htmlSizeKB),
        wordCount,
        charCount,
        linkCount,
        imageCount,
        scriptCount,
        styleCount,
        cssLinkCount,
      },

      // Technical details
      headers,
      securityHeaders,

      // Framework detection
      frameworks: {
        // JavaScript Frameworks
        react: hasReact,
        vue: hasVue,
        angular: hasAngular,

        // CSS Frameworks
        jquery: hasJQuery,
        bootstrap: hasBootstrap,
        tailwind: hasTailwind,
        materialize: hasMaterializeCSS,
        bulma: hasBulma,
        mui: hasMUI,
        uswds: hasUSWDS,

        // Full-Stack Frameworks
        nextjs: hasNextJs,
        nuxt: hasNuxt,
        express: hasExpressJs,
        laravel: hasLaravel,

        // CMS Platforms
        wordpress: hasWordPress,
        drupal: hasDrupal,
        joomla: hasJoomla,

        // E-commerce Platforms
        shopify: hasShopify,

        // Website Builders
        wix: hasWix,
        squarespace: hasSquarespace,
      },

      // Analytics and tracking
      analytics: {
        googleAnalytics: hasGoogleAnalytics,
        googleTagManager: hasGoogleTagManager,
        facebookPixel: hasFacebookPixel,
        hotjar: hasHotjar,
        matomo: hasMatomo,
        amplitude: hasAmplitude,
        segment: hasSegment,
        zendesk: hasZendesk,
      },

      // Meta tags (limit to first 20 to avoid huge responses)
      metaTags: metaTags.slice(0, 20),
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Web stats error:', error);

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
      { error: 'Failed to analyze website' },
      { status: 500 },
    );
  }
}
