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
import { useRef, useState } from 'react';
import { toast } from 'sonner';

interface SPDXPackage {
  SPDXID: string;
  name: string;
  versionInfo?: string;
  licenseConcluded?: string;
  licenseDeclared?: string;
  supplier?: string;
  downloadLocation?: string;
  filesAnalyzed?: boolean;
  copyrightText?: string;
  externalRefs?: Array<{
    referenceCategory: string;
    referenceType: string;
    referenceLocator: string;
  }>;
}

interface SPDXRelationship {
  spdxElementId: string;
  relationshipType: string;
  relatedSpdxElement: string;
}

interface SPDXDocument {
  spdxVersion?: string;
  dataLicense?: string;
  SPDXID?: string;
  name?: string;
  documentNamespace?: string;
  creationInfo?: {
    created?: string;
    creators?: string[];
    licenseListVersion?: string;
  };
  packages?: SPDXPackage[];
  relationships?: SPDXRelationship[];
  documentDescribes?: string[];
}

interface SBOMReport {
  metadata: {
    name: string;
    version: string;
    spdxVersion: string;
    dataLicense: string;
    created: string;
    creators: string[];
    namespace: string;
  };
  packages: Array<{
    id: string;
    name: string;
    version: string;
    license: string;
    supplier: string;
    downloadLocation: string;
  }>;
  relationships: SPDXRelationship[];
  statistics: {
    totalPackages: number;
    licensedPackages: number;
    packagesWithSupplier: number;
    uniqueLicenses: number;
  };
}

