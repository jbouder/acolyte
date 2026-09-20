import { NextRequest, NextResponse } from 'next/server';
import { buildDependencyTrees } from '@/lib/server/dependency-tree';
import { ToolError } from '@/lib/server/errors';

export async function POST(request: NextRequest) {
  try {
    const { packages } = await request.json();
    const dependencyTrees = await buildDependencyTrees(packages);
    return NextResponse.json({ dependencyTrees });
  } catch (error) {
    if (error instanceof ToolError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }

    console.error('Dependency tree error:', error);
    return NextResponse.json(
      { error: 'Failed to build dependency tree' },
      { status: 500 },
    );
  }
}
