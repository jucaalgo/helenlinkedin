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
1. El NOMBRE DE LA EMPRESA, CONCESIONARIO, FINANCIERA, BANCO, EMPRESA DE RENTING, MARCA O IMPORTADOR actual o más relevante donde trabaja o con el que colabora.
2. El nombre de la persona.
3. El sub-sector principal.
4. Genera exactamente 2 consultas de búsqueda para Google News España 100% enfocadas en la EMPRESA y sus campañas, lanzamientos, resultados, acuerdos, expansión o premios recientes (no busques nombres de personas sueltos sin su empresa).

Ejemplo de queries:
- '"NombreEmpresa" (campaña OR lanzamiento OR acuerdo OR resultados OR expansión OR premio)'
- '"NombreEmpresa" España'

Devuelve SOLO un JSON con esta estructura exacta:
{
  "name": "Nombre de la persona",
  "company": "Nombre exacto de la empresa / concesionario / financiera",
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

  return `Eres un copywriter de élite especializado en prospección B2B para el sector automotriz y financiero, y estratega senior de ventas y financiación. Escribes en nombre de ${identity || 'Helen Yandy Reyes, Financiera con casi 20 años de experiencia en el sector automotriz'}.

DIFERENCIAL DEL REMITENTE (entreteje esto con naturalidad, sin repetirlo literal ni presumir): ${advantage || 'Visión global de la operación: escucha activa para identificar la necesidad del cliente, cierre de venta y guía en financiación y productos adicionales. Domino el ciclo completo —comercial y financiero— en concesionarios, financieras, flotas y marcas.'}

${objectiveInstruction}

${toneBlock}
${newsSection}
CRITERIOS DE EXCELENCIA DE REDACCIÓN:
1. PROHIBICIÓN ABSOLUTA DE CLICHÉS: nunca uses "espero que te encuentres bien", "me pongo en contacto contigo", "hacer sinergia", "solución innovadora", "revolucionar", "en estos tiempos", "a la vanguardia", "dar el paso". Escribe con la voz de una financiera veterana con criterio de negocio, no de un comercial genérico.
2. RIQUEZA LÉXICA DEL SECTOR: usa terminología precisa cuando aporte (financiación, cuota, TAE, scoring/riesgo, renting, productos adicionales: GAP, seguro, extensión de garantía; concesión, stock, margen, conversión, fidelización, ciclo comercial, escucha activa). Sin tecnicismo gratuito ni jerga hueca.
3. ANÁLISIS ESTRATÉGICO PROFUNDO en "analisis_perfil": 3-5 frases que diagnostiquen el sector del contacto, su rol, un posible punto de dolor u oportunidad, el ángulo de entrada de Helen y cómo el gancho de actualidad (si lo hay) refuerza el mensaje. No lo redactes como relleno: que aporte juicio.
4. DISTINCIÓN DE LAS 3 VARIANTES:
   - Opción 1 (Financiación & Estructura de la Operación): enfatiza la mirada financiera —estructurar la operación óptima (cuota, TAE, riesgo, productos adicionales) que protege margen y fideliza al cliente final.
   - Opción 2 (Visión Global del Ciclo Comercial): enfatiza el ciclo completo —escucha activa para identificar la necesidad real, cierre y acompañamiento en la decisión de financiación.
   - Opción 3 (Consultivo / Sinergia de Negocio): aborda cuellos de botella operativos del concesionario, financiera, flota o marca y cómo la visión integral de Helen los resuelve.
5. LONGITUD: Conexión ≤ 250 caracteres. Follow-up y Reunión entre 1.200 y 1.800 caracteres cada opción. Cuenta los caracteres antes de devolver y ajusta.
6. GRAMÁTICA IMPECABLE: puntuación, transiciones fluidas entre párrafos, tono seguro y cercano, sin fórmulas gastadas ni frases hechas.

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
    return `OBJETIVO: SOLICITUD DE CONEXIÓN INICIAL (nota en invitación de LinkedIn).
REGLA ESTRICTA DE LONGITUD: máximo 250 caracteres. LinkedIn impone un límite físico infranqueable de 300; pedir 250 deja margen de seguridad. Cuenta los caracteres de cada opción ANTES de devolver y, si supera 250, recorta preservando una sola idea nítida. Una nota de conexión no es un párrafo: es un guiño profesional breve.
CONTENIDO: un elogio o referencia concreta y específica a su trabajo, equipo, concesión, campaña o una noticia reciente de su compañía. CERO intención de venta: solo conectar por afinidad profesional y visión compartida del negocio automotriz y financiero.`;
  }

  if (objective === 'followup') {
    return `OBJETIVO: MENSAJE TRAS ACEPTAR CONEXIÓN (follow-up de alto impacto).
REGLA OBLIGATORIA DE EXTENSIÓN: entre 1.200 y 1.800 caracteres (aprox. 200-300 palabras). Mensaje completo, elocuente y exhaustivo, no telegráfico.
ESTRUCTURA OBLIGATORIA EN PÁRRAFOS:
1. APERTURA Y GANCHO CONTEXTUAL: agradecimiento cálido por conectar. Análisis profundo de su trayectoria, concesión, campaña o hito reciente de su compañía (usando la noticia/contexto). Demuestra que conoces su lenguaje de negocio.
2. EL DIFERENCIAL DE HELEN — VISIÓN GLOBAL DE LA OPERACIÓN: explica con autoridad cómo tus casi 20 años entre ventas de vehículos, departamento de negocios (Financiera) y banca te dan una visión de 360°: desde la escucha activa que identifica la necesidad real del cliente hasta el cierre y el acompañamiento en la decisión de financiación y productos adicionales.
3. DOMINIO TÉCNICO FINANCIERO: menciona la estructuración de la operación (cuota, TAE, scoring/riesgo, renting, productos adicionales como GAP, seguro y extensión de garantía) y cómo eso protege margen y fideliza, sin necesidad de micromanagement.
4. CIERRE ELEGANTE Y DE BAJA FRICCIÓN: propuesta abierta para estar en su radar cuando necesiten una mirada que una el comercial y el financiero, invitando a conversar o conocer tu trayectoria.`;
  }

  return `OBJETIVO: PROPUESTA COMERCIAL Y SOLICITUD DE REUNIÓN DIRECTA.
REGLA OBLIGATORIA DE EXTENSIÓN: entre 1.200 y 1.800 caracteres. Mensaje sólido, estructurado y de alta persuasión B2B.
ESTRUCTURA:
1. Gancho de alto impacto sobre su operación (concesión, red, financiación, flota o marca).
2. Demostración de valor: por qué una financiera con visión global del ciclo comercial resuelve cuellos de botella (conversión, margen, fidelización, estructuración de la operación).
3. Propuesta clara de sinergia para su próximo cierre, campaña o reestructuración de financiación.
4. Llamado a la acción directo para una breve videollamada o café esta semana.`;
}

function buildToneBlock(tone) {
  const map = {
    ejecutivo: 'Formal, directo, lenguaje de negocio y financiero. Frases medidas, autoridad sin solemnidad.',
    consultivo: 'Asesor, cercano, orientado al diagnóstico y al valor compartido. Genera confianza escuchando antes de proponer.',
    cercano: 'Cálido y conversacional, profesional pero de colega veterana del sector.',
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
    queries = [
      `${clean} (coche OR financiera OR renting OR campaña OR acuerdo OR resultados OR expansión)`,
      `${clean} España`,
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