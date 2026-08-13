import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// One value per build, baked into the bundle AND written to version.json, so
// the running app can tell whether it is the build the server is serving.
// Deriving both from the same constant is what keeps them from drifting.
const BUILD_VERSION = new Date().toISOString();

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'emit-build-version',
      apply: 'build',
      generateBundle() {
        this.emitFile({
          type: 'asset',
          fileName: 'version.json',
          source: JSON.stringify({ version: BUILD_VERSION }),
        });
      },
    },
  ],
  define: {
    __BUILD_VERSION__: JSON.stringify(BUILD_VERSION),
  },
  base: './',
});
