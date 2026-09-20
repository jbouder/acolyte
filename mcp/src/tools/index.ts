import { analysisTools } from './analysis';
import { apiTestingTools } from './api-testing';
import { catalogTools } from './catalog';
import type { ToolDefinition } from './types';
import { utilityTools } from './utilities';

/** Every tool the server exposes, in the order clients will list them. */
export const tools: ToolDefinition[] = [
  ...catalogTools,
  ...utilityTools,
  ...apiTestingTools,
  ...analysisTools,
];

export function findTool(name: string): ToolDefinition | undefined {
  return tools.find((tool) => tool.name === name);
}
