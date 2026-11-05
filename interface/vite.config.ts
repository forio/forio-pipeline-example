import react from '@vitejs/plugin-react-swc';
import fs from 'fs';
import path from 'path';
import { defineConfig } from 'vite';
import i18nextLoader from 'vite-plugin-i18next-loader';
import tsconfigPaths from 'vite-tsconfig-paths';

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: 'localhost',
    port: 8888,
  },
  base: './',
  build: {
    // The repository root is Epicenter's src/ and the built site is served from target/interface.
    // Locally that is ../target/interface. In the pipeline's build container the working directory
    // is /src/interface and the project's target directory is mounted at /target, so write there.
    outDir: fs.existsSync('/target') ? '/target/interface' : '../target/interface',
    emptyOutDir: true,
  },
  plugins: [
    react(),
    tsconfigPaths(),
    i18nextLoader({
      paths: ['src/assets/lang'],
      namespaceResolution: 'relativePath',
    }),
  ],
  resolve: {
    alias: {
      '~': path.resolve(__dirname, './src'),
    },
  },
});
