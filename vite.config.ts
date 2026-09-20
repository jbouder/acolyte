import { cloudflare } from '@cloudflare/vite-plugin';
import { cdnAdapter } from '@vinext/cloudflare/cache/cdn-adapter';
import vinext from 'vinext';
import { defineConfig } from 'vite';

/**
 * mermaid and web-llm only ever execute in the browser (both are pulled in via
 * dynamic `import()` from inside effects/handlers), but the SSR environment
 * still emits its own copy of every chunk they reach. Left alone that is ~10MB
 * of dead weight uploaded with the Worker, which pushes it past the 3MiB
 * compressed limit on the Workers Free plan. Marking them external for the
 * server environments keeps them client-only.
 */
const browserOnly = [/^mermaid($|\/)/, /^@mlc-ai\/web-llm($|\/)/];

export default defineConfig({
  environments: {
    ssr: {
      build: { rollupOptions: { external: browserOnly } },
    },
    rsc: {
      build: { rollupOptions: { external: browserOnly } },
    },
  },
  plugins: [
    vinext({
      cache: { cdn: cdnAdapter() },
    }),
    cloudflare({
      viteEnvironment: {
        name: 'rsc',
        childEnvironments: ['ssr'],
      },
    }),
  ],
});
