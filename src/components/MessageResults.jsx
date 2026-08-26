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
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="space-y-5"
    >
      {result.analisis_perfil && (
        <div className="glass-card rounded-2xl p-6 md:p-8 animate-slide-up relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Brain className="h-24 w-24 text-emerald-400" />
          </div>
          <div className="relative z-10">
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-full bg-emerald-500/20 p-2 text-emerald-400">
                <Brain className="h-5 w-5" />
              </div>
              <h2 className="text-base font-bold text-white tracking-wide">Análisis Estratégico del Perfil</h2>
            </div>
            <p className="text-sm leading-relaxed text-zinc-300 md:text-base max-w-4xl">{result.analisis_perfil}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {options.map((opt, i) => {
          const text = result[opt.key] || '';
          const chars = text.length;
          return (
            <motion.article
              key={opt.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.1, ease: "easeOut" }}
              className="glass-card group flex flex-col rounded-2xl p-6 relative overflow-hidden"
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <span className="inline-flex mb-2 items-center rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-emerald-400 border border-emerald-500/20">
                    Opción {opt.id}
                  </span>
                  <h3 className="text-sm font-extrabold leading-tight text-white">{opt.title}</h3>
                </div>
                <span className="shrink-0 rounded-full bg-black/40 border border-white/5 px-2.5 py-1 text-[10px] font-medium tabular-nums text-zinc-400">
                  {chars} car.
                </span>
              </div>

              <p className="mb-5 text-xs leading-relaxed text-zinc-400 border-l-2 border-emerald-500/30 pl-3">{opt.description}</p>

              <div className="custom-scrollbar flex-1 overflow-y-auto rounded-xl border border-white/5 bg-black/40 p-4 text-sm leading-relaxed text-zinc-200 whitespace-pre-wrap transition-colors group-hover:bg-black/60">
                {text}
              </div>

              <button
                type="button"
                onClick={() => copy(opt.key, text)}
                className={`mt-4 flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-3 text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
                  copied === opt.key
                    ? 'border-emerald-500 bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                    : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 hover:border-emerald-500/50'
                }`}
              >
                {copied === opt.key ? (
                  <>
                    <Check className="h-4 w-4" /> Copiado con éxito
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" /> Copiar Mensaje
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
    <div className="glass-card rounded-2xl p-8 md:p-12 relative overflow-hidden skeleton-shimmer">
      <div className="flex flex-col items-center justify-center gap-5 relative z-10">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" />
          <div className="relative rounded-full bg-emerald-500/20 p-4 text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
            <Brain className="h-8 w-8 animate-pulse" />
          </div>
        </div>
        <div className="text-center">
          <h3 className="text-base font-bold text-white tracking-wide">Analizando perfil y redactando mensajes...</h3>
          <p className="mt-2 text-sm text-zinc-400 max-w-sm mx-auto">Aplicando la visión 360º de Helen para estructurar los ángulos comerciales y financieros.</p>
        </div>
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