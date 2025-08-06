'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useState } from 'react';
import { toast } from 'sonner';

interface PackageInfo {
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

interface DependencyNode {
  name: string;
  version: string;
  dependencies: DependencyNode[];
  isDev?: boolean;
  isPeer?: boolean;
  isCircular?: boolean;
  depth: number;
}

interface AnalysisResult {
  totalPackages: number;
  productionPackages: number;
  devPackages: number;
  packages: PackageInfo[];
  duplicates: string[];
  outdated: string[];
  dependencyTree: DependencyNode[];
  vulnerabilities: Array<{
    package: string;
    severity: string;
    title: string;
    description?: string;
    id?: string;
    references?: string[];
  }>;
}

export default function DependencyAnalysisPage() {
  const [packageJson, setPackageJson] = useState('');
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [vulnerabilityLoading, setVulnerabilityLoading] = useState(false);
  const [treeLoading, setTreeLoading] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<string>('');
  const [packageTrees, setPackageTrees] = useState<Map<string, DependencyNode>>(
    new Map(),
  );
  const [error, setError] = useState('');

  const analyzePackageJson = (
    packageData: Record<string, unknown>,
  ): AnalysisResult => {
    const dependencies =
      (packageData.dependencies as Record<string, string>) || {};
    const devDependencies =
      (packageData.devDependencies as Record<string, string>) || {};
    const peerDependencies =
      (packageData.peerDependencies as Record<string, string>) || {};
    const packages: PackageInfo[] = [];

    // Analyze dependencies
    Object.entries(dependencies).forEach(([name, version]) => {
      packages.push({
        name,
        version: version as string,
        description: 'Production dependency',
      });
    });

    // Analyze dev dependencies
    Object.entries(devDependencies).forEach(([name, version]) => {
      packages.push({
        name,
        version: version as string,
        description: 'Development dependency',
      });
    });

    // Analyze peer dependencies
    Object.entries(peerDependencies).forEach(([name, version]) => {
      packages.push({
        name,
        version: version as string,
        description: 'Peer dependency',
      });
    });

    // Find duplicates (packages that appear in multiple dependency types)
    const duplicates: string[] = [];
    const seen = new Set();
    packages.forEach((pkg) => {
      if (seen.has(pkg.name)) {
        duplicates.push(pkg.name);
      } else {
        seen.add(pkg.name);
      }
    });

    // Mock outdated packages (in real app, you'd call npm outdated API)
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
      dependencyTree: [], // Will be populated individually per package
      vulnerabilities: [], // Will be populated by checkVulnerabilities
    };
  };

  const buildDependencyTree = async (packageName: string, version: string) => {
    try {
      setTreeLoading(true);

      // Check if we already have this tree cached
      if (packageTrees.has(packageName)) {
        return packageTrees.get(packageName)!;
      }

      const response = await fetch('/api/dependency-tree', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          packages: [
            {
              name: packageName,
              version: version || 'latest',
              isDev: false,
              isPeer: false,
            },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to build dependency tree');
      }

      const { dependencyTrees } = await response.json();
      const tree = dependencyTrees[0];

      if (tree) {
        // Cache the result
        setPackageTrees((prev) => new Map(prev).set(packageName, tree));
        return tree;
      }

      return null;
    } catch (error) {
      console.error('Error building dependency tree:', error);
      toast.error('Failed to build dependency tree');
      return null;
    } finally {
      setTreeLoading(false);
    }
  };
  const checkVulnerabilities = async (packages: PackageInfo[]) => {
    try {
      setVulnerabilityLoading(true);

      const packageList = packages.map((pkg) => ({
        name: pkg.name,
        version: pkg.version || 'latest',
      }));

      const response = await fetch('/api/vulnerability-check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ packages: packageList }),
      });

      if (!response.ok) {
        throw new Error('Failed to check vulnerabilities');
      }

      const { vulnerabilities } = await response.json();

      // Transform the vulnerability data
      const formattedVulns = vulnerabilities.flatMap(
        (vulnData: {
          package: string;
          vulnerabilities: Array<{
            severity: string;
            title: string;
            description: string;
            id: string;
            references: string[];
          }>;
        }) =>
          vulnData.vulnerabilities.map((vuln) => ({
            package: vulnData.package,
            severity: vuln.severity,
            title: vuln.title,
            description: vuln.description,
            id: vuln.id,
            references: vuln.references,
          })),
      );

      return formattedVulns;
    } catch (error) {
      console.error('Error checking vulnerabilities:', error);
      toast.error('Failed to check vulnerabilities');
      return [];
    } finally {
      setVulnerabilityLoading(false);
    }
  };

