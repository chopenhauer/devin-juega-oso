# Data layer: cómo viajan los datos

[`ANALYTICS.md`](ANALYTICS.md) cuenta **qué** se mide y **para qué**. Este documento cuenta
**cómo**: por dónde pasa cada dato desde que alguien pulsa un botón hasta que llega a GA4, qué forma
tiene y qué tipo y valores lleva cada parámetro. Sirve para añadir un evento, revisar uno o
comprobar en el navegador qué se está enviando.

## Recorrido

```text
app.js ──track('game_end', {...})──▶ telemetry.js
                                     │ ¿oso.consent.v1 === 'granted'?  no ▶ no sale nada
                                     │ sí: añade app_version, app_language, browser_language
                                     ▼
                       window.gtag('event', nombre, parámetros)          (ga.js)
                                     ▼
                       window.dataLayer.push([...])                      (cola en la página)
                                     ▼
                       gtag.js de Google lee la cola ──▶ GA4 (property del juego)

clarity.js ──(solo con permiso)──▶ Microsoft Clarity: mapas de calor y grabaciones, sin eventos propios
api/_sala.js ──(sin cookies)────▶ contadores por mes en Upstash Redis
```

No hay Google Tag Manager: `window.dataLayer` es la cola que crea `gtag.js`, y solo la llena
`window.gtag`. Nadie más escribe en ella.

## Carga y consentimiento

| Fichero                  | Qué hace                                                                                                                                                                                                                                                                                                               |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `public/js/ga.js`        | Solo en `juegaoso.com`, `www.juegaoso.com`, `devin-juega-oso.vercel.app` y en local (los tests cortan la red). Crea `dataLayer` y `gtag`, fija **Consent Mode v2** por defecto (publicidad siempre `denied`; `analytics_storage` `granted` solo si ya se aceptó), manda `config` y carga `gtag.js` de forma asíncrona. |
| `public/js/consent.js`   | El aviso de cookies. Guarda la elección en `localStorage` (`oso.consent.v1` = `granted` o `denied`), actualiza GA4 con `gtag('consent', 'update', …)` y avisa al resto con el evento de ventana `oso:consent`.                                                                                                         |
| `public/js/clarity.js`   | Mismos dominios. Solo carga Clarity si `oso.consent.v1` es `granted` o cuando llega `oso:consent` con `granted`; si después se rechaza, le dice a Clarity que retire el permiso.                                                                                                                                       |
| `public/js/telemetry.js` | `track(nombre, parámetros)`: si no hay permiso, devuelve `false` y no envía nada. Si lo hay, añade los parámetros comunes y llama a `gtag`.                                                                                                                                                                            |

Sin permiso, `gtag.js` sí se carga, pero con la analítica denegada: GA4 solo recibe avisos sin
cookies de las páginas vistas, y `track()` no envía ningún evento del juego.

Los ficheros son externos y no hay nada inline, para que la CSP no tenga que permitir scripts
inline (ver `vercel.json`).

## Forma de cada entrada

`gtag` mete en `dataLayer` sus argumentos tal cual. Al cargar la página la cola tiene:

```js
[
  'consent',
  'default',
  {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'granted',
  },
][('js', Date)][('config', 'G-8ZJ4B238C4')];
```

Y cada evento del juego es una entrada `['event', nombre, parámetros]`. Por ejemplo, al acabar una
partida de dos en el mismo móvil:

```js
[
  'event',
  'game_end',
  {
    board_size: '5x5',
    players: 2,
    mode: 'two',
    vs_machine: false,
    difficulty: 'none',
    theme: 'classic',
    theme_source: 'default',
    end_reason: 'board_full',
    result: 'player',
    time_available: 90,
    time_used_max: 41,
    time_left_min: 49,
    time_left_p1: 49,
    time_left_p2: 63,
    cells_filled: 25,
    cells_total: 25,
    score_total: 4,
    extras_hint: 1,
    extras_last: 0,
    extras_swap: 0,
    extras_sos: 0,
    app_version: '3.10.0',
    app_language: 'es',
    browser_language: 'es-ES',
  },
];
```

## Parámetros comunes

Los añade `track()` a **todos** los eventos:

| Parámetro          | Tipo   | Valores                                                                          |
| ------------------ | ------ | -------------------------------------------------------------------------------- |
| `app_version`      | texto  | La versión de `public/js/version.js` (`3.10.0`)                                  |
| `app_language`     | texto  | El idioma en que se ve el juego (`es`; ver `LANGS` en `public/js/i18n.js`)       |
| `browser_language` | texto  | `navigator.language` (`es-ES`, `en-US`…), o `und` si no lo hay                   |
| `lab_version`      | número | Versión de los valores del laboratorio de Julia (`0` = los de `config.js`)       |
| `display_mode`     | texto  | `standalone` (abierto desde el icono instalado) o `browser` (desde el navegador) |

**Parámetros de partida** (`gameParams()` de `telemetry.js`), en `game_start`, `game_end`,
`game_abandon`, `extra_used` y `feedback`:

