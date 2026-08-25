import { Radar, Search, Sparkles, KeyRound } from 'lucide-react';
import { Modal } from './Modal';

const STEPS = [
  {
    icon: Search,
    title: '1. Pega el perfil',
    body: 'Copia el perfil de LinkedIn del contacto (de cualquier sector: concesionarios, banca/financieras, flotas/renting, marcas/importadores). El sistema detecta la empresa automáticamente.',
  },
  {
    icon: Radar,
    title: '2. Escanea actualidad',
    body: 'Fin Hunter identifica la compañía y busca en Google News una noticia reciente para usarla como gancho en tu mensaje.',
  },
  {
    icon: Sparkles,
    title: '3. Genera 3 ángulos',
    body: 'Elige objetivo (conexión, follow-up o reunión) y tono. Recibirás un análisis estratégico del perfil y tres redacciones con enfoques distintos.',
  },
  {
    icon: KeyRound,
    title: '4. Clave API',
    body: 'En desarrollo, introduce tu clave DeepSeek en Configuración. En producción (Vercel) se lee del entorno del servidor y no necesitas tocar nada.',
  },
];

export function HelpModal({ open, onClose }) {
  return (
    <Modal open={open} onClose={onClose} title="Cómo funciona Fin Hunter" subtitle="Prospección B2B con visión 360° del ciclo automotriz y financiero">
      <div className="space-y-4">
        {STEPS.map(({ icon: Icon, title, body }) => (
          <div key={title} className="flex gap-4">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-emerald-400/20 bg-emerald-400/5 text-emerald-300">
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">{title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-zinc-400">{body}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6 rounded-xl border border-emerald-400/15 bg-emerald-400/5 p-4">
        <p className="text-sm text-emerald-100/80">
          <span className="font-semibold text-emerald-300">Tu diferencial:</span> casi 20 años
          entre ventas de vehículos, departamento de negocios (Financiera) y banca. Visión global
          de la operación, de la escucha activa al cierre y la financiación.
        </p>
      </div>
    </Modal>
  );
}