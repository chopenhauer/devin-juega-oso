# Analítica: qué medimos y para qué

OSO mide lo justo para tomar decisiones sobre el juego: si un tablero dura lo que debe, si quien
recibe un enlace llega a jugar, qué extras se usan… Cada dato está aquí con la pregunta que
responde. Si un dato no responde a ninguna pregunta, no se mide.

## Reglas

- **Sin datos personales.** Ningún evento lleva nombres, avatares, códigos de sala ni nada que se
  escriba. Juegan niños: no pedimos email ni cuenta.
- **Solo con permiso.** Los eventos de partida y Microsoft Clarity solo funcionan si se pulsa
  «Aceptar» en el aviso de cookies (`oso.consent.v1 = granted`). GA4 usa Consent Mode v2: sin
  permiso, la analítica queda denegada; la publicidad está siempre denegada.
- **Solo producción.** `ga.js` y `clarity.js` solo envían desde `juegaoso.com` y
  `devin-juega-oso.vercel.app`; las previews de Vercel no envían nada y los tests sustituyen la red.
- **El servidor cuenta sin cookies.** Las salas en línea suman contadores anónimos por mes, sin
  nadie identificable, para no depender de quien acepta las cookies.
- Lo que se cuenta a quien juega está en la [política de privacidad](../public/privacidad.html):
  si se añade un dato de otro tipo, se actualiza también.

## Herramientas

| Herramienta             | Qué ve                                          | Dónde se mira                                          |
| ----------------------- | ----------------------------------------------- | ------------------------------------------------------ |
| Google Analytics 4      | Páginas y eventos del juego (con permiso)       | Paneles de GA4 (enlaces en el repo privado)            |
| Microsoft Clarity       | Mapas de calor y grabaciones anónimas           | Panel de Clarity                                       |
| Contadores del servidor | Embudo y uso de las salas en línea, sin cookies | `npm run online:report` (ver [`ONLINE.md`](ONLINE.md)) |

Cómo viajan los datos (consentimiento, `dataLayer`, tipos y valores de cada parámetro, registro en
GA4) está en [`DATALAYER.md`](DATALAYER.md).

Los eventos se envían con `track()` de `public/js/telemetry.js`, que añade siempre:

- `app_version`, para poder comparar versiones;
- `browser_language`: el idioma del navegador o del dispositivo (`navigator.language`: `es-ES`,
  `en-US`…). Responde a «¿qué idiomas nos faltan?»: si llegan muchas visitas en un idioma que no
  tenemos, es el siguiente que conviene traducir. Es el código, no dice nada de la persona;
- `app_language`: el idioma en que se ve el juego (`es` por ahora). Comparado con
  `browser_language` dice cuánta gente juega en un idioma que no es el suyo.

GA4 ya guarda su propia dimensión «Idioma», pero solo para las páginas vistas; con estos parámetros
el idioma va también en cada evento de partida.

## Eventos de GA4

**Parámetros de partida** (`gameParams`), en todos los eventos de partida: `board_size` (`5x5`),
`players` (2 o 4), `mode` (`solo`, `two`, `four`, `online`), `vs_machine`, `difficulty` (`easy`, `hard`, `extreme` o `none`),
`theme` y `theme_source`.

### Partidas

| Evento         | Cuándo                              | Parámetros además de los de partida                                                                                                                                                                                                                            | Para qué                                                                                                                                             |
| -------------- | ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `game_start`   | Empieza una partida                 | —                                                                                                                                                                                                                                                              | Cuánto se juega y en qué modo y tablero.                                                                                                             |
| `game_end`     | Termina una partida                 | `end_reason` (`timeout`, `board_full`), `result` (`player`, `machine`, `draw`), `time_available`, `time_used_max`, `time_left_min`, `time_left_p1…p4`, `cells_filled`, `cells_total`, `score_total`, `extras_hint`, `extras_last`, `extras_swap`, `extras_sos` | **Ajustar el reloj de cada tablero**: el objetivo es que el 50 % acabe por tiempo (`telemetry.timeoutTarget`). Ver si los extras cambian quién gana. |
| `game_abandon` | Se sale de una partida sin acabarla | `cells_filled`, `cells_total`                                                                                                                                                                                                                                  | En qué punto se deja de jugar (¿tablero demasiado largo?).                                                                                           |

### Extras y secretos

| Evento         | Cuándo                                                | Parámetros                                        | Para qué                                                   |
| -------------- | ----------------------------------------------------- | ------------------------------------------------- | ---------------------------------------------------------- |
| `extra_used`   | Se usa 💡 pista, 👁️ última jugada, 🔄 cambio o 🛟 SOS | `extra` (`hint`, `last`, `swap`, `sos`) + partida | **Qué extra se usa más** y en qué modo y tablero.          |
| `extra_bought` | Se compra un extra en la tienda secreta               | `extra` (`hint`, `swap`, `sos`)                   | Si la tienda se descubre y qué se compra; ajustar precios. |
| `secret_shown` | Sale el aviso de un secreto                           | `secret`, `place`                                 | Si los secretos llegan a verse.                            |
| `secret_found` | Alguien descubre un secreto                           | `secret`, `told` (si antes se le contó)           | Boca-oreja: si contar el secreto ayuda a encontrarlo.      |
| `theme_change` | Se cambia de tema                                     | `theme`, `theme_from`                             | Qué temas gustan.                                          |