| Parámetro      | Tipo     | Valores                                                                                                                                      |
| -------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `board_size`   | texto    | `{n}x{n}` (`5x5`, `6x6`…)                                                                                                                    |
| `players`      | número   | `2` o `4`                                                                                                                                    |
| `mode`         | texto    | `solo` (contra la máquina), `two` (mismo dispositivo), `four`, `online`                                                                      |
| `vs_machine`   | booleano | `true` solo en `solo`                                                                                                                        |
| `difficulty`   | texto    | `easy`, `hard`, `extreme`; `none` si no se juega contra la máquina                                                                           |
| `theme`        | texto    | id del tema de `public/js/themes.js` (`classic`, `halloween`…)                                                                               |
| `theme_source` | texto    | `default`, `chosen` (elegido o guardado), `festival` (por fecha), `host` (en línea, el del anfitrión), `challenge` (el de un enlace de reto) |

## Catálogo de eventos

Todos se envían desde `public/js/app.js`, salvo `setup_step`, que sale de `public/js/funnel.js`. «Partida» = los parámetros de partida de arriba.

| Evento               | Parámetros propios                                                                                                                                                                                                                                                                                      |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `setup_step`         | `step` (`welcome`, `rules_1`…`rules_4`, `mode`, `where`, `players`, `view`, `board`, `start`), `entry` (`first`: con la bienvenida, `return`: empieza en el modo, `challenge`: enlace de reto), `mode` (el elegido hasta esa pantalla). Una vez por pantalla y visita, solo antes de la primera partida |
| `game_start`         | partida                                                                                                                                                                                                                                                                                                 |
| `game_end`           | partida + `end_reason` (`timeout`, `board_full`), `result` (`player`, `machine`, `draw`), `time_available`, `time_used_max`, `time_left_min`, `time_left_p1…p4` (s), `cells_filled`, `cells_total`, `score_total`, `extras_hint`, `extras_last`, `extras_swap`, `extras_sos` (veces)                    |
| `game_abandon`       | partida + `cells_filled`, `cells_total`                                                                                                                                                                                                                                                                 |
| `extra_used`         | partida + `extra` (`hint`, `last`, `swap`, `sos`)                                                                                                                                                                                                                                                       |
| `extra_bought`       | `extra` (`hint`, `swap`, `sos`)                                                                                                                                                                                                                                                                         |
| `secret_shown`       | `secret` (`temas`, `tienda`), `place` (`start`, `end`)                                                                                                                                                                                                                                                  |
| `secret_found`       | `secret` (`temas`, `tienda`), `told` (booleano: si antes se le contó)                                                                                                                                                                                                                                   |
| `theme_change`       | `theme`, `theme_from`                                                                                                                                                                                                                                                                                   |
| `online_create`      | —                                                                                                                                                                                                                                                                                                       |
| `online_invite`      | `channel` (`whatsapp`, `copy`)                                                                                                                                                                                                                                                                          |
| `online_invite_open` | —                                                                                                                                                                                                                                                                                                       |
| `online_join`        | —                                                                                                                                                                                                                                                                                                       |
| `online_join_fail`   | `reason`: el código de error del servidor (`no_room`, `expired`, `full`, `rate`…; ver los `HttpError` de `api/_sala.js`)                                                                                                                                                                                |
| `online_expired`     | `role` (`host`, `guest`)                                                                                                                                                                                                                                                                                |
| `online_nudge`       | `role` (`mover`: a quien le toca, `waiting`: quien espera); con `mover` también `answered` (booleano) y `answer_ms` (ms, `0` si no contestó)                                                                                                                                                            |
| `online_machine`     | `action` (`offered`, `accepted`, `rival_arrived`, `switched`)                                                                                                                                                                                                                                           |
| `online_quality`     | `board_size` + `move_rtt_p50_ms`, `move_rtt_p95_ms`, `sync_p50_ms`, `sync_p95_ms` (ms), `polls`, `poll_errors`, `reconnects`, `conflicts` (veces); de `qualityParams()` en `public/js/online.js`                                                                                                        |
| `feedback`           | partida + `rating` (`up`, `down`), `moment` (`first_game`, `beat_machine`, `streak`)                                                                                                                                                                                                                    |
| `challenge_open`     | `board_size`, `difficulty`                                                                                                                                                                                                                                                                              |
| `challenge_end`      | Los de partida + `beaten` (booleano), `missing` (número)                                                                                                                                                                                                                                                |
| `replay_view`        | Los de partida + `replay_seen` (número, la jugada más avanzada que se vio), `replay_moves` (número de jugadas)                                                                                                                                                                                          |
| `install_offer`      | `action` (`shown`, `install`, `no_thanks`), `platform` (`prompt`, `ios`)                                                                                                                                                                                                                                |
| `install_prompt`     | `outcome` (`accepted`, `dismissed`)                                                                                                                                                                                                                                                                     |
| `app_installed`      | —                                                                                                                                                                                                                                                                                                       |
| `story`              | `action` (`open`: se abre la historia desde el ❤️ del pie, `repo`: se pulsa «🐙 Ver el código», `changelog`: el enlace «todas sus versiones», `install`: el botón «📲 Instala como una app», `wikipedia`: el enlace «juego tradicional»)                                                                |
| `share`              | `channel` (`native`, `whatsapp`, `email`, `copy`, `image`), `place` (`start`, `end`, `menu`)                                                                                                                                                                                                            |

