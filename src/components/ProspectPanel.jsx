import { ClipboardPaste, Radar, Sparkles, Loader2 } from 'lucide-react';

/**
 * ProspectPanel — entrada del perfil, contexto manual y acciones principales
 * (escanear noticias + generar mensajes).
 */
export function ProspectPanel({
  profileText,
  onProfileChange,
  contextText,
  onContextChange,
  onScan,
  onGenerate,
  scanning,
  generating,
  canScan,
  canGenerate,
}) {
  return (
    <section className="glass-card rounded-2xl p-5 md:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-white">Perfil del contacto</h2>
          <p className="text-xs text-zinc-500">Pega el perfil de LinkedIn (cualquier sector)</p>
        </div>
        <button
          type="button"
          onClick={async () => {
            try {
              const text = await navigator.clipboard.readText();
              if (text) onProfileChange(text);
            } catch {
              /* clipboard no disponible */
            }
          }}
          className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-zinc-300 transition hover:border-emerald-400/40 hover:text-emerald-300"
        >
          <ClipboardPaste className="h-3.5 w-3.5" />
          Pegar
        </button>
      </div>

      <textarea
        value={profileText}
        onChange={(e) => onProfileChange(e.target.value)}
        rows={7}
        aria-label="Perfil del contacto"
        placeholder="Pega aquí el perfil de LinkedIn del contacto: nombre, cargo, empresa, trayectoria, descripción…"
        className="glass-input custom-scrollbar w-full resize-y rounded-lg p-3 text-sm leading-relaxed text-white outline-none placeholder:text-zinc-600"
      />

      <div className="mt-3">
        <label
          htmlFor="fh-context"
          className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-400"
        >
          Contexto adicional (opcional)
        </label>
        <input
          id="fh-context"
          type="text"
          value={contextText}
          onChange={(e) => onContextChange(e.target.value)}
          placeholder="Ej. Acaba de inaugurar una nueva concesión en Madrid"
          className="glass-input w-full rounded-lg p-2.5 text-sm text-white outline-none placeholder:text-zinc-600"
        />
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={onScan}
          disabled={!canScan || scanning}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm font-semibold text-emerald-200 transition hover:bg-emerald-400/20 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {scanning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Radar className="h-4 w-4" />}
          {scanning ? 'Escaneando…' : 'Escanear actualidad'}
        </button>
        <button
          type="button"
          onClick={onGenerate}
          disabled={!canGenerate || generating}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-500 px-4 py-3 text-sm font-bold text-[#070a0c] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {generating ? 'Generando…' : 'Generar mensajes'}
        </button>
      </div>
    </section>
  );
}