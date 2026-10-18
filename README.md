# OSO · el juego de Julia

Juego web de O y S para 1 jugador contra la máquina, 2 o 4 jugadores en el mismo dispositivo o 1
contra 1 en línea, creado por JoseLuis y Julia: un proyecto familiar para que Julia le coja el gusto
al STEM y decida el roadmap.

- Producción: https://juegaoso.com y https://devin-juega-oso.vercel.app (cada push a `main` se
  publica solo).
- Cada rama y PR genera una preview en Vercel.
- Guía rápida para agentes (inventario y reglas): [`AGENTS.md`](AGENTS.md).
- Roadmap: [`docs/ROADMAP.md`](docs/ROADMAP.md), con el detalle de cada idea en [`docs/ideas/`](docs/ideas/README.md).
- Versiones, mejoras y decisiones: [`CHANGELOG.md`](CHANGELOG.md). La versión del pie sale de
  `public/js/version.js`.
- Sistema de diseño y accesibilidad: [`docs/DESIGN.md`](docs/DESIGN.md).
- Juego en línea (decisión, arquitectura y umbrales de revisión): [`docs/ONLINE.md`](docs/ONLINE.md).
- Analítica (qué se mide, para qué y qué no se mide nunca): [`docs/ANALYTICS.md`](docs/ANALYTICS.md).
- Data layer (cómo viajan los datos, tipos y valores de cada parámetro): [`docs/DATALAYER.md`](docs/DATALAYER.md).
- Parámetros del juego (tiempos, extras, salas, secretos…): [`docs/CONFIG.md`](docs/CONFIG.md), generado desde
  [`public/js/config.js`](public/js/config.js).

## Estructura

```
public/               Sitio estático que publica Vercel (sin build)
  index.html          Marcado (sala.html, la misma página con la tarjeta de invitación, se genera al publicar)
  css/tokens.css      Sistema de diseño: la única fuente de colores, letra, espacios, sombras…
  css/styles.css      Estilos de los componentes (solo usan tokens)
  design.html         Guía viva del sistema de diseño (/design, solo local y previews)
  js/engine.js        Reglas puras para N jugadores: OSO/SOS, recálculo, pistas, IA, replay SOS
  js/config.js        Parámetros del juego (tiempos, extras, tienda, salas, secretos…), compartidos con el servidor
  js/match.js         Estado de una partida (jugadas, relojes, extras, compras), igual en local y en el servidor
  js/app.js           Interfaz: estado de la partida, reloj, tensión, eventos y render (usa engine.js y match.js)
  js/online.js        Cliente de las salas en línea (crear, unirse, consultar al servidor)
  js/secrets.js       Lista de secretos (easter eggs) y cuándo toca contar uno
  js/onboarding.js    Inicio por pasos (bienvenida, reglas, modo, jugadores, vista, tablero)
  js/tuning.js        Valores en vivo del laboratorio de Julia sobre config.js (/api/config)
  js/lab.js           Laboratorio de Julia (/lab): simulador (lab-sim.js) y cuaderno
  js/funnel.js        Qué pantallas del inicio se ven antes de jugar (servidor sin cookies y GA4)
  js/themes.js        Temas (skins) y qué temas salen en el menú 🎨 según la fecha
  js/sound.js         Sonidos generados con Web Audio y silencio recordado
  js/leaderboard.js   Marcador de la sesión (partidas seguidas entre los mismos jugadores)
  js/version.js       Versión que sale en el pie (la misma que package.json)
  js/consent.js       Aviso de cookies; ga.js y clarity.js cargan la analítica según el permiso
  js/share.js         Textos y enlaces para compartir (WhatsApp, email, UTM), sin SDKs
  js/telemetry.js     Eventos anónimos de partida (con permiso), cuándo pedir 👍/👎 y email de ideas
  js/i18n.js          Carga los textos del idioma (t('clave')) y los pone en la página
  locales/es.json     Todos los textos del juego, clave → texto (un fichero por idioma)
  privacidad.html     Política de privacidad (/privacidad)
  fonts/              Fredoka (subconjunto latino, woff2) + licencia OFL
  favicon.svg
  og.png              Tarjeta del enlace (Open Graph, 1200×630)
api/sala.js           Función de Vercel de las salas en línea (/api/sala)
api/_sala.js          Árbitro: valida las jugadas con match.js y lleva los relojes y los contadores
api/lab.js            Laboratorio de Julia: contraseña, valores en vivo y cuaderno (/api/lab, /api/config)
api/lab-data.js       Laboratorio: partidas de verdad desde GA4, por versión (/api/lab-data)
api/_store.js         Upstash Redis por REST (en local y en tests, en memoria)
middleware.js         Sirve sala.html cuando el enlace lleva ?sala= (tarjeta de WhatsApp)
tests/unit/           Tests del motor, partida, servidor, configuración, temas, secretos… (node:test)
tests/e2e/            Tests en navegador (Playwright, móvil y escritorio)
scripts/serve.js      Servidor local con las mismas cabeceras que vercel.json
scripts/tokens.js     Exporta tokens.css a docs/tokens.json, formato W3C (npm run tokens)
scripts/config-doc.js Genera docs/CONFIG.md desde public/js/config.js (npm run config)
scripts/og-image.js   Genera public/og.png desde scripts/og-card.html (npm run og)
scripts/invite-page.js Genera public/sala.html al publicar (no se sube al repo)
scripts/online-report.js Embudo y salud del juego en línea desde los contadores del servidor
old-references/       Versiones históricas del juego (no se publican)
```

