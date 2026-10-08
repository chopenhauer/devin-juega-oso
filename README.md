# OSO · el juego de Julia

Juego web de O y S para dos jugadores (o contra la máquina), creado por JoseLuis y Julia.

- Producción: https://devin-juega-oso.vercel.app (cada push a `main` se publica solo).
- Cada rama y PR genera una preview en Vercel.
- Roadmap e ideas de mejora: [`docs/ROADMAP.md`](docs/ROADMAP.md).
- Sistema de diseño y accesibilidad: [`docs/DESIGN.md`](docs/DESIGN.md).

## Estructura

```
public/               Sitio estático que publica Vercel (sin build)
  index.html          Marcado
  css/styles.css      Estilos
  js/engine.js        Reglas puras: detección de OSO/SOS, recálculo, pistas, IA, replay SOS
  js/app.js           Interfaz: estado de la partida, reloj, eventos y render (usa engine.js)
  js/onboarding.js    Inicio por pasos (bienvenida, cómo se juega, modo, jugadores, tablero)
  fonts/              Fredoka (subconjunto latino, woff2) + licencia OFL
  favicon.svg
tests/unit/           Tests del motor (node:test)
tests/e2e/            Tests en navegador (Playwright, móvil y escritorio)
scripts/serve.js      Servidor local con las mismas cabeceras que vercel.json
old-references/       Versiones históricas del juego (no se publican)
```

`engine.js` no toca el DOM ni variables globales, así que las reglas se prueban sin navegador.
`app.js` es un módulo ES que mantiene el estado de la partida y delega las reglas al motor.
`onboarding.js` solo navega entre los pasos del inicio y guarda las últimas elecciones en
`localStorage` (clave `oso.prefs.v1`); la explicación inicial se muestra solo la primera vez.

## Desarrollo

Requisitos: Node.js 22 (`.nvmrc`).

```bash
npm install
npm start              # http://localhost:4173
npm run lint           # ESLint + Prettier
npm test               # tests del motor
npx playwright install chromium
npm run test:e2e       # tests en navegador
npm run check          # todo lo anterior
```

GitHub Actions ejecuta lint y tests en cada PR y en cada push a `main`. Dependabot propone
actualizaciones mensuales de dependencias y acciones.

## Seguridad

- `vercel.json` define cabeceras para todo el sitio: Content-Security-Policy estricta (solo recursos
  propios, sin scripts ni estilos inline), `frame-ancestors 'none'` / `X-Frame-Options`, `nosniff`,
  `Referrer-Policy: no-referrer`, `Permissions-Policy` y aislamiento de origen.
- Único tercero: Microsoft Clarity (analítica), cargado desde `public/js/clarity.js`; la CSP solo
  abre sus dominios (`*.clarity.ms`, `c.bing.com`). La fuente se sirve desde el propio dominio.
  Los tests e2e sustituyen Clarity por una respuesta vacía para no enviar datos.
- El texto que escriben los jugadores (nombres) se pinta siempre con `textContent`, nunca como HTML.
- `.vercelignore` solo sube `public/` y `vercel.json`; tests, configuración y versiones antiguas no se publican.

## Despliegue

Vercel sirve `public/` tal cual (`outputDirectory`, sin instalación ni build). No hay variables de entorno.
