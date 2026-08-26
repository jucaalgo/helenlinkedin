/**
 * Fin Hunter — módulo compartido de lógica DeepSeek + noticias.
 *
 * Lo usan tanto las Vercel functions (api/scan-news.js, api/generate.js)
 * como el plugin de Vite para dev (vite.config.js). Una sola fuente de
 * verdad para los prompts: sin duplicación entre prod y dev.
 */

const DEEPSEEK_URL = 'https://api.deepseek.com/chat/completions';
const MODEL = 'deepseek-chat';

/* ------------------------------------------------------------------ */
/*  Input validation (server boundary)                                */
/* ------------------------------------------------------------------ */

const MAX_PROFILE = 8000;
const MAX_CONTEXT = 500;
const MAX_NEWS = 500;
const MAX_IDENTITY = 400;
const MAX_ADVANTAGE = 800;
const VALID_OBJECTIVES = new Set(['conexion', 'followup', 'reunion']);
const VALID_TONES = new Set(['ejecutivo', 'consultivo', 'cercano']);

function isNonEmptyString(v, max) {
  return typeof v === 'string' && v.trim().length > 0 && v.length <= max;
}

/**
 * Valida el payload de /api/generate. Devuelve {error} si algo falla,
 * o un payload saneado y acotado si todo está bien.
 */
export function validateGeneratePayload(raw) {
  if (!raw || typeof raw !== 'object') {
    return { error: 'Cuerpo de la petición inválido.' };
  }
  const { profileText, contextText, selectedNews, objective, tone, userIdentity, userAdvantage } = raw;

  if (!isNonEmptyString(profileText, MAX_PROFILE)) {
    return { error: 'Pega el perfil o la trayectoria del contacto (máx. 8.000 caracteres).' };
  }

  const saneado = {
    profileText: profileText.slice(0, MAX_PROFILE),
    objective: VALID_OBJECTIVES.has(objective) ? objective : 'conexion',
    tone: VALID_TONES.has(tone) ? tone : 'consultivo',
  };
  if (isNonEmptyString(contextText, MAX_CONTEXT)) saneado.contextText = contextText.slice(0, MAX_CONTEXT);
  if (isNonEmptyString(selectedNews, MAX_NEWS)) saneado.selectedNews = selectedNews.slice(0, MAX_NEWS);
  if (isNonEmptyString(userIdentity, MAX_IDENTITY)) saneado.userIdentity = userIdentity.slice(0, MAX_IDENTITY);
  if (isNonEmptyString(userAdvantage, MAX_ADVANTAGE)) saneado.userAdvantage = userAdvantage.slice(0, MAX_ADVANTAGE);
  return saneado;
}

export function validateScanPayload(raw) {
  if (!raw || typeof raw !== 'object') {
    return { error: 'Cuerpo de la petición inválido.' };
  }
  const { profileText } = raw;
  if (!isNonEmptyString(profileText, MAX_PROFILE)) {
    return { error: 'Debes proporcionar el texto del perfil (máx. 8.000 caracteres).' };
  }
  return { profileText: profileText.slice(0, MAX_PROFILE) };
}

/* ------------------------------------------------------------------ */
/*  Prompts                                                            */
/* ------------------------------------------------------------------ */

const EXTRACTION_PROMPT = `Eres un investigador de inteligencia comercial B2B para el sector automotriz y financiero en España.
Analiza este perfil de LinkedIn e identifica:
1. El NOMBRE DE LA EMPRESA MATRIZ (ej. Stellantis, Grupo Quadis, Santander Consumer Finance). Si es un concesionario local, extrae también el nombre del grupo al que pertenece si es evidente.
2. El nombre de la persona.
3. El sub-sector principal.
4. Genera exactamente 2 consultas de búsqueda hiper-quirúrgicas para Google News España.
   - Query 1: Búsqueda del nombre exacto de la empresa. (Ej: "Grupo Quadis" OR "Santander Consumer")
   - Query 2: Búsqueda de la empresa + términos de negocio clave (Ej: "NombreEmpresa" (rentabilidad OR adquisición OR ventas OR nombramiento OR expansión))

Devuelve SOLO un JSON con esta estructura exacta:
{
  "name": "Nombre de la persona",
  "company": "Nombre exacto de la empresa / grupo principal",
  "sector": "Concesionario / Financiera-Banca / Renting-Flotas / Marca-Importador / Otro",
  "queries": ["query 1", "query 2"]
}`;

