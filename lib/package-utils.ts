// package.json inspection shared by the Dependency Analysis page and the MCP
// Worker. Network-backed checks (vulnerabilities, dependency trees) live in
// `lib/server/`; this module is pure.

export interface PackageInfo {
  name: string;
  version?: string;
  description?: string;
  homepage?: string;
  repository?: string;
  license?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  outdated?: boolean;
  vulnerabilities?: number;
}

export interface PackageSummary {
  totalPackages: number;
  productionPackages: number;
  devPackages: number;
  packages: PackageInfo[];
  duplicates: string[];
  outdated: string[];
}

export function summarizePackageJson(
  packageData: Record<string, unknown>,
): PackageSummary {
  const dependencies =
    (packageData.dependencies as Record<string, string>) || {};
  const devDependencies =
    (packageData.devDependencies as Record<string, string>) || {};
  const peerDependencies =
    (packageData.peerDependencies as Record<string, string>) || {};
  const packages: PackageInfo[] = [];

  Object.entries(dependencies).forEach(([name, version]) => {
    packages.push({
      name,
      version: version as string,
      description: 'Production dependency',
    });
  });

  Object.entries(devDependencies).forEach(([name, version]) => {
    packages.push({
      name,
      version: version as string,
      description: 'Development dependency',
    });
  });

  Object.entries(peerDependencies).forEach(([name, version]) => {
    packages.push({
      name,
      version: version as string,
      description: 'Peer dependency',
    });
  });

  // Packages that appear in more than one dependency section.
  const duplicates: string[] = [];
  const seen = new Set();
  packages.forEach((pkg) => {
    if (seen.has(pkg.name)) {
      duplicates.push(pkg.name);
    } else {
      seen.add(pkg.name);
    }
  });

  // Heuristic only: caret ranges are flagged as candidates for review.
  const outdated = packages
    .filter((pkg) => pkg.version && pkg.version.includes('^'))
    .slice(0, 3)
    .map((pkg) => pkg.name);

  return {
    totalPackages: packages.length,
    productionPackages: Object.keys(dependencies).length,
    devPackages: Object.keys(devDependencies).length,
    packages,
    duplicates,
    outdated,
  };
}
