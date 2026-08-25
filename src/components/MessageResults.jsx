import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check, Brain, AlertCircle, FileText } from 'lucide-react';
import { MESSAGE_ANGLES } from '../lib/config';

/**
 * MessageResults — muestra el análisis estratégico y las 3 opciones de mensaje.
 * Cada opción se etiqueta con su ángulo (MESSAGE_ANGLES) y permite copiar.
 */
export function MessageResults({ result, generating }) {
  const [copied, setCopied] = useState('');
  const copyTimer = useRef(null);

  useEffect(() => () => clearTimeout(copyTimer.current), []);

  if (generating) return <LoadingState />;
  if (!result) return null;
  if (result.error) return <ErrorState message={result.error} />;

  const options = [
    { key: 'opcion_1', ...MESSAGE_ANGLES[0] },
    { key: 'opcion_2', ...MESSAGE_ANGLES[1] },
    { key: 'opcion_3', ...MESSAGE_ANGLES[2] },
  ].filter((o) => result[o.key]);

  const copy = async (key, text) => {
    try {
      await navigator.clipboard.writeText(text);
      clearTimeout(copyTimer.current);
      setCopied(key);
      copyTimer.current = setTimeout(() => setCopied(''), 2000);
    } catch {
      /* clipboard no disponible */
    }
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      {result.analisis_perfil && (
        <div className="glass-card rounded-2xl p-5 md:p-6">
          <div className="mb-3 flex items-center gap-2">
            <Brain className="h-5 w-5 text-emerald-400" />
            <h2 className="text-sm font-bold text-white">Análisis estratégico del perfil</h2>
          </div>
          <p className="text-sm leading-relaxed text-zinc-300">{result.analisis_perfil}</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {options.map((opt, i) => {
          const text = result[opt.key] || '';
          const chars = text.length;
          return (
            <motion.article
              key={opt.key}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.08 }}
              className="glass-card flex flex-col rounded-2xl p-5"
            >
              <div className="mb-3 flex items-start justify-between gap-2">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                    Opción {opt.id}
                  </span>
                  <h3 className="mt-1 text-sm font-bold leading-tight text-white">{opt.title}</h3>
                </div>
                <span className="shrink-0 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] tabular-nums text-zinc-400">
                  {chars} car.
                </span>
              </div>

              <p className="mb-4 text-xs leading-relaxed text-zinc-500">{opt.description}</p>

              <div className="custom-scrollbar flex-1 overflow-y-auto rounded-lg border border-white/8 bg-black/30 p-3 text-sm leading-relaxed text-zinc-200 whitespace-pre-wrap">
                {text}
              </div>

              <button
                type="button"
                onClick={() => copy(opt.key, text)}
                className="mt-3 flex items-center justify-center gap-2 rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-xs font-semibold text-emerald-200 transition hover:bg-emerald-400/20"
              >
                {copied === opt.key ? (
                  <>
                    <Check className="h-3.5 w-3.5" /> Copiado
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" /> Copiar mensaje
                  </>
                )}
              </button>
            </motion.article>
          );
        })}
      </div>
    </motion.section>
  );
}

function LoadingState() {
  return (
    <div className="glass-card grid place-items-center rounded-2xl p-12">
      <div className="flex flex-col items-center gap-3 text-emerald-300">
        <FileText className="h-8 w-8 animate-pulse" />
        <p className="text-sm font-medium">Redactando tus tres ángulos de mensaje…</p>
        <p className="text-xs text-zinc-500">El análisis y la redacción llevan unos segundos.</p>
      </div>
    </div>
  );
}

function ErrorState({ message }) {
  return (
    <div className="glass-card flex items-start gap-3 rounded-2xl p-5">
      <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
      <div>
        <h3 className="text-sm font-semibold text-white">No se pudo generar</h3>
        <p className="mt-1 text-sm text-zinc-400">{message}</p>
      </div>
    </div>
  );
}