/**
 * Construye el system prompt del generador de mensajes.
 * Aquí vive la mejora de redacción y análisis respecto al original.
 */
export function buildSystemPrompt({
  objective,
  tone,
  identity,
  advantage,
  contextText,
  selectedNews,
}) {
  const objectiveInstruction = buildObjectiveInstruction(objective);
  const toneBlock = buildToneBlock(tone);
  const newsSection = buildNewsSection(contextText, selectedNews);

  return `Eres un copywriter B2B experto, con un tono extremadamente humano, natural y cero "robótico". Escribes en nombre de ${identity || 'Helen Yandy Reyes'}.

DIFERENCIAL DEL REMITENTE (Tu ADN, intégralo sutilmente): ${advantage || 'Soy profesional en Administración de Empresas y Finanzas y mi mayor valor es que conozco el sector automotriz desde todos sus ángulos. Llevo en esta industria ininterrumpidamente desde 2007. Empecé en pista vendiendo vehículos nuevos, pasé a liderar F&I, trabajé en banca comercializando financiación y ahora estoy en el negocio de V.O. Entiendo la presión comercial por cerrar, hablo el idioma técnico de las financieras para maximizar aprobaciones, y sé estructurar la operación para proteger la rentabilidad del concesionario.'}

${objectiveInstruction}

${toneBlock}
${newsSection}
CRITERIOS DE EXCELENCIA DE REDACCIÓN (ANTI-IA):
1. PROHIBICIÓN ABSOLUTA DE CLICHÉS DE IA: Nunca uses "Espero que estés bien", "Me pongo en contacto", "Hacer sinergias", "Revolucionar", "Solución innovadora", "Me encantaría hablar contigo sobre", "En resumen", "Por lo tanto", "Dicho esto".
2. ASIMETRÍA CONVERSACIONAL: Los mensajes humanos no son perfectamente simétricos. No uses listas estructuradas con viñetas a menos que sea estrictamente necesario. Usa un tono directo, como si escribieras por WhatsApp o Slack a un colega del sector.
3. ANÁLISIS ESTRATÉGICO PROFUNDO ("analisis_perfil"): Haz un diagnóstico agudo (3-5 frases) del momento de su empresa o sector. Cruza su cargo con los "dolores" que Helen conoce de primera mano (presión por penetración de marca, caída del margen en V.N., atascos en riesgo/aprobaciones, captación de V.O.). Infiere retos, no resumas su CV.
4. ESTRUCTURA DE LAS 3 VARIANTES (Aplica tu ADN):
   - Opción 1 (Ángulo Rentabilidad de la Operación): Dirigido a Gerencia. Cómo estructurar bien (cuota, TAE, productos adicionales) salva el margen bruto del coche, especialmente ahora.
   - Opción 2 (Ángulo de Pista/Comercial): Dirigido a Jefes de Ventas. Empatía de "trinchera". Cómo tu experiencia vendiendo en pista te permite destrabar operaciones que el comercial da por perdidas por falta de financiación.
   - Opción 3 (Ángulo Financiera/Aprobación): Dirigido a F&I/Riesgo. Cómo hablas el idioma del analista de riesgos para maximizar la tasa de aprobación de las financiaciones enviadas.
5. LONGITUD RESTRINGIDA: Conexión MÁXIMO 2-3 oraciones (muy breve). Follow-up/Reunión: no más de 3 párrafos cortos (ve directo al grano, el B2B no lee sábanas de texto).
6. GRAMÁTICA HUMANA: Transiciones fluidas, tuteo respetuoso pero de igual a igual (colegas veteranos del sector).
7. ENFOQUE DE BÚSQUEDA DE EMPLEO (OBLIGATORIO): En el mensaje debes dejar caer sutilmente que estás explorando nuevos retos profesionales. No suenes como que "pides trabajo", sino que ofreces valor. Conecta tu background 360° (ventas, F&I, banco) con por qué serías la pieza perfecta para resolver los problemas actuales de *su* empresa o aportar a su crecimiento.

Formato de salida: JSON estricto con esta estructura:
{
  "analisis_perfil": "diagnóstico estratégico amplio (3-5 frases)",
  "opcion_1": "texto completo y desarrollado del mensaje",
  "opcion_2": "texto completo y desarrollado del mensaje",
  "opcion_3": "texto completo y desarrollado del mensaje"
}`;
}

