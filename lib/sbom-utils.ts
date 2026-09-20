// SPDX SBOM parsing shared by the SBOM Report page and the MCP Worker.

export interface SPDXPackage {
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

export interface SPDXRelationship {
  spdxElementId: string;
  relationshipType: string;
  relatedSpdxElement: string;
}

export interface SPDXDocument {
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

export interface SBOMReport {
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

export function parseSPDXSBOM(sbomData: SPDXDocument): SBOMReport {
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
}
