import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    cors: true,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  },
  resolve: {
    alias: {
      "@gua/shared": path.resolve(__dirname, "../shared/src"),
    },
  },
  define: {
    // Variables de entorno para desarrollo
    'import.meta.env.VITE_AES_KEY': JSON.stringify('dGVzdC1hZXMta2V5LWZvci1kZXZlbG9wbWVudA=='),
    'import.meta.env.VITE_GUA_SERVICE_URL': JSON.stringify('http://localhost:3000'),
    // ❌ TOKEN HARDCODEADO ELIMINADO - Ahora se obtiene del endpoint /bootstrap
    // Reemplazar process.env para que funcione en el navegador
    'process.env.NODE_ENV': JSON.stringify('production'),
    'process.env': '{}',
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
  }
});