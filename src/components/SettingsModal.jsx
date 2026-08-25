import { useState } from 'react';
import { KeyRound, User, BadgeCheck } from 'lucide-react';
import { Modal } from './Modal';
import { DEFAULT_IDENTITY, DEFAULT_ADVANTAGE } from '../lib/config';

const isDev = import.meta.env.DEV;

export function SettingsModal({ open, onClose, identity, advantage, apiKey, onSave }) {
  const [draftIdentity, setDraftIdentity] = useState(identity);
  const [draftAdvantage, setDraftAdvantage] = useState(advantage);
  const [draftKey, setDraftKey] = useState(apiKey);

  const handleSave = (e) => {
    e.preventDefault();
    onSave({ identity: draftIdentity, advantage: draftAdvantage, apiKey: draftKey });
    onClose();
  };

  const reset = () => {
    setDraftIdentity(DEFAULT_IDENTITY);
    setDraftAdvantage(DEFAULT_ADVANTAGE);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Configuración"
      subtitle="Personaliza tu identidad y clave API"
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSave} className="space-y-5">
        <Field icon={User} label="Identidad (remitente)" htmlFor="fh-identity">
          <textarea
            id="fh-identity"
            value={draftIdentity}
            onChange={(e) => setDraftIdentity(e.target.value)}
            rows={2}
            className="glass-input custom-scrollbar w-full resize-none rounded-lg p-3 text-sm text-white outline-none"
          />
        </Field>

        <Field icon={BadgeCheck} label="Ventaja diferencial" htmlFor="fh-advantage">
          <textarea
            id="fh-advantage"
            value={draftAdvantage}
            onChange={(e) => setDraftAdvantage(e.target.value)}
            rows={4}
            className="glass-input custom-scrollbar w-full resize-none rounded-lg p-3 text-sm text-white outline-none"
          />
        </Field>

        {isDev && (
          <Field icon={KeyRound} label="Clave API DeepSeek (solo desarrollo local)" htmlFor="fh-key">
            <input
              id="fh-key"
              type="password"
              value={draftKey}
              onChange={(e) => setDraftKey(e.target.value)}
              placeholder="sk-..."
              className="glass-input w-full rounded-lg p-3 text-sm text-white outline-none"
            />
            <p className="mt-2 text-xs text-zinc-500">
              En producción (Vercel) se lee de la variable de entorno{' '}
              <code className="text-emerald-300">DEEPSEEK_API_KEY</code> y este campo no se muestra.
              La clave no se persiste en el navegador.
            </p>
          </Field>
        )}

        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={reset}
            className="text-xs font-medium text-zinc-400 transition hover:text-emerald-300"
          >
            Restaurar identidad por defecto
          </button>
          <button
            type="submit"
            className="rounded-lg bg-gradient-to-r from-emerald-400 to-teal-500 px-5 py-2.5 text-sm font-semibold text-[#070a0c] transition hover:opacity-90"
          >
            Guardar
          </button>
        </div>
      </form>
    </Modal>
  );
}

function Field({ icon: Icon, label, htmlFor, children }) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-400"
      >
        <Icon className="h-4 w-4 text-emerald-400" />
        {label}
      </label>
      {children}
    </div>
  );
}