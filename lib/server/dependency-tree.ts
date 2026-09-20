import { ToolError } from '@/lib/server/errors';

export interface DependencyNode {
  name: string;
  version: string;
  dependencies: DependencyNode[];
  isDev?: boolean;
  isPeer?: boolean;
  isCircular?: boolean;
  depth: number;
}

export interface RootPackage {
  name: string;
  version: string;
  isDev?: boolean;
  isPeer?: boolean;
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

const REGISTRY_HEADERS = {
  Accept: 'application/json',
  'User-Agent': 'dependency-analyzer',
};

function toMetadata(data: PackageMetadata): PackageMetadata {
  return {
    name: data.name,
    version: data.version,
    dependencies: data.dependencies,
    devDependencies: data.devDependencies,
    peerDependencies: data.peerDependencies,
  };
}

async function getPackageMetadata(
  packageName: string,
  version: string,
): Promise<PackageMetadata | null> {
  const cacheKey = `${packageName}@${version}`;

  if (cache.has(cacheKey)) {
    return cache.get(cacheKey)!;
  }

  try {
    const response = await fetch(
      `https://registry.npmjs.org/${packageName}/${version}`,
      { headers: REGISTRY_HEADERS },
    );

    // Fall back to `latest` when the exact version is not published.
    const source = response.ok
      ? response
      : await fetch(`https://registry.npmjs.org/${packageName}/latest`, {
          headers: REGISTRY_HEADERS,
        });

    if (!source.ok) {
      return null;
    }

    const metadata = toMetadata(await source.json());
    cache.set(cacheKey, metadata);
    return metadata;
  } catch (error) {
    console.error(`Failed to fetch metadata for ${packageName}:`, error);
    return null;
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
  if (depth > MAX_DEPTH) {
    return null;
  }

  const packageKey = `${packageName}@${version}`;

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
    visited.add(packageKey);

    const metadata = await getPackageMetadata(packageName, version);
    if (!metadata) {
      return null;
    }

    const childDependencies: DependencyNode[] = [];

    const addChildren = async (
      deps: Record<string, string> | undefined,
      childIsDev: boolean,
      childIsPeer: boolean,
    ) => {
      for (const [depName, depVersion] of Object.entries(deps ?? {})) {
        const cleanVersion = depVersion.replace(/[\^~]/g, '');
        const childNode = await buildDependencyTree(
          depName,
          cleanVersion,
          depth + 1,
          new Set(visited),
          childIsDev,
          childIsPeer,
        );
        if (childNode) {
          childDependencies.push(childNode);
        }
      }
    };

    await addChildren(metadata.dependencies, false, false);

    // Dev and peer dependencies only matter for the root package.
    if (depth === 0) {
      await addChildren(metadata.devDependencies, true, false);
      await addChildren(metadata.peerDependencies, false, true);
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

// Resolve each root package against the npm registry and expand its
// dependencies up to MAX_DEPTH levels.
export async function buildDependencyTrees(
  packages: unknown,
): Promise<DependencyNode[]> {
  if (!packages || !Array.isArray(packages)) {
    throw new ToolError('Invalid packages data', 400);
  }

  const dependencyTrees: DependencyNode[] = [];

  for (const pkg of packages as RootPackage[]) {
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

  return dependencyTrees;
}
