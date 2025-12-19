import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import SBOMReportPage from '../app/sbom-report/page';

// Mock navigator.clipboard
const mockClipboard = {
  writeText: jest.fn(),
};
Object.assign(navigator, {
  clipboard: mockClipboard,
});

// Mock toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
}));

const sampleSBOM = {
  spdxVersion: 'SPDX-2.3',
  dataLicense: 'CC0-1.0',
  SPDXID: 'SPDXRef-DOCUMENT',
  name: 'Test Project SBOM',
  documentNamespace: 'https://example.com/sbom/test-1.0.0',
  creationInfo: {
    created: '2024-01-15T10:30:00Z',
    creators: ['Tool: test-tool-1.0', 'Organization: Test Corp'],
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
  ],
};

describe('SBOMReportPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the SBOM Report page with all components', () => {
    render(<SBOMReportPage />);

    // Check main heading
    expect(screen.getByText('SBOM Report')).toBeInTheDocument();

    // Check card title
    expect(screen.getByText('SPDX JSON SBOM Input')).toBeInTheDocument();

    // Check buttons
    expect(screen.getByText('Analyze SBOM')).toBeInTheDocument();
    expect(screen.getByText('Load Sample')).toBeInTheDocument();
    expect(screen.getByText('Clear All')).toBeInTheDocument();
    expect(screen.getByText('Upload File')).toBeInTheDocument();

    // Check textarea
    expect(
      screen.getByPlaceholderText('Paste your SPDX JSON SBOM here...'),
    ).toBeInTheDocument();
  });

  it('analyzes valid SPDX SBOM correctly', async () => {
    const toast = jest.mocked((await import('sonner')).toast);
    render(<SBOMReportPage />);

    const input = screen.getByPlaceholderText(
      'Paste your SPDX JSON SBOM here...',
    );
    const analyzeButton = screen.getByText('Analyze SBOM');

    // Enter valid SBOM
    fireEvent.change(input, {
      target: { value: JSON.stringify(sampleSBOM) },
    });

    // Click analyze button
    fireEvent.click(analyzeButton);

    // Check success toast
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('SBOM analyzed successfully!');
    });

    // Check metadata is displayed
    expect(screen.getByText('SBOM Metadata')).toBeInTheDocument();
    expect(screen.getByText('Test Project SBOM')).toBeInTheDocument();
    expect(screen.getByText('SPDX-2.3')).toBeInTheDocument();

    // Check statistics are displayed
    expect(screen.getByText('Total Packages')).toBeInTheDocument();
    expect(screen.getByText('Licensed Packages')).toBeInTheDocument();

    // Check packages table
    expect(screen.getByText('Packages')).toBeInTheDocument();
    expect(screen.getByText('react')).toBeInTheDocument();
    expect(screen.getByText('lodash')).toBeInTheDocument();
  });

  it('handles invalid JSON with proper error display', async () => {
    const toast = jest.mocked((await import('sonner')).toast);
    render(<SBOMReportPage />);

    const input = screen.getByPlaceholderText(
      'Paste your SPDX JSON SBOM here...',
    );
    const analyzeButton = screen.getByText('Analyze SBOM');

    // Enter invalid JSON
    fireEvent.change(input, { target: { value: 'invalid json' } });

    // Click analyze button
    fireEvent.click(analyzeButton);

    // Check error message appears
    await waitFor(() => {
      expect(screen.getByText(/Error analyzing SBOM:/)).toBeInTheDocument();
    });

    // Check error toast was called
    expect(toast.error).toHaveBeenCalledWith('Failed to analyze SBOM');
  });

  it('handles SBOM without spdxVersion', async () => {
    const toast = jest.mocked((await import('sonner')).toast);
    render(<SBOMReportPage />);

    const input = screen.getByPlaceholderText(
      'Paste your SPDX JSON SBOM here...',
    );
    const analyzeButton = screen.getByText('Analyze SBOM');

    const invalidSBOM = { name: 'test', packages: [] };
    fireEvent.change(input, {
      target: { value: JSON.stringify(invalidSBOM) },
    });

    fireEvent.click(analyzeButton);

    await waitFor(() => {
      expect(
        screen.getByText(/Invalid SPDX document: missing spdxVersion/),
      ).toBeInTheDocument();
    });

    expect(toast.error).toHaveBeenCalledWith('Failed to analyze SBOM');
  });

  it('handles empty input', async () => {
    const toast = jest.mocked((await import('sonner')).toast);
    render(<SBOMReportPage />);

    const analyzeButton = screen.getByText('Analyze SBOM');

    // Click analyze without input
    fireEvent.click(analyzeButton);

    await waitFor(() => {
      expect(
        screen.getByText(/Please provide SPDX JSON SBOM content/),
      ).toBeInTheDocument();
    });

    expect(toast.error).toHaveBeenCalledWith('Failed to analyze SBOM');
  });

  it('loads sample SBOM data', async () => {
    const toast = jest.mocked((await import('sonner')).toast);
    render(<SBOMReportPage />);

    const input = screen.getByPlaceholderText(
      'Paste your SPDX JSON SBOM here...',
    ) as HTMLTextAreaElement;
    const loadSampleButton = screen.getByText('Load Sample');

    // Click load sample button
    fireEvent.click(loadSampleButton);

    // Check toast was called
    expect(toast.info).toHaveBeenCalledWith('Sample SBOM loaded');

    // Check input is populated
    await waitFor(() => {
      expect(input.value).toContain('Sample Project SBOM');
      expect(input.value).toContain('spdxVersion');
    });
  });

  it('clears all fields when clear button is clicked', async () => {
    const toast = jest.mocked((await import('sonner')).toast);
    render(<SBOMReportPage />);

    const input = screen.getByPlaceholderText(
      'Paste your SPDX JSON SBOM here...',
    );
    const clearButton = screen.getByText('Clear All');

    // Add some content
    fireEvent.change(input, {
      target: { value: JSON.stringify(sampleSBOM) },
    });

    // Click clear button
    fireEvent.click(clearButton);

    // Check input is cleared
    expect(input).toHaveValue('');

    // Check toast was called
    expect(toast.info).toHaveBeenCalledWith('Cleared all fields');
  });

  it('displays statistics correctly', async () => {
    render(<SBOMReportPage />);

    const input = screen.getByPlaceholderText(
      'Paste your SPDX JSON SBOM here...',
    );
    const analyzeButton = screen.getByText('Analyze SBOM');

    fireEvent.change(input, {
      target: { value: JSON.stringify(sampleSBOM) },
    });
    fireEvent.click(analyzeButton);

    await waitFor(() => {
      expect(screen.getByText('Total Packages')).toBeInTheDocument();
    });

    // Check for statistic values (both packages are licensed)
    const statisticsSection = screen.getByText('Total Packages').closest('div');
    expect(statisticsSection).toBeInTheDocument();
  });

  it('displays packages table with correct data', async () => {
    render(<SBOMReportPage />);

    const input = screen.getByPlaceholderText(
      'Paste your SPDX JSON SBOM here...',
    );
    const analyzeButton = screen.getByText('Analyze SBOM');

    fireEvent.change(input, {
      target: { value: JSON.stringify(sampleSBOM) },
    });
    fireEvent.click(analyzeButton);

    await waitFor(() => {
      expect(screen.getByText('react')).toBeInTheDocument();
    });

    // Check package details
    expect(screen.getByText('lodash')).toBeInTheDocument();
    expect(screen.getByText('18.2.0')).toBeInTheDocument();
    expect(screen.getByText('4.17.21')).toBeInTheDocument();

    // Check table headers
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Version')).toBeInTheDocument();
    expect(screen.getByText('License')).toBeInTheDocument();
    expect(screen.getByText('Supplier')).toBeInTheDocument();
  });

  it('displays relationships when present', async () => {
    render(<SBOMReportPage />);

    const input = screen.getByPlaceholderText(
      'Paste your SPDX JSON SBOM here...',
    );
    const analyzeButton = screen.getByText('Analyze SBOM');

    fireEvent.change(input, {
      target: { value: JSON.stringify(sampleSBOM) },
    });
    fireEvent.click(analyzeButton);

    await waitFor(() => {
      expect(screen.getByText('Relationships')).toBeInTheDocument();
    });

    // Check relationship details (there will be multiple instances)
    expect(screen.getAllByText('SPDXRef-DOCUMENT').length).toBeGreaterThan(0);
    expect(screen.getAllByText('DESCRIBES').length).toBeGreaterThan(0);
  });

  it('copies raw report data to clipboard', async () => {
    const toast = jest.mocked((await import('sonner')).toast);
    render(<SBOMReportPage />);

    const input = screen.getByPlaceholderText(
      'Paste your SPDX JSON SBOM here...',
    );
    const analyzeButton = screen.getByText('Analyze SBOM');

    fireEvent.change(input, {
      target: { value: JSON.stringify(sampleSBOM) },
    });
    fireEvent.click(analyzeButton);

    // Wait for report to be generated
    await waitFor(() => {
      expect(screen.getByText('Raw Report Data')).toBeInTheDocument();
    });

    // Find and click the copy button in the Raw Report Data section
    const copyButtons = screen.getAllByText('Copy');
    const rawReportCopyButton = copyButtons[copyButtons.length - 1];
    
    // Clear previous toast calls to isolate this test
    mockClipboard.writeText.mockClear();
    toast.success.mockClear();
    
    fireEvent.click(rawReportCopyButton);

    // Check clipboard was called
    await waitFor(() => {
      expect(mockClipboard.writeText).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith('Copied to clipboard!');
    });
  });

  it('handles packages without optional fields', async () => {
    render(<SBOMReportPage />);

    const minimalSBOM = {
      spdxVersion: 'SPDX-2.3',
      dataLicense: 'CC0-1.0',
      SPDXID: 'SPDXRef-DOCUMENT',
      name: 'Minimal SBOM',
      documentNamespace: 'https://example.com/minimal',
      creationInfo: {
        created: '2024-01-15T10:30:00Z',
        creators: ['Tool: test'],
      },
      packages: [
        {
          SPDXID: 'SPDXRef-Package-minimal',
          name: 'minimal-package',
        },
      ],
    };

    const input = screen.getByPlaceholderText(
      'Paste your SPDX JSON SBOM here...',
    );
    const analyzeButton = screen.getByText('Analyze SBOM');

    fireEvent.change(input, {
      target: { value: JSON.stringify(minimalSBOM) },
    });
    fireEvent.click(analyzeButton);

    await waitFor(() => {
      expect(screen.getByText('minimal-package')).toBeInTheDocument();
    });

    // Check default values are displayed
    expect(screen.getAllByText('N/A').length).toBeGreaterThan(0);
    expect(screen.getByText('NOASSERTION')).toBeInTheDocument();
  });

  it('displays metadata creators as badges', async () => {
    render(<SBOMReportPage />);

    const input = screen.getByPlaceholderText(
      'Paste your SPDX JSON SBOM here...',
    );
    const analyzeButton = screen.getByText('Analyze SBOM');

    fireEvent.change(input, {
      target: { value: JSON.stringify(sampleSBOM) },
    });
    fireEvent.click(analyzeButton);

    await waitFor(() => {
      expect(screen.getByText('Tool: test-tool-1.0')).toBeInTheDocument();
    });

    expect(screen.getByText('Organization: Test Corp')).toBeInTheDocument();
  });

  it('handles download JSON button click', async () => {
    const toast = jest.mocked((await import('sonner')).toast);

    render(<SBOMReportPage />);

    const input = screen.getByPlaceholderText(
      'Paste your SPDX JSON SBOM here...',
    );
    const analyzeButton = screen.getByText('Analyze SBOM');

    fireEvent.change(input, {
      target: { value: JSON.stringify(sampleSBOM) },
    });
    fireEvent.click(analyzeButton);

    await waitFor(() => {
      expect(screen.getByText('Download JSON')).toBeInTheDocument();
    });

    // Mock URL.createObjectURL and related functions
    const mockCreateObjectURL = jest.fn(() => 'blob:mock-url');
    const mockRevokeObjectURL = jest.fn();
    global.URL.createObjectURL = mockCreateObjectURL;
    global.URL.revokeObjectURL = mockRevokeObjectURL;

    // Mock createElement and click
    const mockClick = jest.fn();
    const mockAnchor = document.createElement('a');
    mockAnchor.click = mockClick;
    jest.spyOn(document, 'createElement').mockReturnValue(mockAnchor);

    const downloadJsonButton = screen.getByText('Download JSON');
    fireEvent.click(downloadJsonButton);

    expect(mockCreateObjectURL).toHaveBeenCalled();
    expect(mockClick).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith(
      'Report downloaded as sbom-report.json',
    );

    // Cleanup
    jest.restoreAllMocks();
  });

  it('handles download text button click', async () => {
    const toast = jest.mocked((await import('sonner')).toast);

    render(<SBOMReportPage />);

    const input = screen.getByPlaceholderText(
      'Paste your SPDX JSON SBOM here...',
    );
    const analyzeButton = screen.getByText('Analyze SBOM');

    fireEvent.change(input, {
      target: { value: JSON.stringify(sampleSBOM) },
    });
    fireEvent.click(analyzeButton);

    await waitFor(() => {
      expect(screen.getByText('Download TXT')).toBeInTheDocument();
    });

    // Mock URL.createObjectURL and related functions
    const mockCreateObjectURL = jest.fn(() => 'blob:mock-url');
    const mockRevokeObjectURL = jest.fn();
    global.URL.createObjectURL = mockCreateObjectURL;
    global.URL.revokeObjectURL = mockRevokeObjectURL;

    // Mock createElement and click
    const mockClick = jest.fn();
    const mockAnchor = document.createElement('a');
    mockAnchor.click = mockClick;
    jest.spyOn(document, 'createElement').mockReturnValue(mockAnchor);

    const downloadTxtButton = screen.getByText('Download TXT');
    fireEvent.click(downloadTxtButton);

    expect(mockCreateObjectURL).toHaveBeenCalled();
    expect(mockClick).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith(
      'Report downloaded as sbom-report.txt',
    );

    // Cleanup
    jest.restoreAllMocks();
  });
});
