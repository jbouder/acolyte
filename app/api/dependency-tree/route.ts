import { NextRequest, NextResponse } from 'next/server';

interface DependencyNode {
  name: string;
  version: string;
  dependencies: DependencyNode[];
  isDev?: boolean;
  isPeer?: boolean;
  isCircular?: boolean;
  depth: number;
}

interface PackageMetadata {
  name: string;
  version: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
}

const MAX_DEPTH = 3; // Limit depth to prevent infinite recursion and huge trees
const cache = new Map<string, PackageMetadata>();

export async function POST(request: NextRequest) {
  try {
    const { packages } = await request.json();

    if (!packages || !Array.isArray(packages)) {
      return NextResponse.json(
        { error: 'Invalid packages data' },
        { status: 400 },
      );
    }

    const dependencyTrees: DependencyNode[] = [];

    // Build dependency trees for each root package
    for (const pkg of packages) {
      const tree = await buildDependencyTree(
        pkg.name,
        pkg.version,
        0,
        new Set(),
        pkg.isDev,
        pkg.isPeer,
      );
      if (tree) {
        dependencyTrees.push(tree);
      }
    }

    return NextResponse.json({ dependencyTrees });
  } catch (error) {
    console.error('Dependency tree error:', error);
    return NextResponse.json(
      { error: 'Failed to build dependency tree' },
      { status: 500 },
    );
  }
}

async function buildDependencyTree(
  packageName: string,
  version: string,
  depth: number,
  visited: Set<string>,
  isDev = false,
  isPeer = false,
): Promise<DependencyNode | null> {
  // Prevent infinite recursion
  if (depth > MAX_DEPTH) {
    return null;
  }

  const packageKey = `${packageName}@${version}`;

  // Check for circular dependencies
  const isCircular = visited.has(packageKey);
  if (isCircular && depth > 0) {
    return {
      name: packageName,
      version,
      dependencies: [],
      isDev,
      isPeer,
      isCircular: true,
      depth,
    };
  }

  try {
    // Add to visited set
    visited.add(packageKey);

    // Get package metadata
    const metadata = await getPackageMetadata(packageName, version);
    if (!metadata) {
      return null;
    }

    // Build child dependencies
    const childDependencies: DependencyNode[] = [];

    // Process production dependencies
    if (metadata.dependencies) {
      for (const [depName, depVersion] of Object.entries(
        metadata.dependencies,
      )) {
        const cleanVersion = depVersion.replace(/[\^~]/g, '');
        const childNode = await buildDependencyTree(
          depName,
          cleanVersion,
          depth + 1,
          new Set(visited),
          false,
          false,
        );
        if (childNode) {
          childDependencies.push(childNode);
        }
      }
    }

    // Process dev dependencies (only at root level)
    if (depth === 0 && metadata.devDependencies) {
      for (const [depName, depVersion] of Object.entries(
        metadata.devDependencies,
      )) {
        const cleanVersion = depVersion.replace(/[\^~]/g, '');
        const childNode = await buildDependencyTree(
          depName,
          cleanVersion,
          depth + 1,
          new Set(visited),
          true,
          false,
        );
        if (childNode) {
          childDependencies.push(childNode);
        }
      }
    }

    // Process peer dependencies (only at root level)
    if (depth === 0 && metadata.peerDependencies) {
      for (const [depName, depVersion] of Object.entries(
        metadata.peerDependencies,
      )) {
        const cleanVersion = depVersion.replace(/[\^~]/g, '');
        const childNode = await buildDependencyTree(
          depName,
          cleanVersion,
          depth + 1,
          new Set(visited),
          false,
          true,
        );
        if (childNode) {
          childDependencies.push(childNode);
        }
      }
    }

    return {
      name: packageName,
      version: metadata.version,
      dependencies: childDependencies,
      isDev,
      isPeer,
      isCircular: false,
      depth,
    };
  } catch (error) {
    console.error(`Error building tree for ${packageName}:`, error);
    return null;
  }
}

async function getPackageMetadata(
  packageName: string,
  version: string,
): Promise<PackageMetadata | null> {
  const cacheKey = `${packageName}@${version}`;

  // Check cache first
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey)!;
  }

  try {
    // Fetch from npm registry
    const response = await fetch(
      `https://registry.npmjs.org/${packageName}/${version}`,
      {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'dependency-analyzer',
        },
      },
    );

    if (!response.ok) {
      // Try with latest if specific version fails
      const latestResponse = await fetch(
        `https://registry.npmjs.org/${packageName}/latest`,
        {
          headers: {
            Accept: 'application/json',
            'User-Agent': 'dependency-analyzer',
          },
        },
      );

      if (!latestResponse.ok) {
        return null;
      }

      const latestData = await latestResponse.json();
      const metadata: PackageMetadata = {
        name: latestData.name,
        version: latestData.version,
        dependencies: latestData.dependencies,
        devDependencies: latestData.devDependencies,
        peerDependencies: latestData.peerDependencies,
      };

      // Cache the result
      cache.set(cacheKey, metadata);
      return metadata;
    }

    const data = await response.json();
    const metadata: PackageMetadata = {
      name: data.name,
      version: data.version,
      dependencies: data.dependencies,
      devDependencies: data.devDependencies,
      peerDependencies: data.peerDependencies,
    };

    // Cache the result
    cache.set(cacheKey, metadata);
    return metadata;
  } catch (error) {
    console.error(`Failed to fetch metadata for ${packageName}:`, error);
    return null;
  }
}
