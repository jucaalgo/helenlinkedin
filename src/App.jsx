import { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { HelpModal } from './components/HelpModal';
import { SettingsModal } from './components/SettingsModal';
import { NewsRadar } from './components/NewsRadar';
import { PhaseSelector, ToneSelector } from './components/Selectors';
import { ProspectPanel } from './components/ProspectPanel';
import { MessageResults } from './components/MessageResults';
import { useProspectApi } from './hooks/useProspectApi';
import {
  DEFAULT_IDENTITY,
  DEFAULT_ADVANTAGE,
  STORAGE_KEYS,
} from './lib/config';

const loadStored = (key, fallback) => localStorage.getItem(key) || fallback;

export default function App() {
  // Lectura síncrona en init: evita el doble render del efecto de carga.
  const [profileText, setProfileText] = useState('');
  const [contextText, setContextText] = useState('');
  const [objective, setObjective] = useState('conexion');
  const [tone, setTone] = useState('consultivo');
  const [selectedNews, setSelectedNews] = useState('');
  const [scanResult, setScanResult] = useState(null);
  const [result, setResult] = useState(null);

  const [identity, setIdentity] = useState(() => loadStored(STORAGE_KEYS.identity, DEFAULT_IDENTITY));
  const [advantage, setAdvantage] = useState(() => loadStored(STORAGE_KEYS.advantage, DEFAULT_ADVANTAGE));
  // La clave API vive solo en memoria: nunca se persiste en localStorage
  // (sería legible por cualquier XSS en el origen).
  const [apiKey, setApiKey] = useState('');
  const [showHelp, setShowHelp] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const { scanning, generating, scan, generate } = useProspectApi();
  const scanAbort = useRef(null);
  const genAbort = useRef(null);

  // Limpiar el radar cuando el perfil cambia: evita mostrar el resultado
  // (empresa/noticias) de un perfil anterior.
  useEffect(() => {
    setScanResult(null);
    setSelectedNews('');
  }, [profileText]);

  const handleSaveSettings = ({ identity: id, advantage: adv, apiKey: key }) => {
    setIdentity(id);
    setAdvantage(adv);
    setApiKey(key);
    localStorage.setItem(STORAGE_KEYS.identity, id);
    localStorage.setItem(STORAGE_KEYS.advantage, adv);
    // No persistimos la clave API.
  };

  const handleScan = async () => {
    scanAbort.current?.abort();
    const controller = new AbortController();
    scanAbort.current = controller;
    setSelectedNews('');
    setResult(null);
    // La clave solo viaja en el body en desarrollo; en producción el
    // servidor la lee de su env y el campo se ignora.
    const devKey = import.meta.env.DEV ? apiKey : undefined;
    const res = await scan(profileText, devKey, controller.signal);
    if (!controller.signal.aborted) setScanResult(res);
  };

  const handleGenerate = async () => {
    genAbort.current?.abort();
    const controller = new AbortController();
    genAbort.current = controller;
    setResult(null);
    const devKey = import.meta.env.DEV ? apiKey : undefined;
    const res = await generate(
      {
        profileText,
        contextText,
        selectedNews,
        objective,
        tone,
        userIdentity: identity,
        userAdvantage: advantage,
        apiKey: devKey,
      },
      controller.signal,
    );
    if (!controller.signal.aborted) setResult(res);
  };

  const canProceed = profileText.trim().length > 15;

  return (
    <div className="min-h-screen bg-[#070a0c] text-zinc-100 selection:bg-emerald-500/30">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-900/20 via-[#070a0c]/80 to-[#070a0c]" />
      <Header onHelp={() => setShowHelp(true)} onSettings={() => setShowSettings(true)} />

      <main className="mx-auto max-w-6xl px-4 pb-20 md:px-6">
        <Hero />

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <div className="space-y-5">
            <ProspectPanel
              profileText={profileText}
              onProfileChange={setProfileText}
              contextText={contextText}
              onContextChange={setContextText}
              onScan={handleScan}
              onGenerate={handleGenerate}
              scanning={scanning}
              generating={generating}
              canScan={canProceed}
              canGenerate={canProceed}
            />
            <NewsRadar
              scanning={scanning}
              scanResult={scanResult}
              onPickNews={setSelectedNews}
              selectedNews={selectedNews}
            />
          </div>

          <div className="space-y-5">
            <div className="glass-card space-y-5 rounded-2xl p-5 md:p-6">
              <PhaseSelector value={objective} onChange={setObjective} />
              <ToneSelector value={tone} onChange={setTone} />
            </div>
            <div className="glass-card rounded-2xl p-5 md:p-6">
              <h2 className="mb-2 text-sm font-bold text-white">Tus ángulos de mensaje</h2>
              <p className="text-xs text-zinc-500">
                Fin Hunter redacta tres enfoques distintos basados en tu visión 360° del ciclo
                comercial y financiero.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-5">
          <MessageResults result={result} generating={generating} />
        </div>
      </main>

      <HelpModal open={showHelp} onClose={() => setShowHelp(false)} />
      <SettingsModal
        key={`${identity}|${advantage}|${apiKey}`}
        open={showSettings}
        onClose={() => setShowSettings(false)}
        identity={identity}
        advantage={advantage}
        apiKey={apiKey}
        onSave={handleSaveSettings}
      />
    </div>
  );
}

function Hero() {
  return (
    <section className="px-2 py-10 md:py-16 text-center animate-slide-up">
      <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-3 py-1 mb-6">
        <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse-glow"></span>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-400">
          Helen Yandy Reyes
        </p>
      </div>
      <h1 className="mx-auto max-w-4xl text-4xl font-extrabold leading-tight tracking-tight text-white md:text-6xl lg:text-7xl">
        Prospección B2B con{' '}
        <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-500 bg-clip-text text-transparent drop-shadow-sm">
          Visión 360°
        </span>
      </h1>
      <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-zinc-400 md:text-lg">
        Extrae la esencia de la concesión, encuentra su última noticia clave y genera mensajes de contacto con la autoridad del ciclo comercial y financiero.
      </p>
    </section>
  );
}