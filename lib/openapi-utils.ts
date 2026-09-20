// OpenAPI/Swagger parsing shared by the Swagger Viewer page and the MCP Worker.

export interface OpenAPIEndpoint {
  method: string;
  path: string;
  summary: string;
  description: string;
  tags: string[];
  parameters: string[];
  auth: string;
}

export interface ParsedAPI {
  title: string;
  version: string;
  description: string;
  endpoints: OpenAPIEndpoint[];
}

const HTTP_METHODS = new Set([
  'get',
  'post',
  'put',
  'delete',
  'patch',
  'options',
  'head',
]);

// Flatten an OpenAPI document into a list of endpoints. Throws when the
// document has no `paths` object, which is the one thing every spec needs.
export function parseOpenAPI(spec: Record<string, unknown>): ParsedAPI {
  const endpoints: OpenAPIEndpoint[] = [];
  const paths = spec.paths;
  const info = spec.info;

  if (!paths || typeof paths !== 'object' || Array.isArray(paths)) {
    throw new Error('No paths found in OpenAPI specification');
  }

  Object.entries(paths).forEach(([path, pathItem]) => {
    if (typeof pathItem !== 'object' || pathItem === null) return;

    const methods = pathItem as Record<string, unknown>;
    Object.entries(methods).forEach(([method, operation]) => {
      if (
        typeof operation === 'object' &&
        operation !== null &&
        HTTP_METHODS.has(method.toLowerCase())
      ) {
        const op = operation as Record<string, unknown>;
        const tags = Array.isArray(op.tags) ? op.tags : ['default'];

        const parameters: string[] = [];
        if (Array.isArray(op.parameters)) {
          op.parameters.forEach((param) => {
            if (typeof param === 'object' && param !== null) {
              const p = param as Record<string, unknown>;
              const name = p.name as string;
              const inLocation = p.in as string;
              const required = p.required ? '*' : '';
              if (name && inLocation) {
                parameters.push(`${name}${required} (${inLocation})`);
              }
            }
          });
        }

        // Path parameters may be declared only in the path template.
        const pathParams = path.match(/\{([^}]+)\}/g);
        if (pathParams) {
          pathParams.forEach((param) => {
            const paramName = param.slice(1, -1);
            if (!parameters.some((p) => p.startsWith(paramName))) {
              parameters.push(`${paramName}* (path)`);
            }
          });
        }

        let auth = 'None';
        if (Array.isArray(op.security) && op.security.length > 0) {
          const securitySchemes: string[] = [];
          op.security.forEach((secReq) => {
            if (typeof secReq === 'object' && secReq !== null) {
              Object.keys(secReq).forEach((key) => {
                if (!securitySchemes.includes(key)) {
                  securitySchemes.push(key);
                }
              });
            }
          });
          if (securitySchemes.length > 0) {
            auth = securitySchemes.join(', ');
          }
        }

        endpoints.push({
          method: method.toUpperCase(),
          path,
          summary: (op.summary as string) || '',
          description: (op.description as string) || '',
          tags,
          parameters,
          auth,
        });
      }
    });
  });

  const infoObj =
    info && typeof info === 'object' && !Array.isArray(info)
      ? (info as Record<string, unknown>)
      : {};

  return {
    title: (infoObj.title as string) || 'API Documentation',
    version: (infoObj.version as string) || '1.0.0',
    description: (infoObj.description as string) || '',
    endpoints,
  };
}
