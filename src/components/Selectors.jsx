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
      <div role="radiogroup" aria-label="Objetivo del mensaje" className="grid grid-cols-1 gap-2 sm:grid-cols-3">
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
              className={`relative overflow-hidden rounded-xl border p-3 text-left transition ${
                active
                  ? 'border-emerald-400/50 bg-emerald-400/10'
                  : 'border-white/8 bg-white/[0.02] hover:border-emerald-400/25'
              }`}
            >
              {active && (
                <motion.div
                  layoutId="phase-glow"
                  className="absolute inset-0 -z-10 bg-gradient-to-br from-emerald-400/10 to-transparent"
                />
              )}
              <Icon className={`h-5 w-5 ${active ? 'text-emerald-400' : 'text-zinc-400'}`} />
              <p className={`mt-2 text-sm font-semibold ${active ? 'text-white' : 'text-zinc-300'}`}>
                {obj.label}
              </p>
              <p className="mt-0.5 text-[11px] leading-tight text-zinc-500">{obj.hint}</p>
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
      <div role="radiogroup" aria-label="Tono de redacción" className="flex flex-wrap gap-2">
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
              className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                active
                  ? 'border-emerald-400/50 bg-emerald-400/15 text-emerald-200'
                  : 'border-white/8 bg-white/[0.02] text-zinc-400 hover:border-emerald-400/25 hover:text-zinc-200'
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