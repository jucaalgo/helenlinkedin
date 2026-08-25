/**
 * Fin Hunter — configuración central de la app.
 * Identidad y ventaja por defecto de Helen, objetivos, tonos,
 * ángulos de mensaje y claves de persistencia en localStorage.
 */

export const DEFAULT_IDENTITY =
  'Helen Yandy Reyes, Financiera con casi 20 años de experiencia en el sector automotriz';

export const DEFAULT_ADVANTAGE =
  'Visión global de la operación: escucha activa para identificar la necesidad real del cliente, cierre de venta y acompañamiento en la decisión de financiación y productos adicionales. Domino el ciclo completo —comercial y financiero— en concesionarios, financieras, flotas y marcas.';

export const OBJECTIVES = [
  {
    id: 'conexion',
    label: 'Solicitud de conexión',
    hint: 'Nota en invitación · ≤ 300 caracteres',
    icon: 'UserPlus',
  },
  {
    id: 'followup',
    label: 'Follow-up tras aceptar',
    hint: 'Mensaje de alto impacto · 1.200–1.800 caracteres',
    icon: 'MessageSquare',
  },
  {
    id: 'reunion',
    label: 'Propuesta de reunión',
    hint: 'Mensaje comercial directo · 1.200–1.800 caracteres',
    icon: 'CalendarClock',
  },
];

export const TONES = [
  { id: 'ejecutivo', label: 'Ejecutivo', hint: 'Formal, directo, lenguaje de negocio' },
  { id: 'consultivo', label: 'Consultivo', hint: 'Asesor, orientado al diagnóstico' },
  { id: 'cercano', label: 'Cercano', hint: 'Cálido, de colega veterana del sector' },
];

export const MESSAGE_ANGLES = [
  {
    id: 1,
    title: 'Financiación & Estructura de la Operación',
    description:
      'La mirada financiera: estructurar la operación óptima (cuota, TAE, riesgo, productos adicionales) que protege margen y fideliza.',
  },
  {
    id: 2,
    title: 'Visión Global del Ciclo Comercial',
    description:
      'El ciclo completo: escucha activa para identificar la necesidad real, cierre y acompañamiento en la decisión de financiación.',
  },
  {
    id: 3,
    title: 'Consultivo / Sinergia de Negocio',
    description:
      'Cuellos de botella operativos del concesionario, financiera, flota o marca y cómo la visión integral los resuelve.',
  },
];

export const STORAGE_KEYS = {
  identity: 'fh_identity',
  advantage: 'fh_advantage',
  // Nota: la clave API NO se persiste en localStorage (sería legible por XSS).
  // Vive solo en memoria durante la sesión de desarrollo.
};