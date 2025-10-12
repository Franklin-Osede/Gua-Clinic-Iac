import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // Variables de entorno para desarrollo
    'import.meta.env.VITE_AES_KEY': JSON.stringify('dGVzdC1hZXMta2V5LWZvci1kZXZlbG9wbWVudA=='),
    'import.meta.env.VITE_GUA_SERVICE_URL': JSON.stringify('http://localhost:3000'),
    'import.meta.env.VITE_API_BEARER_TOKEN': JSON.stringify('test-bearer-token'),
  },
  build: {
    lib: {
      entry: 'src/widget/index.tsx',
      name: 'GuaWidget',
      fileName: (format) => `gua-widget.${format}.js`,
      formats: ['es', 'iife']
    },
    rollupOptions: {
      external: ['react', 'react-dom'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM'
        }
      }
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts']
  }
});