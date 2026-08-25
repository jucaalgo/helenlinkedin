import { Crosshair, HelpCircle, Settings } from 'lucide-react';

export function Header({ onHelp, onSettings }) {
  return (
    <header className="relative z-10 flex items-center justify-between px-6 py-5 md:px-10">
      <div className="flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 glow-emerald">
          <Crosshair className="h-6 w-6 text-[#070a0c]" strokeWidth={2.4} />
        </div>
        <div>
          <p className="text-xl font-bold tracking-tight text-white md:text-2xl">
            Fin<span className="text-emerald-400">Hunter</span>
          </p>
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-emerald-200/50">
            Prospección B2B · Automoción & Financiación
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onHelp}
          className="grid h-10 w-10 place-items-center rounded-lg border border-white/10 bg-white/5 text-zinc-300 transition hover:border-emerald-400/40 hover:text-emerald-300"
          aria-label="Ayuda"
        >
          <HelpCircle className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={onSettings}
          className="grid h-10 w-10 place-items-center rounded-lg border border-white/10 bg-white/5 text-zinc-300 transition hover:border-emerald-400/40 hover:text-emerald-300"
          aria-label="Configuración"
        >
          <Settings className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}