import { NextRequest, NextResponse } from 'next/server';
import { ToolError } from '@/lib/server/errors';
import { analyzeWebsite } from '@/lib/server/web-stats';

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();
    const stats = await analyzeWebsite(url);
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Web stats error:', error);

    if (error instanceof ToolError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }

    return NextResponse.json(
      { error: 'Failed to analyze website' },
      { status: 500 },
    );
  }
}
