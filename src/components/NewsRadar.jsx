import { motion, AnimatePresence } from 'framer-motion';
import { Radar, Loader2, Building2, ExternalLink, CheckCircle2, Inbox } from 'lucide-react';

// Valida el esquema de una URL antes de renderizarla como href: bloquea
// javascript:/data: que pudieran venir del feed RSS de terceros.
function safeUrl(u) {
  if (!u) return undefined;
  try {
    const parsed = new URL(u);
    return ['http:', 'https:'].includes(parsed.protocol) ? u : undefined;
  } catch {
    return undefined;
  }
}

/**
 * NewsRadar — panel de detección de empresa + noticias relevantes.
 * Sector-agnóstico: detecta cualquier compañía del perfil pegado y
 * muestra hasta 3 titulares recientes para usar como gancho.
 */
export function NewsRadar({ scanning, scanResult, onPickNews, selectedNews }) {
  const { entity, news, count, error } = scanResult || {};

  return (
    <section className="glass-card rounded-2xl p-6 md:p-8 relative overflow-hidden group">
      <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-emerald-500/5 blur-3xl group-hover:bg-emerald-500/10 transition-colors duration-700" />
      <div className="mb-6 flex items-center gap-3 relative z-10">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-500/10 text-emerald-400 shadow-[inset_0_0_15px_rgba(16,185,129,0.1)]">
          <Radar className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-base font-bold text-white tracking-wide">Radar de Actualidad</h2>
          <p className="text-xs text-zinc-400 font-medium">Detección automática de empresa y noticias clave</p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {scanning && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-3 py-6 text-sm text-emerald-300"
          >
            <Loader2 className="h-4 w-4 animate-spin" />
            Detectando empresa y buscando noticias recientes…
          </motion.div>
        )}

        {!scanning && error && (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-lg border border-amber-400/20 bg-amber-400/5 px-4 py-3 text-sm text-amber-200/80"
          >
            {error}
          </motion.div>
        )}

        {!scanning && !error && entity && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-3 rounded-lg border border-white/8 bg-white/[0.03] px-4 py-3">
              <Building2 className="h-5 w-5 shrink-0 text-emerald-400" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">
                  {entity.company || 'Empresa no detectada'}
                </p>
                <p className="text-xs text-zinc-500">
                  {entity.name ? `${entity.name} · ` : ''}
                  {entity.sector || 'Sector no determinado'}
                </p>
              </div>
            </div>

            {news && news.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  {count} noticia{count === 1 ? '' : 's'} relevante{count === 1 ? '' : 's'}
                </p>
                {news.map((item) => {
                  const isSelected = selectedNews === item.title;
                  const safeLink = safeUrl(item.link);
                  return (
                    <div
                      key={item.link || item.title}
                      role="button"
                      tabIndex={0}
                      onClick={() => onPickNews(isSelected ? '' : item.title)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          onPickNews(isSelected ? '' : item.title);
                        }
                      }}
                      className={`group/item flex w-full items-start gap-4 rounded-xl border p-4 text-left transition-all duration-300 hover:-translate-y-1 ${
                        isSelected
                          ? 'border-emerald-500/50 bg-emerald-500/15 shadow-[0_5px_20px_rgba(16,185,129,0.15)]'
                          : 'border-white/5 bg-black/20 hover:border-emerald-500/40 hover:bg-black/40 hover:shadow-lg'
                      }`}
                    >
                      <CheckCircle2
                        className={`mt-0.5 h-5 w-5 shrink-0 transition-colors ${
                          isSelected ? 'text-emerald-400' : 'text-zinc-600 group-hover/item:text-emerald-500/50'
                        }`}
                      />
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm font-semibold leading-snug transition-colors ${isSelected ? 'text-emerald-100' : 'text-zinc-300 group-hover/item:text-zinc-100'}`}>{item.title}</p>
                        <p className="mt-2 text-[11px] font-medium tracking-wide text-zinc-500 uppercase">
                          {item.source} <span className="mx-1 opacity-50">•</span> {item.pubDate}
                        </p>
                      </div>
                      {safeLink && (
                        <a
                          href={safeLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="mt-0.5 shrink-0 text-zinc-500 transition hover:text-emerald-300"
                          aria-label="Abrir noticia"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex items-center gap-2 py-3 text-sm text-zinc-500">
                <Inbox className="h-4 w-4" />
                Sin noticias recientes detectadas. Puedes añadir contexto manualmente abajo.
              </div>
            )}
          </motion.div>
        )}

        {!scanning && !error && !entity && (
          <p className="py-4 text-sm text-zinc-500">
            Pega un perfil y pulsa <span className="text-emerald-300">Escanear</span> para detectar la empresa y buscar noticias.
          </p>
        )}
      </AnimatePresence>
    </section>
  );
}