`extra_used` y los `extras_*` solo cuentan lo que se usa en este dispositivo: ni la máquina ni, en
línea, el rival (su móvil lo cuenta si ha aceptado). Una compra (`extra_bought`) no es un uso: el
extra comprado se cuenta como `extra_used` cuando se pulsa.

### En línea

| Evento               | Cuándo                                                          | Parámetros                                                                                                            | Para qué                                                                                                   |
| -------------------- | --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `online_create`      | Se abre una sala                                                | —                                                                                                                     | Embudo de la invitación.                                                                                   |
| `online_invite`      | Se manda el enlace                                              | `channel` (`whatsapp`, `copy`)                                                                                        | Qué canal se usa.                                                                                          |
| `online_invite_open` | Se abre un enlace de invitación                                 | —                                                                                                                     | Si el enlace llega a abrirse.                                                                              |
| `online_join`        | El invitado entra                                               | —                                                                                                                     | Si quien abre el enlace llega a jugar.                                                                     |
| `online_join_fail`   | No se puede entrar                                              | `reason` (por ejemplo sala caducada o llena)                                                                          | Qué paso hay que arreglar.                                                                                 |
| `online_expired`     | La sala caduca                                                  | `role` (`host`, `guest`)                                                                                              | Si los 30 minutos de la sala se quedan cortos.                                                             |
| `online_nudge`       | Sale o se contesta «¿Sigues ahí?»                               | `role` (`mover`, `waiting`), `answered`, `answer_ms`                                                                  | Si los avisos de inactividad sirven.                                                                       |
| `online_machine`     | Se ofrece, se acepta, llega el rival o se cambia a jugar con él | `action` (`offered`, `accepted`, `rival_arrived`, `switched`)                                                         | Si jugar contra la máquina mientras llega el rival evita salas vacías.                                     |
| `online_quality`     | Termina una partida en línea                                    | `move_rtt_p50_ms`, `move_rtt_p95_ms`, `sync_p50_ms`, `sync_p95_ms`, `polls`, `poll_errors`, `reconnects`, `conflicts` | Si la opción A (consultas al servidor) basta o hay que cambiar de arquitectura ([`ONLINE.md`](ONLINE.md)). |

### Opinión y difusión

| Evento     | Cuándo               | Parámetros                                                            | Para qué                                       |
| ---------- | -------------------- | --------------------------------------------------------------------- | ---------------------------------------------- |
| `feedback` | Se contesta 👍/👎    | `rating`, `moment` (`first_game`, `beat_machine`, `streak`) + partida | Si gusta, y en qué momento conviene preguntar. |
| `share`    | Se comparte el juego | `channel` (`native`, `whatsapp`, `email`, `copy`), `place`            | Qué canal funciona para el boca-oreja.         |

## Contadores del servidor (en línea, sin cookies)

`api/_sala.js` suma por mes, en Redis, sin nada que identifique a nadie: salas creadas, enlaces
enviados por canal, enlaces abiertos (tarde o con la sala llena), invitados que entran y su espera,
partidas empezadas, terminadas por motivo y abandonadas, jugadas, **extras usados** (`power_hint`,
`power_last`, `power_swap`, `power_sos`), **extras comprados** (`buy_hint`, `buy_swap`, `buy_sos`),
errores, conflictos, tiempo de respuesta y comandos de Redis (para no pasar del plan gratuito).

`npm run online:report` enseña el embudo y los extras del mes. Como no dependen de las cookies, son
la cifra de referencia para el juego en línea; GA4 da el detalle de quien acepta.

## Limitaciones

- Solo llega a GA4 lo de quien acepta las cookies, y muchas partidas son pruebas de casa: con pocos
  datos, orientan pero no deciden.
- Cada decisión que depende de datos tiene su umbral escrito: tiempos por tablero hacia las 100
  partidas por tablero ([`ROADMAP.md`](ROADMAP.md)), y el modo en línea a las 50 partidas o a los
  2 meses ([`ONLINE.md`](ONLINE.md)).

## Añadir una medición

1. Escribir aquí la pregunta que responde y la decisión que permite tomar.
2. Enviarla con `track()` (sin datos personales), apuntarla en el catálogo de
   [`DATALAYER.md`](DATALAYER.md) y probarla: test unitario de los parámetros y e2e
   que mire `window.dataLayer` (ver `tests/e2e/listen.spec.js`).
3. Registrar los parámetros nuevos como dimensiones o métricas en GA4. La configuración está como
   código en el repo privado (`ga4/config.json` y `sync.py`); sin registrar, GA4 no deja consultarlos.
4. Si es un dato de otro tipo, actualizar la política de privacidad.
