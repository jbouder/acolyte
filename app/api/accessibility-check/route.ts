import { env } from 'cloudflare:workers';
import { NextRequest, NextResponse } from 'next/server';
import { checkAccessibility } from '@/lib/server/accessibility-check';
import { ToolError } from '@/lib/server/errors';

export async function POST(request: NextRequest) {
  try {
    const { url, wcagLevel = 'AA' } = await request.json();

    // Cloudflare Browser Rendering supplies the headless browser via the
    // BROWSER binding declared in wrangler.jsonc.
    const report = await checkAccessibility(env.BROWSER, url, wcagLevel);
    return NextResponse.json(report);
  } catch (error) {
    if (error instanceof ToolError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }

    console.error('Accessibility check error:', error);
    return NextResponse.json(
      { error: 'Failed to check accessibility' },
      { status: 500 },
    );
  }
}