function buildObjectiveInstruction(objective) {
  if (objective === 'conexion') {
    return `OBJETIVO: NOTA DE CONEXIÓN DE LINKEDIN.
REGLA DE ORO: Tono natural y directo.
LONGITUD: Máximo 2-3 oraciones. Que parezca escrito en 10 segundos desde el móvil.
CONTENIDO: Ve directo a por qué le agregas. Menciona un reto de su puesto o empresa, y deja caer sutilmente que estás explorando oportunidades y que tu experiencia encaja con ellos. Ejemplo de estructura: "Hola [Nombre], he visto el ritmo de [Empresa] y tiene mucho mérito. Estoy explorando nuevos retos tras años en F&I/Banca y creo que mi perfil 360° podría aportar mucho a vuestra rentabilidad de V.O. Seguimos en contacto."`;
  }

  if (objective === 'followup') {
    return `OBJETIVO: SEGUIMIENTO TRAS CONECTAR.
ESTRUCTURA: Mensaje de 3 párrafos cortos y contundentes.
1. Apertura observacional: Usa la noticia provista o un hecho de su perfil para abrir.
2. Propuesta de Valor Estratégica (Búsqueda de Empleo): Comenta que estás en búsqueda activa de nuevos proyectos. Conecta su situación actual con tu visión de 360 grados (desde la pista de ventas hasta el scoring del banco) y cómo incorporar un perfil como el tuyo destraba su rentabilidad comercial o financiera.
3. Llamada a la acción (Baja fricción): Termina invitando a una charla corta y distendida para explorar si habría encaje en su equipo a futuro.`;
  }

  return `OBJETIVO: MENSAJE DIRECTO DE ACERCAMIENTO B2B (NETWORKING / EMPLEO).
ESTRUCTURA:
1. Observación Directa: Algo sobre su operación, marca o concesión que te haya llamado la atención (usa las noticias o el sector).
2. Identificación del Problema + Encaje: Menciona un reto clásico que tú resuelves (ej. operaciones que se caen, márgenes apretados).
3. Tu Propuesta de Valor (Búsqueda de Empleo): Menciona claramente que estás explorando tu próximo paso profesional y que tu trayectoria ininterrumpida desde 2007 te permite aportar valor inmediato en su estructura.
4. Call to Action Suave: "¿Te encajaría que hablemos 10 mins esta semana para ver si mi perfil 360° podría sumar a vuestros objetivos de este año?"`;
}

function buildToneBlock(tone) {
  const map = {
    ejecutivo: 'Directo, con mentalidad de negocio y métricas (margen, conversión, riesgo). Suena profesional pero muy terrenal.',
    consultivo: 'De colega a colega. Empático con los problemas del día a día del concesionario o financiera.',
    cercano: 'Conversacional y relajado. Usa el lenguaje propio de los que han "pisado mucha pista" de ventas.',
  };
  const label = tone || 'consultivo';
  return `TONO: ${label}. ${map[label] || map.consultivo}`;
}

