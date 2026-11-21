import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

// Development middleware: proxy /api/* to Vercel Serverless Function handlers
// Uses process.cwd() for absolute paths so it works from any working directory,
// including when Vite loads config from its internal .vite-temp cache folder.
function vercelApiDevPlugin() {
  const projectRoot = process.cwd();

  return {
    name: 'vercel-api-dev-server',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url.startsWith('/api')) {
          return next();
        }

        try {
          const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
          const pathname = urlObj.pathname; // e.g. /api/auth

          // Extract handler name from path:  /api/auth → auth
          const routeName = pathname.replace(/^\/api\/?/, '').split('/')[0] || 'index';

          // Build an absolute file URL — this avoids .vite-temp resolution issues
          const absPath = path.join(projectRoot, 'api', `${routeName}.js`);
          // Add a cache-busting timestamp so edits to api files reload in dev
          const fileUrl = pathToFileURL(absPath).href + `?t=${Date.now()}`;

          const module = await import(/* @vite-ignore */ fileUrl);

          if (module.default && typeof module.default === 'function') {
            await module.default(req, res);
          } else {
            res.statusCode = 404;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: false, message: `API route ${pathname} not found` }));
          }
        } catch (err) {
          console.error('[API Dev Error]', err.message);
          if (!res.headersSent) {
            res.statusCode = err.status || 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: false, message: err.message || 'Internal Server Error' }));
          }
        }
      });
    }
  };
}

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    vercelApiDevPlugin()
  ],
  server: {
    port: 3000,
    open: false
  },
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          // Split react ecosystem into its own chunk
          'react-vendor': ['react', 'react-dom'],
          // Recharts is large – isolate it
          'recharts-vendor': ['recharts'],
          // Lucide icons
          'lucide-vendor': ['lucide-react'],
          // DB / server libs (only used in api/, but included in bundle via imports)
          'utils': ['date-fns', 'clsx', 'tailwind-merge']
        }
      }
    }
  }
});