  const analyzeDependencies = async () => {
    try {
      setError('');
      setLoading(true);

      if (!packageJson.trim()) {
        throw new Error('Please provide package.json content');
      }

      const packageData = JSON.parse(packageJson);

      if (!packageData.dependencies && !packageData.devDependencies) {
        throw new Error('No dependencies found in package.json');
      }

      const result = analyzePackageJson(packageData);

      // Check for vulnerabilities using the API
      toast.info('Checking for security vulnerabilities...');
      const vulnerabilities = await checkVulnerabilities(result.packages);

      // Update the result with real vulnerability data
      const finalResult = {
        ...result,
        vulnerabilities,
      };

      setAnalysis(finalResult);
      toast.success(
        `Dependencies analyzed successfully! Found ${vulnerabilities.length} vulnerabilities.`,
      );
    } catch (err) {
      setError('Error analyzing dependencies: ' + (err as Error).message);
      setAnalysis(null);
      toast.error('Failed to analyze dependencies');
    } finally {
      setLoading(false);
    }
  };

  const handlePackageSelection = async (packageName: string) => {
    setSelectedPackage(packageName);

    if (!packageName || !analysis) {
      return;
    }

    // Find the selected package info
    const selectedPkg = analysis.packages.find(
      (pkg) => pkg.name === packageName,
    );
    if (!selectedPkg) {
      return;
    }

    // Build dependency tree for the selected package
    toast.info(`Building dependency tree for ${packageName}...`);
    const tree = await buildDependencyTree(
      packageName,
      selectedPkg.version || 'latest',
    );

    if (tree) {
      // Update the analysis with the new tree
      setAnalysis((prev) =>
        prev
          ? {
              ...prev,
              dependencyTree: [tree],
            }
          : null,
      );
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard!');
    } catch {
      toast.error('Failed to copy to clipboard');
    }
  };

  const clearAll = () => {
    setPackageJson('');
    setAnalysis(null);
    setSelectedPackage('');
    setPackageTrees(new Map());
    setError('');
    toast.info('Cleared all fields');
  };

