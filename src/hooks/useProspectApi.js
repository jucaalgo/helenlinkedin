import { useState, useCallback } from 'react';

/**
 * useProspectApi — hook que encapsula las dos llamadas a la API
 * (scan-news y generate) y su estado de carga.
 *
 * Acepta un AbortSignal para cancelar peticiones solapadas o al desmontar.
 * La clave API viaja en el body solo para desarrollo local; en producción
 * (Vercel) se lee del env del servidor y el cliente no la necesita.
 */
export function useProspectApi() {
  const [scanning, setScanning] = useState(false);
  const [generating, setGenerating] = useState(false);

  const scan = useCallback(async (profileText, apiKey, signal) => {
    setScanning(true);
    try {
      const res = await fetch('/api/scan-news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileText, apiKey }),
        signal,
      });
      const data = await res.json();
      if (!res.ok) return { error: data.error || 'Error al escanear noticias.' };
      return data;
    } catch (e) {
      if (e.name === 'AbortError') return { error: 'aborted' };
      return { error: 'No se pudo conectar con el servidor.' };
    } finally {
      setScanning(false);
    }
  }, []);

  const generate = useCallback(async (payload, signal) => {
    setGenerating(true);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal,
      });
      const data = await res.json();
      if (!res.ok) return { error: data.error || 'Error al generar los mensajes.' };
      return data;
    } catch (e) {
      if (e.name === 'AbortError') return { error: 'aborted' };
      return { error: 'No se pudo conectar con el servidor.' };
    } finally {
      setGenerating(false);
    }
  }, []);

  return { scanning, generating, scan, generate };
}