import { parse as parseYaml } from 'yaml';
import { z } from 'zod';
import { parseOpenAPI } from '@/lib/openapi-utils';
import { summarizePackageJson } from '@/lib/package-utils';
import { parseSPDXSBOM, type SPDXDocument } from '@/lib/sbom-utils';
import { checkAccessibility } from '@/lib/server/accessibility-check';
import { buildDependencyTrees } from '@/lib/server/dependency-tree';
import { checkVulnerabilities } from '@/lib/server/vulnerability-check';
import { analyzeWebsite } from '@/lib/server/web-stats';
import { defineTool } from './types';

const readOnly = {
  readOnlyHint: true,
  idempotentHint: true,
  openWorldHint: true,
};

const packageList = z
  .array(
    z.object({
      name: z.string().min(1),
      version: z
        .string()
        .min(1)
        .describe('A version or range, e.g. "4.17.21" or "^4.0.0".'),
    }),
  )
  .min(1)
  .max(100);

// Accept either a parsed object or a JSON/YAML string for spec-like inputs.
function parseDocument(
  input: string | Record<string, unknown>,
): Record<string, unknown> {
  if (typeof input !== 'string') return input;
  const text = input.trim();
  try {
    return JSON.parse(text);
  } catch {
    const parsed = parseYaml(text);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('Input must be a JSON or YAML object.');
    }
    return parsed as Record<string, unknown>;
  }
}

export const websiteAnalyze = defineTool({
  name: 'analyze_website',
  title: 'Analyze website',
  description:
    'Fetch a URL and report response timing, security headers, content statistics, meta tags and detected frameworks, CMSs and analytics scripts. Mirrors the Website Analysis tool.',
  inputSchema: z.object({
    url: z.string().url().describe('Absolute http(s) URL to analyze.'),
  }),
  annotations: readOnly,
  handler: async ({ url }) => ({ json: await analyzeWebsite(url) }),
});

export const accessibilityCheck = defineTool({
  name: 'check_accessibility',
  title: 'Check accessibility',
  description:
    'Load a page in headless Chrome (Cloudflare Browser Rendering) and run axe-core WCAG checks. Returns violations with impact, WCAG criteria and help links. Takes 5–10 seconds.',
  inputSchema: z.object({
    url: z.string().url().describe('Absolute http(s) URL to scan.'),
    wcagLevel: z
      .enum(['A', 'AA', 'AAA'])
      .default('AA')
      .describe('WCAG 2.1 conformance level to test against.'),
  }),
  annotations: readOnly,
  handler: async ({ url, wcagLevel }, env) => ({
    json: await checkAccessibility(env.BROWSER, url, wcagLevel),
  }),
});

export const packageJsonAnalyze = defineTool({
  name: 'analyze_package_json',
  title: 'Analyze package.json',
  description:
    'Summarize a package.json: dependency counts by type, duplicates across sections and packages worth reviewing. Optionally query the OSV database for known vulnerabilities in every dependency.',
  inputSchema: z.object({
    packageJson: z
      .string()
      .describe('The full package.json contents as a string.'),
    checkVulnerabilities: z
      .boolean()
      .default(false)
      .describe(
        'Also look every dependency up in OSV (slower: ~0.5s per 5 packages).',
      ),
  }),
  annotations: readOnly,
  handler: async ({ packageJson, checkVulnerabilities: withVulns }) => {
    const data = JSON.parse(packageJson) as Record<string, unknown>;
    if (!data.dependencies && !data.devDependencies) {
      throw new Error('No dependencies found in package.json');
    }
    const summary = summarizePackageJson(data);
    if (!withVulns) return { json: summary };

    const vulnerabilities = await checkVulnerabilities(
      summary.packages.map((pkg) => ({
        name: pkg.name,
        version: pkg.version || 'latest',
      })),
    );
    return { json: { ...summary, vulnerabilities } };
  },
});

export const vulnerabilityCheck = defineTool({
  name: 'check_vulnerabilities',
  title: 'Check npm vulnerabilities',
  description:
    'Query the OSV database (osv.dev) for known vulnerabilities affecting specific npm package versions. Only packages with findings are returned.',
  inputSchema: z.object({ packages: packageList }),
  annotations: readOnly,
  handler: async ({ packages }) => ({
    json: { vulnerabilities: await checkVulnerabilities(packages) },
  }),
});

export const dependencyTree = defineTool({
  name: 'dependency_tree',
  title: 'Build dependency tree',
  description:
    'Resolve an npm package against the registry and expand its dependency tree up to three levels deep, flagging circular references.',
  inputSchema: z.object({
    name: z.string().min(1).describe('npm package name.'),
    version: z
      .string()
      .default('latest')
      .describe('Version to resolve (default "latest").'),
  }),
  annotations: readOnly,
  handler: async ({ name, version }) => {
    const [tree] = await buildDependencyTrees([{ name, version }]);
    if (!tree) {
      throw new Error(
        `Package "${name}@${version}" was not found on the npm registry.`,
      );
    }
    return { json: tree };
  },
});

export const sbomSummarize = defineTool({
  name: 'summarize_sbom',
  title: 'Summarize SBOM',
  description:
    'Parse an SPDX 2.x SBOM (JSON) and report its packages, licenses, suppliers and relationships. Mirrors the SBOM Report tool.',
  inputSchema: z.object({
    sbom: z.string().describe('SPDX JSON document contents.'),
    includePackages: z
      .boolean()
      .default(true)
      .describe('Include the per-package table (can be large).'),
  }),
  annotations: { readOnlyHint: true, idempotentHint: true },
  handler: ({ sbom, includePackages }) => {
    const document = parseDocument(sbom) as SPDXDocument;
    if (!document.spdxVersion && !document.packages) {
      throw new Error('Input does not look like an SPDX document.');
    }
    const report = parseSPDXSBOM(document);
    return {
      json: includePackages
        ? report
        : { metadata: report.metadata, statistics: report.statistics },
    };
  },
});

export const openApiInspect = defineTool({
  name: 'inspect_openapi',
  title: 'Inspect OpenAPI spec',
  description:
    'Parse an OpenAPI/Swagger specification (JSON or YAML, inline or fetched from a URL) and list its endpoints with methods, parameters, tags and auth requirements. Mirrors the Swagger Viewer tool.',
  inputSchema: z
    .object({
      spec: z
        .string()
        .optional()
        .describe('The spec document as JSON or YAML text.'),
      url: z
        .string()
        .url()
        .optional()
        .describe('Alternatively, a URL to fetch the spec from.'),
    })
    .refine((v) => Boolean(v.spec) !== Boolean(v.url), {
      message: 'Provide exactly one of "spec" or "url".',
    }),
  annotations: readOnly,
  handler: async ({ spec, url }) => {
    let text = spec ?? '';
    if (url) {
      const response = await fetch(url, {
        headers: {
          Accept: 'application/json, application/yaml, text/yaml, */*',
        },
        signal: AbortSignal.timeout(10000),
      });
      if (!response.ok) {
        throw new Error(
          `Failed to fetch spec: ${response.status} ${response.statusText}`,
        );
      }
      text = await response.text();
    }
    return { json: parseOpenAPI(parseDocument(text)) };
  },
});

export const analysisTools = [
  websiteAnalyze,
  accessibilityCheck,
  packageJsonAnalyze,
  vulnerabilityCheck,
  dependencyTree,
  sbomSummarize,
  openApiInspect,
];
