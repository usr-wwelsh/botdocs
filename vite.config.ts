import { defineConfig } from 'vite';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  build: {
    outDir: 'dist-client',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/client/main.ts'),
      },
      output: {
        entryFileNames: 'bundle.js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith('.wasm')) {
            return 'wasm/[name][extname]';
          }
          return 'bundle.[ext]';
        },
      },
    },
    minify: 'terser',
    sourcemap: false,
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  optimizeDeps: {
    exclude: ['@wllama/wllama'],
  },
  assetsInclude: ['**/*.wasm'],
});
