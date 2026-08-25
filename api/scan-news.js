import { scanNews, validateScanPayload } from './_lib/deepseek.js';

// Orígenes permitidos. En producción solo el dominio desplegado + previews;
// en desarrollo, el dev server de Vite. Nunca wildcard: la función está
// autenticada frente a DeepSeek y un origen abierto la convertiría en proxy
// de facturación a la clave de Helen.
const ALLOWED_ORIGINS = new Set([
  'https://helen-dashboard.vercel.app',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
]);

function setCors(req, res) {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS, POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default async function handler(req, res) {
  setCors(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const validated = validateScanPayload(req.body);
    if (validated.error) return res.status(400).json({ error: validated.error });

    // En producción la clave vive solo en el entorno del servidor; el campo
    // del cliente se ignora para evitar que terceros la pinchen o la bypassen.
    const key = process.env.DEEPSEEK_API_KEY;
    const result = await scanNews(validated.profileText, key);
    return res.status(result.error ? 400 : 200).json(result);
  } catch {
    return res.status(500).json({ error: 'Error interno del servidor.' });
  }
}