export default function SBOMReportPage() {
  const [sbomInput, setSbomInput] = useState('');
  const [report, setReport] = useState<SBOMReport | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseSPDXSBOM = (sbomData: SPDXDocument): SBOMReport => {
    const packages = (sbomData.packages || [])
      .filter((pkg) => pkg.SPDXID && pkg.name)
      .map((pkg) => ({
        id: pkg.SPDXID,
        name: pkg.name,
        version: pkg.versionInfo || 'N/A',
        license: pkg.licenseConcluded || pkg.licenseDeclared || 'NOASSERTION',
        supplier: pkg.supplier || 'N/A',
        downloadLocation: pkg.downloadLocation || 'N/A',
      }));

    const uniqueLicenses = new Set(
      packages.map((pkg) => pkg.license).filter((lic) => lic !== 'NOASSERTION'),
    );

    return {
      metadata: {
        name: sbomData.name || 'Unknown',
        version: 'N/A',
        spdxVersion: sbomData.spdxVersion || 'N/A',
        dataLicense: sbomData.dataLicense || 'N/A',
        created: sbomData.creationInfo?.created || 'N/A',
        creators: sbomData.creationInfo?.creators || [],
        namespace: sbomData.documentNamespace || 'N/A',
      },
      packages,
      relationships: sbomData.relationships || [],
      statistics: {
        totalPackages: packages.length,
        licensedPackages: packages.filter((pkg) => pkg.license !== 'NOASSERTION')
          .length,
        packagesWithSupplier: packages.filter((pkg) => pkg.supplier !== 'N/A')
          .length,
        uniqueLicenses: uniqueLicenses.size,
      },
    };
  };

  const analyzeSBOM = () => {
    try {
      setError('');
      setLoading(true);

      if (!sbomInput.trim()) {
        throw new Error('Please provide SPDX JSON SBOM content');
      }

      const sbomData: SPDXDocument = JSON.parse(sbomInput);

      if (!sbomData.spdxVersion) {
        throw new Error('Invalid SPDX document: missing spdxVersion');
      }

      const reportData = parseSPDXSBOM(sbomData);
      setReport(reportData);
      toast.success('SBOM analyzed successfully!');
    } catch (err) {
      setError('Error analyzing SBOM: ' + (err as Error).message);
      setReport(null);
      toast.error('Failed to analyze SBOM');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setSbomInput(content);
      toast.success('File loaded successfully!');
    };
    reader.onerror = () => {
      toast.error('Failed to read file');
    };
    reader.readAsText(file);
  };

  const loadSampleSBOM = () => {
    const sampleSBOM = {
      spdxVersion: 'SPDX-2.3',
      dataLicense: 'CC0-1.0',
      SPDXID: 'SPDXRef-DOCUMENT',
      name: 'Sample Project SBOM',
      documentNamespace:
        'https://example.com/sbom/sample-project-1.0.0-abc123',
      creationInfo: {
        created: '2024-01-15T10:30:00Z',
        creators: [
          'Tool: sample-sbom-generator-1.0',
          'Organization: Example Corp',
        ],
        licenseListVersion: '3.21',
      },
      packages: [
        {
          SPDXID: 'SPDXRef-Package-react',
          name: 'react',
          versionInfo: '18.2.0',
          supplier: 'Organization: Facebook Inc.',
          downloadLocation: 'https://registry.npmjs.org/react/-/react-18.2.0.tgz',
          filesAnalyzed: false,
          licenseConcluded: 'MIT',
          licenseDeclared: 'MIT',
          copyrightText: 'Copyright (c) Facebook, Inc.',
        },
        {
          SPDXID: 'SPDXRef-Package-lodash',
          name: 'lodash',
          versionInfo: '4.17.21',
          supplier: 'Organization: OpenJS Foundation',
          downloadLocation:
            'https://registry.npmjs.org/lodash/-/lodash-4.17.21.tgz',
          filesAnalyzed: false,
          licenseConcluded: 'MIT',
          licenseDeclared: 'MIT',
          copyrightText: 'Copyright (c) JS Foundation',
        },
        {
          SPDXID: 'SPDXRef-Package-axios',
          name: 'axios',
          versionInfo: '1.6.0',
          supplier: 'Person: Matt Zabriskie',
          downloadLocation:
            'https://registry.npmjs.org/axios/-/axios-1.6.0.tgz',
          filesAnalyzed: false,
          licenseConcluded: 'MIT',
          licenseDeclared: 'MIT',
          copyrightText: 'Copyright (c) 2014-present Matt Zabriskie',
        },
        {
          SPDXID: 'SPDXRef-Package-typescript',
          name: 'typescript',
          versionInfo: '5.0.0',
          supplier: 'Organization: Microsoft Corporation',
          downloadLocation:
            'https://registry.npmjs.org/typescript/-/typescript-5.0.0.tgz',
          filesAnalyzed: false,
          licenseConcluded: 'Apache-2.0',
          licenseDeclared: 'Apache-2.0',
          copyrightText: 'Copyright (c) Microsoft Corporation',
        },
      ],
      relationships: [
        {
          spdxElementId: 'SPDXRef-DOCUMENT',
          relationshipType: 'DESCRIBES',
          relatedSpdxElement: 'SPDXRef-Package-react',
        },
        {
          spdxElementId: 'SPDXRef-DOCUMENT',
          relationshipType: 'DESCRIBES',
          relatedSpdxElement: 'SPDXRef-Package-lodash',
        },
        {
          spdxElementId: 'SPDXRef-DOCUMENT',
          relationshipType: 'DESCRIBES',
          relatedSpdxElement: 'SPDXRef-Package-axios',
        },
        {
          spdxElementId: 'SPDXRef-DOCUMENT',
          relationshipType: 'DESCRIBES',
          relatedSpdxElement: 'SPDXRef-Package-typescript',
        },
      ],
    };

    setSbomInput(JSON.stringify(sampleSBOM, null, 2));
    toast.info('Sample SBOM loaded');
  };

  const clearAll = () => {
    setSbomInput('');
    setReport(null);
    setError('');
    toast.info('Cleared all fields');
  };

  const downloadReport = (format: 'json' | 'text') => {
    if (!report) return;

    let content: string;
    let filename: string;
    let mimeType: string;

    if (format === 'json') {
      content = JSON.stringify(report, null, 2);
      filename = 'sbom-report.json';
      mimeType = 'application/json';
    } else {
      content = generateTextReport(report);
      filename = 'sbom-report.txt';
      mimeType = 'text/plain';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Report downloaded as ${filename}`);
  };

  const generateTextReport = (report: SBOMReport): string => {
    let text = '=== SBOM REPORT ===\n\n';

    text += '--- METADATA ---\n';
    text += `Name: ${report.metadata.name}\n`;
    text += `SPDX Version: ${report.metadata.spdxVersion}\n`;
    text += `Data License: ${report.metadata.dataLicense}\n`;
    text += `Created: ${report.metadata.created}\n`;
    text += `Creators:\n${report.metadata.creators.map((c) => `  - ${c}`).join('\n')}\n`;
    text += `Namespace: ${report.metadata.namespace}\n\n`;

    text += '--- STATISTICS ---\n';
    text += `Total Packages: ${report.statistics.totalPackages}\n`;
    text += `Licensed Packages: ${report.statistics.licensedPackages}\n`;
    text += `Packages with Supplier: ${report.statistics.packagesWithSupplier}\n`;
    text += `Unique Licenses: ${report.statistics.uniqueLicenses}\n\n`;

    text += '--- PACKAGES ---\n';
    report.packages.forEach((pkg, index) => {
      text += `\n${index + 1}. ${pkg.name}\n`;
      text += `   ID: ${pkg.id}\n`;
      text += `   Version: ${pkg.version}\n`;
      text += `   License: ${pkg.license}\n`;
      text += `   Supplier: ${pkg.supplier}\n`;
      text += `   Download: ${pkg.downloadLocation}\n`;
    });

    if (report.relationships.length > 0) {
      text += '\n--- RELATIONSHIPS ---\n';
      report.relationships.forEach((rel, index) => {
        text += `${index + 1}. ${rel.spdxElementId} ${rel.relationshipType} ${rel.relatedSpdxElement}\n`;
      });
    }

    return text;
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard!');
    } catch {
      toast.error('Failed to copy to clipboard');
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">SBOM Report</h1>
      </div>

      <div className="grid gap-4">
        {/* Input Section */}
        <Card>
          <CardHeader>
            <CardTitle>SPDX JSON SBOM Input</CardTitle>
            <CardDescription>
              Upload or paste an SPDX JSON format Software Bill of Materials
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                SBOM Content
              </label>
              <textarea
                placeholder="Paste your SPDX JSON SBOM here..."
                value={sbomInput}
                onChange={(e) => setSbomInput(e.target.value)}
                className="w-full h-64 p-3 text-sm font-mono bg-background border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".json"
                className="hidden"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="flex-1 sm:flex-none"
              >
                Upload File
              </Button>
              <span className="text-sm text-muted-foreground">
                or paste JSON above
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                onClick={analyzeSBOM}
                disabled={loading}
                className="flex-1 sm:flex-none"
              >
                {loading ? 'Analyzing...' : 'Analyze SBOM'}
              </Button>
              <Button
                onClick={loadSampleSBOM}
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

        {/* Report Results */}
        {report && (
          <>
            {/* Metadata Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>SBOM Metadata</CardTitle>
                    <CardDescription>
                      Document information and creation details
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => downloadReport('json')}
                      size="sm"
                      variant="outline"
                    >
                      Download JSON
                    </Button>
                    <Button
                      onClick={() => downloadReport('text')}
                      size="sm"
                      variant="outline"
                    >
                      Download TXT
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">
                      Document Name
                    </label>
                    <p className="text-sm font-medium">{report.metadata.name}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">
                      SPDX Version
                    </label>
                    <p className="text-sm font-medium">
                      {report.metadata.spdxVersion}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">
                      Data License
                    </label>
                    <p className="text-sm font-medium">
                      {report.metadata.dataLicense}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">
                      Created
                    </label>
                    <p className="text-sm font-medium">
                      {report.metadata.created}
                    </p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs font-medium text-muted-foreground">
                      Creators
                    </label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {report.metadata.creators.map((creator, index) => (
                        <Badge key={index} variant="secondary">
                          {creator}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs font-medium text-muted-foreground">
                      Namespace
                    </label>
                    <p className="text-sm font-mono break-all">
                      {report.metadata.namespace}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Statistics Cards */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">
                    {report.statistics.totalPackages}
                  </div>
                  <p className="text-xs text-muted-foreground">Total Packages</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">
                    {report.statistics.licensedPackages}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Licensed Packages
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">
                    {report.statistics.packagesWithSupplier}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Packages with Supplier
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">
                    {report.statistics.uniqueLicenses}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Unique Licenses
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Packages Table */}
            <Card>
              <CardHeader>
                <CardTitle>Packages</CardTitle>
                <CardDescription>
                  List of all packages in the SBOM
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2 font-medium">#</th>
                        <th className="text-left p-2 font-medium">Name</th>
                        <th className="text-left p-2 font-medium">Version</th>
                        <th className="text-left p-2 font-medium">License</th>
                        <th className="text-left p-2 font-medium">Supplier</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.packages.map((pkg, index) => (
                        <tr key={pkg.id} className="border-b hover:bg-muted/50">
                          <td className="p-2">{index + 1}</td>
                          <td className="p-2 font-medium">{pkg.name}</td>
                          <td className="p-2">{pkg.version}</td>
                          <td className="p-2">
                            <Badge
                              variant={
                                pkg.license === 'NOASSERTION'
                                  ? 'outline'
                                  : 'secondary'
                              }
                            >
                              {pkg.license}
                            </Badge>
                          </td>
                          <td className="p-2 text-muted-foreground">
                            {pkg.supplier}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Relationships */}
            {report.relationships.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Relationships</CardTitle>
                  <CardDescription>
                    Package relationships and dependencies
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {report.relationships.map((rel, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 p-2 border rounded-md text-sm"
                      >
                        <span className="font-mono text-xs">
                          {rel.spdxElementId}
                        </span>
                        <Badge variant="outline">{rel.relationshipType}</Badge>
                        <span className="font-mono text-xs">
                          {rel.relatedSpdxElement}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Raw JSON View */}
            <Card>
              <CardHeader>
                <CardTitle>Raw Report Data</CardTitle>
                <CardDescription>
                  JSON representation of the report
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <textarea
                    value={JSON.stringify(report, null, 2)}
                    readOnly
                    className="w-full h-64 p-3 text-sm font-mono bg-muted border rounded-md resize-none focus:outline-none"
                  />
                  <Button
                    onClick={() =>
                      copyToClipboard(JSON.stringify(report, null, 2))
                    }
                    size="sm"
                    className="absolute top-2 right-2"
                  >
                    Copy
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
