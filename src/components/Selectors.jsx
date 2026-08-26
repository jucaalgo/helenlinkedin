import { motion } from 'framer-motion';
import { UserPlus, MessageSquare, CalendarClock } from 'lucide-react';
import { OBJECTIVES, TONES } from '../lib/config';

const PHASE_ICONS = { UserPlus, MessageSquare, CalendarClock };

/**
 * PhaseSelector — elige el objetivo del mensaje (conexión / follow-up / reunión).
 */
export function PhaseSelector({ value, onChange }) {
  return (
    <fieldset>
      <legend className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">
        Objetivo del mensaje
      </legend>
      <div role="radiogroup" aria-label="Objetivo del mensaje" className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {OBJECTIVES.map((obj) => {
          const Icon = PHASE_ICONS[obj.icon] || MessageSquare;
          const active = value === obj.id;
          return (
            <button
              type="button"
              key={obj.id}
              role="radio"
              aria-checked={active}
              onClick={() => onChange(obj.id)}
              className={`relative overflow-hidden rounded-xl border p-4 text-left transition-all duration-300 ${
                active
                  ? 'border-emerald-500/50 bg-emerald-500/15 shadow-[0_5px_20px_rgba(16,185,129,0.15)] -translate-y-1'
                  : 'border-white/5 bg-black/20 hover:border-emerald-500/30 hover:bg-black/40 hover:shadow-lg hover:-translate-y-0.5'
              }`}
            >
              {active && (
                <motion.div
                  layoutId="phase-glow"
                  className="absolute inset-0 -z-10 bg-gradient-to-br from-emerald-500/20 to-transparent"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                />
              )}
              <Icon className={`h-6 w-6 transition-colors ${active ? 'text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'text-zinc-500'}`} />
              <p className={`mt-3 text-sm font-bold tracking-wide transition-colors ${active ? 'text-white' : 'text-zinc-300'}`}>
                {obj.label}
              </p>
              <p className={`mt-1 text-[11px] leading-relaxed transition-colors ${active ? 'text-emerald-100/80' : 'text-zinc-500'}`}>{obj.hint}</p>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

/**
 * ToneSelector — elige el tono de redacción.
 */
export function ToneSelector({ value, onChange }) {
  return (
    <fieldset>
      <legend className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">Tono</legend>
      <div role="radiogroup" aria-label="Tono de redacción" className="flex flex-wrap gap-3">
        {TONES.map((tone) => {
          const active = value === tone.id;
          return (
            <button
              type="button"
              key={tone.id}
              role="radio"
              aria-checked={active}
              onClick={() => onChange(tone.id)}
              title={tone.hint}
              className={`relative rounded-full border px-5 py-2.5 text-xs font-bold tracking-wide transition-all duration-300 uppercase ${
                active
                  ? 'border-emerald-500 bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                  : 'border-white/10 bg-black/30 text-zinc-400 hover:border-emerald-500/50 hover:text-emerald-300 hover:bg-black/50'
              }`}
            >
              {tone.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}