  const loadSampleData = () => {
    const samplePackageJson = JSON.stringify(
      {
        name: 'sample-project',
        version: '1.0.0',
        dependencies: {
          react: '^18.2.0',
          'react-dom': '^18.2.0',
          next: '^13.4.0',
          lodash: '^4.17.21',
          '@types/node': '^20.0.0',
        },
        devDependencies: {
          typescript: '^5.0.0',
          '@types/react': '^18.2.0',
          eslint: '^8.42.0',
          prettier: '^2.8.0',
          '@types/node': '^20.0.0',
        },
      },
      null,
      2,
    );

    setPackageJson(samplePackageJson);
    toast.info('Sample package.json loaded');
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'moderate':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dependency Analysis</h1>
      </div>

      <div className="grid gap-4">
        {/* Input Section */}
        <Card>
          <CardHeader>
            <CardTitle>Package Configuration</CardTitle>
            <CardDescription>
              Paste your package.json content to analyze dependencies
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                package.json
              </label>
              <textarea
                placeholder="Paste your package.json content here..."
                value={packageJson}
                onChange={(e) => setPackageJson(e.target.value)}
                className="w-full h-64 p-3 text-sm font-mono bg-background border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                onClick={analyzeDependencies}
                disabled={loading || vulnerabilityLoading}
                className="flex-1 sm:flex-none"
              >
                {loading
                  ? 'Analyzing...'
                  : vulnerabilityLoading
                    ? 'Checking Security...'
                    : 'Analyze Dependencies'}
              </Button>
              <Button
                onClick={loadSampleData}
                variant="outline"
                className="flex-1 sm:flex-none"
              >
                Load Sample
              </Button>
              <Button
                onClick={clearAll}
                variant="outline"
                className="flex-1 sm:flex-none"
              >
                Clear All
              </Button>
            </div>

            {error && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
                {error}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Analysis Results */}
        {analysis && (
          <>
            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">
                    {analysis.totalPackages}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Total Packages
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">
                    {analysis.productionPackages}
                  </div>
                  <p className="text-xs text-muted-foreground">Production</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">
                    {analysis.devPackages}
                  </div>
                  <p className="text-xs text-muted-foreground">Development</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">
                    {analysis.vulnerabilities.length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Vulnerabilities
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Issues Section */}
            <div className="grid gap-4 md:grid-cols-2">
              {/* Outdated Packages */}
              <Card>
                <CardHeader>
                  <CardTitle>Outdated Packages</CardTitle>
                  <CardDescription>
                    Packages that may have newer versions available
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {analysis.outdated.length > 0 ? (
                    <div className="space-y-2">
                      {analysis.outdated.map((pkg) => (
                        <div
                          key={pkg}
                          className="flex items-center justify-between p-2 bg-orange-50 rounded-md"
                        >
                          <span className="font-medium">{pkg}</span>
                          <Badge variant="outline">Update Available</Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No outdated packages detected
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Vulnerabilities */}
              <Card>
                <CardHeader>
                  <CardTitle>Security Vulnerabilities</CardTitle>
                  <CardDescription>
                    Potential security issues in dependencies
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {analysis.vulnerabilities.length > 0 ? (
                    <div className="space-y-3">
                      {analysis.vulnerabilities.map((vuln, index) => (
                        <div key={index} className="p-3 border rounded-md">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">{vuln.package}</span>
                            <Badge className={getSeverityColor(vuln.severity)}>
                              {vuln.severity}
                            </Badge>
                          </div>
                          <h4 className="text-sm font-medium mb-1">
                            {vuln.title}
                          </h4>
                          {vuln.description && (
                            <p className="text-xs text-muted-foreground mb-2">
                              {vuln.description.slice(0, 200)}
                              {vuln.description.length > 200 ? '...' : ''}
                            </p>
                          )}
                          {vuln.id && (
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {vuln.id}
                              </Badge>
                              {vuln.references &&
                                vuln.references.length > 0 && (
                                  <a
                                    href={vuln.references[0]}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-blue-600 hover:underline"
                                  >
                                    View Details
                                  </a>
                                )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No vulnerabilities detected
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Duplicate Dependencies */}
            {analysis.duplicates.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Duplicate Dependencies</CardTitle>
                  <CardDescription>
                    Packages that appear in multiple dependency categories
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {analysis.duplicates.map((pkg) => (
                      <Badge key={pkg} variant="outline">
                        {pkg}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Dependency Tree */}
            <Card>
              <CardHeader>
                <CardTitle>Dependency Tree</CardTitle>
                <CardDescription>
                  Hierarchical view of package dependencies
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium">
                      Select package to view:
                    </label>
                    <select
                      value={selectedPackage}
                      onChange={(e) => handlePackageSelection(e.target.value)}
                      className="px-3 py-1 border rounded-md text-sm"
                    >
                      <option value="">Select a package...</option>
                      {analysis.packages.map((pkg) => (
                        <option key={pkg.name} value={pkg.name}>
                          {pkg.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="border rounded-md p-4 bg-muted/20">
                    {selectedPackage && analysis.dependencyTree.length > 0 ? (
                      <div className="space-y-2">
                        {analysis.dependencyTree.map((tree) => (
                          <DependencyTreeNode key={tree.name} node={tree} />
                        ))}
                      </div>
                    ) : selectedPackage ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="text-center">
                          <div className="text-sm text-muted-foreground mb-2">
                            {treeLoading
                              ? 'Loading dependency tree...'
                              : 'Building dependency tree...'}
                          </div>
                          {treeLoading && (
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        Select a package above to view its dependency tree
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* All Packages */}
            <Card>
              <CardHeader>
                <CardTitle>All Dependencies</CardTitle>
                <CardDescription>
                  Complete list of project dependencies
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {analysis.packages.map((pkg, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 border rounded-md"
                    >
                      <div>
                        <span className="font-medium">{pkg.name}</span>
                        <span className="text-sm text-muted-foreground ml-2">
                          {pkg.version}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {pkg.description?.includes('Development')
                            ? 'dev'
                            : pkg.description?.includes('Peer')
                              ? 'peer'
                              : 'prod'}
                        </Badge>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(pkg.name)}
                          className="h-6 w-6 p-0"
                        >
                          📋
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}

// Component for rendering dependency tree nodes
function DependencyTreeNode({ node }: { node: DependencyNode }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getIndentStyle = (depth: number) => ({
    marginLeft: `${depth * 20}px`,
  });

  const getNodeTypeColor = (node: DependencyNode) => {
    if (node.isCircular) return 'text-red-600';
    if (node.isDev) return 'text-blue-600';
    if (node.isPeer) return 'text-purple-600';
    return 'text-gray-800';
  };

  const getNodeTypeLabel = (node: DependencyNode) => {
    if (node.isCircular) return '🔄';
    if (node.isDev) return '🔧';
    if (node.isPeer) return '🤝';
    return '📦';
  };

  return (
    <div style={getIndentStyle(node.depth)}>
      <div className="flex items-center gap-2 py-1">
        {node.dependencies.length > 0 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-4 h-4 flex items-center justify-center text-xs border rounded hover:bg-gray-100"
          >
            {isExpanded ? '−' : '+'}
          </button>
        )}

        <span className="text-sm">{getNodeTypeLabel(node)}</span>

        <span className={`font-medium text-sm ${getNodeTypeColor(node)}`}>
          {node.name}
        </span>

        <span className="text-xs text-muted-foreground">@{node.version}</span>

        {node.isCircular && (
          <Badge variant="destructive" className="text-xs">
            Circular
          </Badge>
        )}

        {node.isDev && (
          <Badge variant="outline" className="text-xs">
            Dev
          </Badge>
        )}

        {node.isPeer && (
          <Badge variant="outline" className="text-xs">
            Peer
          </Badge>
        )}
      </div>

      {isExpanded && node.dependencies.length > 0 && (
        <div className="ml-4 border-l-2 border-gray-200 pl-2">
          {node.dependencies.map((child, index) => (
            <DependencyTreeNode key={`${child.name}-${index}`} node={child} />
          ))}
        </div>
      )}
    </div>
  );
}