`engine.js` no toca el DOM ni variables globales, así que las reglas se prueban sin navegador.
`app.js` es un módulo ES que mantiene el estado de la partida y delega las reglas al motor.
`onboarding.js` solo navega entre los pasos del inicio y guarda las últimas elecciones en
`localStorage`; la bienvenida se muestra solo la primera vez.

Lo que se guarda en el dispositivo (`localStorage`), sin datos fuera del navegador (en línea, el servidor guarda la sala un tiempo, ver
[`docs/ONLINE.md`](docs/ONLINE.md)):

| Clave             | Qué guarda                                                               |
| ----------------- | ------------------------------------------------------------------------ |
| `oso.prefs.v1`    | Últimas elecciones del inicio y si ya se vio la intro                    |
| `oso.theme.v1`    | Tema elegido en el menú 🎨                                               |
| `oso.sound.v1`    | Sonido activado o silenciado                                             |
| `oso.session.v1`  | Marcador de la sesión                                                    |
| `oso.consent.v1`  | Respuesta al aviso de cookies                                            |
| `oso.feedback.v1` | Partidas jugadas y si ya se contestó 👍/👎 (para no preguntar demasiado) |
| `oso.install.v1`  | `dismissed` si se pulsó «No, gracias» en «📲 Instalar»                   |
| `oso.secretos.v1` | Secretos ya contados, partidas contadas y día del último secreto         |
| `oso.online.v1`   | Sala en línea y token del asiento, para volver tras recargar             |

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
npm run tokens         # exporta los tokens a docs/tokens.json (tras cambiar tokens.css)
npm run config         # regenera docs/CONFIG.md (tras cambiar public/js/config.js)
npm run online:report  # embudo del juego en línea del mes (contadores anónimos del servidor)
```

GitHub Actions (job `check`) ejecuta lint, tests del motor y tests en navegador en cada push, en
cualquier rama. Dependabot propone actualizaciones mensuales de dependencias y acciones.

## Cómo se publica

1. Cada cambio se hace en una rama `devin/…` y se prueba en su preview de Vercel. Se publica cuando
   JoseLuis dice «publica».
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
  envían con el permiso concedido y no llevan nombres, avatares ni texto escrito; sí el tema
  (`theme`, `theme_source`) para saber qué temas se usan. Los tests e2e sustituyen Clarity y GA por respuestas vacías para no
  enviar datos.
- El texto que escriben los jugadores (nombres) se pinta siempre con `textContent`, nunca como HTML.
- `.vercelignore` solo sube `public/`, `api/`, `middleware.js`, `vercel.json`, `package.json` y el
  script que genera `sala.html`; tests, documentación y versiones antiguas no se publican.

## Despliegue

Vercel sirve `public/` tal cual (`outputDirectory`); el build solo genera `public/sala.html`. Las
salas en línea usan Upstash Redis (`oso-salas`) con las variables `KV_REST_API_URL` y
`KV_REST_API_TOKEN`; las claves llevan delante el entorno (`production:`, `preview:`), así que
producción y previews no se mezclan.

## Licencia

[MIT](LICENSE) © 2026 JoseLuis Vilar y Julia (Vilarequi). La fuente Fredoka de `public/fonts/`
mantiene su propia licencia OFL.
