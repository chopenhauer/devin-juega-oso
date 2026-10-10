# OSO · el juego de Julia

Juego web de O y S para 1 jugador contra la máquina, 2 o 4 jugadores en el mismo dispositivo, creado
por JoseLuis y Julia.

- Producción: https://juegaoso.com y https://devin-juega-oso.vercel.app (cada push a `main` se
  publica solo).
- Cada rama y PR genera una preview en Vercel.
- Roadmap e ideas de mejora: [`docs/ROADMAP.md`](docs/ROADMAP.md).
- Versiones, mejoras y decisiones: [`CHANGELOG.md`](CHANGELOG.md). La versión del pie sale de
  `public/js/version.js`.
- Sistema de diseño y accesibilidad: [`docs/DESIGN.md`](docs/DESIGN.md).

## Estructura

```
public/               Sitio estático que publica Vercel (sin build)
  index.html          Marcado
  css/styles.css      Estilos
  js/engine.js        Reglas puras para N jugadores: OSO/SOS, recálculo, pistas, IA, replay SOS
  js/app.js           Interfaz: estado de la partida, reloj, eventos y render (usa engine.js)
  js/onboarding.js    Inicio por pasos (bienvenida, reglas, modo, jugadores, vista, tablero)
  js/themes.js        Temas (skins) y qué temas salen en el menú 🎨 según la fecha
  js/sound.js         Sonidos generados con Web Audio y silencio recordado
  js/leaderboard.js   Marcador de la sesión (partidas seguidas entre los mismos jugadores)
  js/version.js       Versión que sale en el pie (la misma que package.json)
  js/consent.js       Aviso de cookies; ga.js y clarity.js cargan la analítica según el permiso
  js/telemetry.js     Eventos anónimos de partida (con permiso), cuándo pedir 👍/👎 y email de ideas
  privacidad.html     Política de privacidad (/privacidad)
  fonts/              Fredoka (subconjunto latino, woff2) + licencia OFL
  favicon.svg
tests/unit/           Tests del motor, temas, marcador, telemetría y versión (node:test)
tests/e2e/            Tests en navegador (Playwright, móvil y escritorio)
scripts/serve.js      Servidor local con las mismas cabeceras que vercel.json
old-references/       Versiones históricas del juego (no se publican)
```

`engine.js` no toca el DOM ni variables globales, así que las reglas se prueban sin navegador.
`app.js` es un módulo ES que mantiene el estado de la partida y delega las reglas al motor.
`onboarding.js` solo navega entre los pasos del inicio y guarda las últimas elecciones en
`localStorage`; la bienvenida se muestra solo la primera vez.

Lo que se guarda en el dispositivo (`localStorage`), sin datos fuera del navegador:

| Clave             | Qué guarda                                                               |
| ----------------- | ------------------------------------------------------------------------ |
| `oso.prefs.v1`    | Últimas elecciones del inicio y si ya se vio la intro                    |
| `oso.theme.v1`    | Tema elegido en el menú 🎨                                               |
| `oso.sound.v1`    | Sonido activado o silenciado                                             |
| `oso.session.v1`  | Marcador de la sesión                                                    |
| `oso.consent.v1`  | Respuesta al aviso de cookies                                            |
| `oso.feedback.v1` | Partidas jugadas y si ya se contestó 👍/👎 (para no preguntar demasiado) |

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

GitHub Actions (job `check`) ejecuta lint, tests del motor y tests en navegador en cada push, en
cualquier rama. Dependabot propone actualizaciones mensuales de dependencias y acciones.

## Cómo se publica

1. Cada cambio se hace en una rama `devin/…` y se prueba en su preview de Vercel.
2. Al aprobarlo se sube la versión (`package.json`, `package-lock.json` y `public/js/version.js`) y
   se apunta en `CHANGELOG.md` siguiendo SemVer.
3. `main` está protegida con un ruleset de GitHub: sin force push ni borrado, y solo acepta un
   commit cuando su job `check` ya ha pasado. Por eso primero se sube el merge a la rama, se
   espera al CI en verde y después se sube a `main`.
4. Al publicar se borra la rama: en el repo solo queda `main`.

## Seguridad

- `vercel.json` define cabeceras para todo el sitio: Content-Security-Policy estricta (solo recursos
  propios, sin scripts ni estilos inline), `frame-ancestors 'none'` / `X-Frame-Options`, `nosniff`,
  `Referrer-Policy: no-referrer`, `Permissions-Policy` y aislamiento de origen.
- Terceros: solo analítica. Microsoft Clarity (`public/js/clarity.js`) y Google Analytics 4
  (`public/js/ga.js`); la CSP solo abre sus dominios (`*.clarity.ms`, `c.bing.com`,
  `*.googletagmanager.com`, `*.google-analytics.com`, `*.analytics.google.com`). La fuente se sirve
  desde el propio dominio. Un aviso de cookies (`public/js/consent.js`, `oso.consent.v1`) pide
  permiso: Clarity solo se carga al aceptar y GA usa Consent Mode v2 (analítica denegada hasta
  aceptar, publicidad siempre denegada). Los eventos de partida (`public/js/telemetry.js`) solo se
  envían con el permiso concedido y no llevan nombres, avatares ni texto escrito. Los tests e2e sustituyen Clarity y GA por respuestas vacías para no
  enviar datos.
- El texto que escriben los jugadores (nombres) se pinta siempre con `textContent`, nunca como HTML.
- `.vercelignore` solo sube `public/` y `vercel.json`; tests, configuración y versiones antiguas no se publican.

## Despliegue

Vercel sirve `public/` tal cual (`outputDirectory`, sin instalación ni build). No hay variables de entorno.

## Licencia

[MIT](LICENSE) © 2026 JoseLuis Vilar y Julia (Vilarequi). La fuente Fredoka de `public/fonts/`
mantiene su propia licencia OFL.
