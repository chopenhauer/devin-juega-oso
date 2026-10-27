# Modelo de amenazas

Qué protegemos en OSO, de quién y con qué. Lo usan los escaneos de seguridad de Devin para ordenar
lo que encuentran; si cambia algo de lo que hay aquí (un endpoint nuevo, un secreto nuevo, una
decisión sobre qué riesgo se acepta), se actualiza este documento. Los controles concretos están en
[`README.md`](README.md#seguridad) y el juego en línea en [`docs/ONLINE.md`](docs/ONLINE.md).

OSO es un pet-project familiar de STEM (JoseLuis y su hija Julia) y **juegan niños**. Producción:
https://juegaoso.com y https://devin-juega-oso.vercel.app (Vercel Hobby). No hay repositorio de
infraestructura aparte: `vercel.json`, `middleware.js` y `.vercelignore` son toda la infra.

## Sistema y fronteras de confianza

```
Navegador (no fiable: cualquiera, también niños y el rival en línea)
  │  public/ estático (sin build, módulos ES)  ── GA4 / Clarity (terceros, solo con permiso)
  ▼
Borde de Vercel: cabeceras de vercel.json (CSP, XFO, COOP/CORP…), middleware.js (/?sala=)
  ▼
Vercel Functions api/*.js  ── secretos en las variables de entorno de Vercel
  ├─ Upstash Redis por REST (api/_store.js; claves con prefijo production:/preview:/development:)
  ├─ Google OAuth + GA4 Data API (api/_labdata.js, JWT de la cuenta de servicio)
  └─ Servicios push de los navegadores (api/_webpush.js, VAPID; lista de hosts en api/_push.js)
Vercel Cron → /api/push-cron (Bearer CRON_SECRET)
```

Fronteras: (1) navegador ↔ funciones: el cuerpo, las cabeceras (`x-real-ip`, `x-forwarded-for`) y
las cookies las controla quien llama; (2) funciones ↔ Upstash, Google y servicios push, con
secretos del servidor; (3) página ↔ scripts de analítica de terceros que permite la CSP; (4) un
jugador en línea ↔ el otro (estado de la sala compartido, nombres y avatares que se pintan en el
otro dispositivo).

## Componentes

| Componente               | Código                                                                                                                                                               |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Web client**           | `public/index.html`, `public/js/` (app, engine, match, onboarding, online, secrets, share, replay, install, sw.js)                                                   |
| **Online rooms API**     | `api/sala.js`, `api/_sala.js` (árbitro con `public/js/match.js`), `scripts/invite-page.js` (`sala.html`)                                                             |
| **Lab**                  | `api/lab.js`, `api/_lab.js`, `api/_labauth.js`, `api/lab-data.js`, `api/_labdata.js`, `api/config.js`, `public/lab.html`, `public/js/lab*.js`, `public/js/tuning.js` |
| **Push reminders**       | `api/push.js`, `api/push-cron.js`, `api/_push.js`, `api/_webpush.js`, `public/js/push.js`                                                                            |
| **Visit counter**        | `api/visita.js`, `api/_visita.js`, `public/js/visit.js`, `public/js/funnel.js`                                                                                       |
| **Data store**           | `api/_store.js` (cliente REST de Upstash, CAS en Lua, `hit` para los límites)                                                                                        |
| **Analytics & consent**  | `public/js/consent.js`, `ga.js`, `clarity.js`, `telemetry.js`, `vercel-analytics.js`, `public/privacidad.html`                                                       |
| **Edge & deploy config** | `vercel.json`, `middleware.js`, `.vercelignore`, `package.json`, `.github/workflows/`                                                                                |

Los nombres de los componentes van en inglés porque son los que usan los hallazgos de los escaneos.

## Puntos de entrada

- Páginas estáticas (`/`, `/reto`, `/sala?sala=…`, `/lab`, `/privacidad`; `/design` solo en
  previews): cualquiera.
- `GET/POST /api/sala`: cualquiera. Acciones create, invite, join, profile, start, move, rematch,
  leave y ping; cada asiento se autentica con un token aleatorio de 16 bytes guardado con hash;
  límite de salas por IP con hash. `GET ?stats=1` da los contadores anónimos del mes (público a
  propósito).
- `POST /api/visita`: cualquiera; solo suma contadores de una lista cerrada.
- `GET/POST /api/push`: cualquiera; guarda suscripciones Web Push (lista de hosts, tamaño de las
  claves), 30 peticiones / 10 min por IP con hash y como mucho `push.maxSubs` en total (tope atómico
  en Redis). La tarea borra las que fallan `push.maxFails` días seguidos o llevan
  `push.inactiveDays` días sin usarse, para que la lista y el envío diario no crezcan sin límite.
- `GET /api/push-cron`: Vercel Cron con `Authorization: Bearer CRON_SECRET`; avisa a todas las
  suscripciones.
- `GET /api/config`: cualquiera; los valores del laboratorio (caché de 15 s en el borde).
- `POST /api/lab {login}`: cualquiera; contraseña comparada por HMAC, 20 intentos / 15 min por IP
  con hash (y 200 / 15 min en total como tope), cookie `oso_lab` HttpOnly, Secure, SameSite=Strict
  de 30 días. El resto del laboratorio y `GET /api/lab-data` piden la cookie. Lo que se guarda en
  el laboratorio se aplica **en directo a todos** (juego, máquina y árbitro en línea).
- Las previews están detrás de Vercel Authentication y comparten Upstash con el prefijo `preview:`.

## Qué protegemos

Lo más importante (decidido por JoseLuis):

1. **Secretos**: `KV_REST_API_URL`/`KV_REST_API_TOKEN` (Upstash, acceso total), la cuenta de
   servicio de GA4 (`GA4_SERVICE_ACCOUNT_JSON`; el servidor solo pide permiso de lectura),
   `VAPID_PRIVATE_KEY`, `CRON_SECRET` y `LAB_PASSWORD`.
2. **Privacidad de los niños**: sin datos personales en la analítica ni en los contadores; la
   analítica solo con permiso (Consent Mode v2, Clarity solo al aceptar); los nombres y avatares
   nunca van a GA4; las suscripciones push son anónimas. Ver [`docs/ANALYTICS.md`](docs/ANALYTICS.md).
3. **Disponibilidad y cuotas**: límites de Vercel Hobby, comandos de Upstash, 50 000 eventos al mes
   de Vercel Web Analytics y cuota de la GA4 Data API. Agotarlas tumba el juego en línea o cuesta
   dinero.

Además: partidas en línea limpias (árbitro, tokens de asiento), valores del laboratorio (el
equilibrio del juego para todos), suscripciones push (no usarlas para spam), integridad de la
página (XSS, CSP) y separación de datos entre producción y previews.

## De quién

Todos cuentan:

- **Visitante anónimo o bot** que llama a `/api/*` con cuerpos y cabeceras a medida.
- **Rival en línea**: conoce el código de la sala y su token; puede intentar jugar por el otro
  asiento, hacer trampas, meter contenido en la pantalla del otro o romper la sala.
- **Intruso del laboratorio**: fuerza bruta, cookie falsa o CSRF en `/lab` para cambiar los
  valores en directo o leer los datos de GA4.
- **Script de terceros comprometido** (GA4, Google Tag Manager, Clarity) que deja pasar la CSP.
- **Cadena de suministro y CI**: GitHub Actions y dependencias de desarrollo (en producción no hay
  dependencias).

## Controles que ya hay

CSP estricta sin inline, `frame-ancestors 'none'`, `X-Frame-Options: DENY`, `nosniff`,
`Referrer-Policy: no-referrer`, COOP/CORP same-origin y `Permissions-Policy` (`vercel.json`); el
texto de los jugadores con `textContent`; nombres y avatares limpiados en el servidor (`cleanName`,
`cleanAvatar`); tokens de asiento con hash y nunca en `publicView`; escrituras CAS en Redis; límites
por IP con hash para crear salas y para push; lista de hosts push (contra SSRF); cookie del
laboratorio con HMAC, comparación en tiempo constante y límite de intentos; `cleanValues` comprueba
los rangos del laboratorio; `.vercelignore` solo sube lo necesario; `design.html` se borra en
producción; prefijo de entorno en las claves de Redis.

## Fuera de alcance o riesgo aceptado

Nada: JoseLuis pidió que se informe de todo (también trampas, DoS y cuotas, fuerza bruta del
laboratorio y previews).

## Preguntas abiertas

- ¿Es fiable `x-forwarded-for` en Vercel para los límites (Vercel pone `x-real-ip`)?
- ¿Tienen que seguir siendo públicos los contadores de `GET /api/sala?stats=1`?
