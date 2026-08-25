# Fin Hunter — Helen Dashboard

App de prospección B2B para LinkedIn, sector-agnóstica: pega cualquier perfil
(concesionarios, banca/financieras, flotas/renting, marcas/importadores), el
sistema detecta la empresa, ancla el mensaje en una noticia reciente y redacta
tres ángulos de contacto.

Construida para **Helen Yandy Reyes** — financiera con ~20 años en el sector
automotriz —, posiciona su diferencial: visión 360° del ciclo comercial y
financiero (escucha activa → cierre → guía en financiación y productos
adicionales).

## Stack

- React 19 + Vite 8 + Tailwind v4 + framer-motion + lucide-react
- Backend: DeepSeek (`deepseek-chat`) + Google News RSS
- Despliegue: Vercel (serverless functions en `/api`)

## Desarrollo local

```bash
npm install
npm run dev
```

Crea un `.env` (gitignored) con tu clave de DeepSeek:

```
DEEPSEEK_API_KEY=sk-...
```

> **Nunca** uses el prefijo `VITE_` para esta variable: se inlinearía en el
> bundle del cliente y filtraría la clave. Se lee solo server-side.

## Producción (Vercel)

1. Importa este repo en Vercel.
2. Define la variable de entorno `DEEPSEEK_API_KEY` en el panel del proyecto.
3. Deploy. Vercel auto-detecta Vite y sirve `/api/*` como serverless functions.

El cliente nunca maneja la clave: viaja solo en el header `Authorization` desde
el servidor.

## Flujo

1. **Radar de noticias** — pega un perfil → DeepSeek detecta empresa y sector →
   Google News devuelve 3 titulares recientes relevantes como gancho.
2. **Generación de mensajes** — elige fase (Conexión / Follow-up / Reunión),
   tono (Ejecutivo / Consultivo / Cercano) y una noticia → DeepSeek redacta
   `analisis_perfil` + 3 opciones distintas respetando la longitud por fase.

## Seguridad

- API key solo desde env del servidor (nunca `VITE_`, nunca localStorage).
- CORS allowlist, validación de input en cada endpoint, errores genéricos al
  cliente (sin filtrar cuerpo del proveedor), CSP estricta y headers de
  hardening en `vercel.json`.