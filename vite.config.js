import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { scanNews, generateMessages, validateScanPayload, validateGeneratePayload } from './api/_lib/deepseek.js';

/**
 * Dev-only plugin: serves /api/scan-news and /api/generate locally by
 * delegating to the SAME shared module the Vercel functions use.
 * This removes the duplication that plagued the original app.
 *
 * En dev no hay secreto de servidor, así que se admite la clave del cliente
 * (introducida en Ajustes). NUNCA se lee VITE_DEEPSEEK_API_KEY: ese prefijo
 * se inlinea en el bundle del cliente y filtraría la clave.
 */
function localApiPlugin() {
  // Carga única al arrancar el dev server, no por petición.
  const env = loadEnv('', process.cwd(), '');
  const serverKey = env.DEEPSEEK_API_KEY;

  return {
    name: 'local-api-plugin',
    configureServer(server) {
      const json = (res, status, body) => {
        res.statusCode = status;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(body));
      };

      const readBody = (req) =>
        new Promise((resolve) => {
          let body = '';
          req.on('data', (chunk) => { body += chunk; });
          req.on('end', () => {
            try { resolve(JSON.parse(body || '{}')); }
            catch { resolve({}); }
          });
        });

      server.middlewares.use('/api/scan-news', async (req, res) => {
        if (req.method === 'OPTIONS') { res.statusCode = 204; return res.end(); }
        if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });
        try {
          const { profileText, apiKey } = await readBody(req);
          const validated = validateScanPayload({ profileText });
          if (validated.error) return json(res, 400, { error: validated.error });
          const key = apiKey || serverKey;
          const result = await scanNews(validated.profileText, key);
          return json(res, result.error ? 400 : 200, result);
        } catch {
          return json(res, 500, { error: 'Error interno del servidor.' });
        }
      });

      server.middlewares.use('/api/generate', async (req, res) => {
        if (req.method === 'OPTIONS') { res.statusCode = 204; return res.end(); }
        if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });
        try {
          const payload = await readBody(req);
          const { apiKey, ...rest } = payload;
          const validated = validateGeneratePayload(rest);
          if (validated.error) return json(res, 400, { error: validated.error });
          const key = apiKey || serverKey;
          const result = await generateMessages(validated, key);
          return json(res, result.error ? 400 : 200, result);
        } catch {
          return json(res, 500, { error: 'Error interno del servidor.' });
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), localApiPlugin()],
});