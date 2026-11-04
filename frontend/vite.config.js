import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  // Set VITE_API_TARGET in frontend/.env.local if Laravel runs on another port (e.g. 8001).
  const env = loadEnv(mode, process.cwd(), '');
  const target = env.VITE_API_TARGET || 'http://127.0.0.1:8000';
  const proxy = Object.fromEntries(['/api', '/sanctum', '/storage'].map(path => [
    path, { target, changeOrigin: true },
  ]));
  return {
    plugins: [react(), tailwindcss()],
    server: { port: 5173, strictPort: true, proxy },
    preview: { port: 5173, strictPort: true, proxy },
  };
});