function buildNewsSection(contextText, selectedNews) {
  let fullContext = '';
  if (contextText && contextText.trim()) {
    fullContext += `Contexto manual provisto: ${contextText.trim()}. `;
  }
  if (selectedNews && typeof selectedNews === 'string' && selectedNews.trim()) {
    fullContext += `Noticia/Evento de actualidad de la compañía: "${selectedNews.trim()}". `;
  }
  if (!fullContext.trim()) return '';
  return `INFORMACIÓN DE ACTUALIDAD Y PROYECTOS RECIENTES: "${fullContext.trim()}" DEBES integrar inteligentemente este hito en el análisis inicial del mensaje.\n\n`;
}

/* ------------------------------------------------------------------ */
/*  DeepSeek call                                                      */
/* ------------------------------------------------------------------ */

async function callDeepSeek({ system, user, key, jsonMode = true }) {
  if (!key) {
    return {
      error:
        'Clave API de DeepSeek no configurada. Define DEEPSEEK_API_KEY en el entorno (Vercel o .env local) o, en desarrollo, introdúcela en la configuración de la app.',
    };
  }

  let res;
  try {
    res = await fetch(DEEPSEEK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
      }),
    });
  } catch {
    return { error: 'No se pudo conectar con DeepSeek. Revisa tu conexión o la clave API.' };
  }

  const text = await res.text();
  if (!res.ok) {
    // No filtrar el cuerpo crudo del proveedor al cliente: puede filtrar
    // detalles de cuenta/cuota o confirmar la validez de la clave.
    if (res.status === 401 || res.status === 403) {
      return { error: 'Clave API de DeepSeek no válida o sin permisos.' };
    }
    if (res.status === 429) {
      return { error: 'Límite de peticiones a DeepSeek alcanzado. Inténtalo más tarde.' };
    }
    return { error: 'Error del proveedor de IA. Inténtalo de nuevo.' };
  }
  try {
    const data = JSON.parse(text);
    return JSON.parse(data.choices[0].message.content);
  } catch {
    return { error: 'La respuesta de DeepSeek no era un JSON válido.' };
  }
}

/* ------------------------------------------------------------------ */
/*  News radar (sector-agnóstico)                                      */
/* ------------------------------------------------------------------ */

