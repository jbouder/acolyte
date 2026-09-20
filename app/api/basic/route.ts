import { NextRequest, NextResponse } from 'next/server';
import { ToolError } from '@/lib/server/errors';
import { performHttpRequest } from '@/lib/server/http-request';

export async function POST(request: NextRequest) {
  try {
    const { url, method, headers, requestBody } = await request.json();

    const result = await performHttpRequest({
      url,
      method,
      headers,
      body: requestBody,
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ToolError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }

    console.error('Basic API request failed:', error);

    return NextResponse.json(
      {
        error: 'Request failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        status: 0,
        responseTime: 0,
      },
      { status: 500 },
    );
  }
}
