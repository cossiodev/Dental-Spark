import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  build: {
    // Configuración para asegurar consistencia en producción
    rollupOptions: {
      output: {
        manualChunks: undefined,
        // Asegurar que los nombres de archivos sean predecibles y consistentes
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      },
    },
    // Asegurar que se genere una carpeta dist limpia en cada build
    emptyOutDir: true,
    // Disable sourcemap in production to reduce build time
    sourcemap: mode !== 'production',
    // Ensure minification works
    minify: mode === 'production',
    // Make Vercel builds faster
    reportCompressedSize: false
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Optimization for faster builds
  optimizeDeps: {
    include: ['react', 'react-dom'],
    esbuildOptions: {
      target: 'es2020'
    }
  }
}));