function decodeEntities(s) {
  if (!s) return '';
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

export async function fetchGoogleNews(queries) {
  const results = [];
  const seen = new Set();

  for (const q of queries) {
    if (!q || q.trim().length < 3 || results.length >= 3) continue;
    // Sanitize: elimina TODAS las comillas (rectas o tipográficas) y colapsa
    // espacios. Las frases exactas entrecomilladas combinadas con términos
    // extra hacen que Google News devuelva 0 resultados; el nombre suelto
    // rinde más. Así cubrimos también frases entrecomilladas en el interior.
    const query = q.replace(/["“”]/g, ' ').replace(/\s+/g, ' ').trim();
    if (query.length < 3) continue;
    try {
      const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query + ' when:1y')}&hl=es&gl=ES&ceid=ES:es`;
      const res = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
        },
      });
      if (!res.ok) continue;

      const xml = await res.text();
      const itemRegex =
        /<item>[\s\S]*?<title>(.*?)<\/title>[\s\S]*?<link>(.*?)<\/link>[\s\S]*?<pubDate>(.*?)<\/pubDate>[\s\S]*?(?:<source.*?>(.*?)<\/source>)?[\s\S]*?<\/item>/gi;
      let match;
      while ((match = itemRegex.exec(xml)) !== null && results.length < 3) {
        const title = decodeEntities(match[1]);
        const link = match[2] || '';
        const pubDate = match[3] || '';
        const source = match[4] ? decodeEntities(match[4]) : 'Medio de Prensa';
        if (!title || seen.has(title)) continue;
        seen.add(title);

        let formatted = pubDate;
        try {
          formatted = new Date(pubDate).toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          });
        } catch {
          /* keep raw */
        }

        results.push({ title, link, pubDate: formatted, source });
      }
    } catch {
      /* ignore single-query failures, try the next */
    }
  }
  return results;
}

export async function scanNews(profileText, key) {
  if (!profileText || !profileText.trim()) {
    return { error: 'Debes proporcionar el texto del perfil.' };
  }

  let entity = { name: '', company: '', sector: '' };
  let queries = [];

  if (key) {
    const extraction = await callDeepSeek({
      system: EXTRACTION_PROMPT,
      user: profileText,
      key,
    });
    if (!extraction.error) {
      entity = {
        name: extraction.name || '',
        company: extraction.company || '',
        sector: extraction.sector || '',
      };
      queries = Array.isArray(extraction.queries) ? extraction.queries : [];
    }
  }

  // Orient queries to the detected company when available.
  // Sin comillas de frase exacta: Google News sobre-restringe al combinar
  // una frase entrecomillada con términos adicionales y devuelve 0 resultados.
  // El nombre de la empresa como término suelto rinde más y mejores noticias.
  if (entity.company && entity.company.trim().length > 2) {
    const clean = entity.company.replace(/[^\w\sÀ-ſ]/gi, '').trim();
    // Prioridad: 1. Empresa matriz/grupo 2. Sector automotor genérico si no hay de la empresa
    queries = [
      `${clean} (concesionario OR motor OR coches OR resultados OR expansión OR renting OR automoción)`,
      `Sector Automoción España (vehículos de ocasión OR renting OR financiación OR ventas)`,
    ];
  } else if (queries.length === 0) {
    const firstLine =
      profileText
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean)[0] || '';
    // Sin entrecomillado: la primera línea del perfil suele contener nombre
    // y cargo, no una empresa citable; como término suelto es más robusto.
    queries = [`${firstLine.substring(0, 30)} (campaña OR lanzamiento OR acuerdo)`];
  }

  const news = await fetchGoogleNews(queries.slice(0, 2));
  return { entity, news: news.slice(0, 3), count: news.length };
}

/* ------------------------------------------------------------------ */
/*  Message generation                                                 */
/* ------------------------------------------------------------------ */

export async function generateMessages(payload, key) {
  const { profileText, contextText, selectedNews, objective, tone, userIdentity, userAdvantage } =
    payload || {};

  if (!profileText || !profileText.trim()) {
    return { error: 'Pega el perfil o la trayectoria del contacto.' };
  }

  const system = buildSystemPrompt({
    objective,
    tone,
    identity: userIdentity,
    advantage: userAdvantage,
    contextText,
    selectedNews,
  });

  const result = await callDeepSeek({ system, user: `Perfil del contacto:\n${profileText}`, key });
  // Salvaguarda de longitud para conexión: los LLM cuentan caracteres de
  // forma poco fiable y LinkedIn rechaza notas > 300. Recortamos a ≤ 290
  // en un límite de frase para no entregar texto que no cabría en la UI.
  if (objective === 'conexion' && result && !result.error) {
    for (const k of ['opcion_1', 'opcion_2', 'opcion_3']) {
      if (typeof result[k] === 'string') result[k] = trimToLimit(result[k], 290);
    }
  }
  return result;
}

/**
 * Recorta `text` a <= `limit` caracteres cortando en el último fin de frase
 * (. ! ? …) anterior al límite. Si no hay ningún fin de frase, corta en el
 * último espacio y añade puntos suspensivos. Nunca muta la entrada.
 */
function trimToLimit(text, limit) {
  if (typeof text !== 'string' || text.length <= limit) return text;
  const slice = text.slice(0, limit);
  const lastStop = Math.max(
    slice.lastIndexOf('.'),
    slice.lastIndexOf('!'),
    slice.lastIndexOf('?'),
    slice.lastIndexOf('…'),
  );
  if (lastStop >= 40) return slice.slice(0, lastStop + 1).trim();
  const lastSpace = slice.lastIndexOf(' ');
  if (lastSpace >= 40) return `${slice.slice(0, lastSpace).trim()}…`;
  return `${slice.trim()}…`;
}