## Registro en GA4

GA4 recibe cualquier parámetro, pero solo deja consultar en los informes los que están registrados.
El registro está como código en el repo privado `chopenhauer/oso-privado` (`ga4/config.json`,
`python3 sync.py plan|apply`):

- **Dimensiones** (texto o categoría): `action`, `answered`, `app_language`, `app_version`,
  `board_size`, `browser_language`, `channel`, `difficulty`, `display_mode`, `end_reason`, `entry`, `extra`,
  `mode`, `moment`, `outcome`, `place`, `platform`, `players`, `rating`, `reason`, `result`, `role`,
  `secret`, `step`, `theme`, `theme_from`, `theme_source`, `told`, `vs_machine`.
- **Métricas** (números que se suman o se promedian): `answer_ms`, `cells_filled`, `cells_total`,
  `conflicts`, `extras_hint`, `extras_last`, `extras_sos`, `extras_swap`, `move_rtt_p50_ms`,
  `move_rtt_p95_ms`, `poll_errors`, `polls`, `reconnects`, `score_total`, `sync_p50_ms`,
  `sync_p95_ms`, `time_available`, `time_left_min`, `time_used_max`.
- **Sin registrar:** `time_left_p1…p4`. Llegan a GA4, pero no salen en los informes; para el
  reloj basta con `time_left_min` y `time_used_max`.

Un parámetro nuevo tarda 24-48 h en verse en los informes después de registrarlo.

## Lo que nunca entra

Ni nombres, ni avatares, ni códigos de sala, ni tokens, ni nada que se escriba. Los textos de los
jugadores solo viven en la pantalla y en la sala. Si un parámetro nuevo pudiera identificar a alguien,
no se añade (ver las reglas de [`ANALYTICS.md`](ANALYTICS.md)).

## Contadores del servidor

Aparte de GA4 y sin cookies, `api/_sala.js` junta en cada petición un objeto `stats` con contadores
a `1` y los suma por mes en Redis (`store.count(mes, stats)`, se guardan 400 días):

| Grupo    | Claves                                                                                                                         |
| -------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Salas    | `created`, `expired`, `invited`, `invite_whatsapp`, `invite_copy`, `opened`, `open_late`, `open_full`, `joined`, `join_wait_s` |
| Partidas | `started`, `finished`, `end_{motivo}`, `abandoned`, `moves`, `pings`                                                           |
| Extras   | `power_hint`, `power_last`, `power_swap`, `power_sos`, `buy_hint`, `buy_swap`, `buy_sos`                                       |
| Salud    | `requests`, `e4xx`, `e5xx`, `conflicts`, `ms`, `timed`, `redis_cmds`                                                           |

`npm run online:report` los lee y enseña el embudo del mes ([`ONLINE.md`](ONLINE.md)).

`api/_visita.js` suma en el mismo hash, sin cookies, `visits`, `visit_{granted|denied|unset}`,
`consent_{granted|denied}` y el embudo de la bienvenida `setup_{first|return|challenge}_{pantalla}`
(las mismas pantallas que `setup_step`).

## Verlo y probarlo

- **En el navegador**, con las cookies aceptadas, en la consola:
  `dataLayer.filter((e) => e[0] === 'event').map((e) => [e[1], e[2]])`. En las previews de Vercel
  no se carga `ga.js`, así que `dataLayer` no existe: pruébalo en local (`npm start`).
- **Tests unitarios:** `tests/unit/telemetry.test.js` (parámetros de `gameParams()` y
  `gameEndParams()`) y `tests/unit/analytics-hosts.test.js` (en qué dominios se cargan
  GA4 y Clarity).
- **Tests en navegador:** `tests/e2e/listen.spec.js` corta la red de Google y Clarity, juega y mira
  qué hay en `window.dataLayer`; `tests/e2e/consent.spec.js` comprueba el aviso de cookies.

## Añadir un evento

1. Apuntar en [`ANALYTICS.md`](ANALYTICS.md) la pregunta que responde.
2. Llamar a `track('nombre', { ... })` en `app.js`, en `snake_case`, con valores cortos y fijos (no
   textos libres). Si es de partida, usar `modeParams()`.
3. Añadirlo al catálogo de este documento, con sus tipos y valores.
4. Test unitario de los parámetros, si se calculan, y e2e que lo busque en `dataLayer`.
5. Registrar los parámetros nuevos en `ga4/config.json` del repo privado y `sync.py apply` al
   publicar.
6. Si es un dato de otro tipo, actualizar la política de privacidad.
