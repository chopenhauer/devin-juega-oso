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
- **El servidor cuenta sin cookies.** Las salas en línea, las visitas y los avisos del reto suman contadores anónimos por
  mes, sin nadie identificable, para no depender de quien acepta las cookies.
- **Las visitas ocultas se miden.** GA4 solo ve a quien acepta. Desde la 3.13.1, `api/_visita.js`
  cuenta cada carga del juego con la elección guardada y cada clic en el aviso, y Vercel Web
  Analytics cuenta páginas vistas sin cookies. Así se sabe qué parte de las visitas no llega a GA4.
- Lo que se cuenta a quien juega está en la [política de privacidad](../public/privacidad.html):
  si se añade un dato de otro tipo, se actualiza también.

## Herramientas

| Herramienta             | Qué ve                                                               | Dónde se mira                                                                              |
| ----------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Google Analytics 4      | Páginas y eventos del juego (con permiso)                            | Paneles de GA4 (enlaces en el repo privado)                                                |
| Microsoft Clarity       | Mapas de calor y grabaciones anónimas                                | Panel de Clarity                                                                           |
| Contadores del servidor | Embudo y uso de las salas en línea, sin cookies                      | `npm run online:report` (ver [`ONLINE.md`](ONLINE.md))                                     |
| Contador de visitas     | Cargas del juego por consentimiento y clics en el aviso, sin cookies | `npm run online:report` (al final)                                                         |
| Vercel Web Analytics    | Páginas vistas, visitantes, país y dispositivo, sin cookies          | Panel Analytics del proyecto en Vercel (1 mes de historia, 50.000 eventos al mes en Hobby) |

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

### Bienvenida

| Evento       | Cuándo                                                                         | Parámetros                                                                                                                                                             | Para qué                                                                                     |
| ------------ | ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `setup_step` | Se ve una pantalla del inicio antes de la primera partida (una vez por visita) | `step` (`welcome`, `rules_1`…`rules_4`, `mode`, `where`, `players`, `view`, `board`, `start`), `entry` (`first`, `return`, `challenge`), `mode` (el elegido hasta ahí) | **En qué pantalla se va quien no llega a jugar** (idea 30). Decide si hace falta «Jugar ya». |

Las pantallas vistas antes de contestar el aviso de cookies se mandan si después se acepta. El mismo
embudo, de todas las visitas y sin cookies, está en los contadores del servidor (ver abajo).

### Partidas

| Evento         | Cuándo                                        | Parámetros además de los de partida                                                                                                                                                                                                                                                                              | Para qué                                                                                                                                             |
| -------------- | --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `game_start`   | Empieza una partida                           | —                                                                                                                                                                                                                                                                                                                | Cuánto se juega y en qué modo y tablero.                                                                                                             |
| `game_end`     | Termina una partida                           | `end_reason` (`timeout`, `board_full`), `result` (`player`, `machine`, `draw`), `tiebreak` (`none`, `streak`, `streaks`, `draw`), `time_available`, `time_used_max`, `time_left_min`, `time_left_p1…p4`, `cells_filled`, `cells_total`, `score_total`, `extras_hint`, `extras_last`, `extras_swap`, `extras_sos` | **Ajustar el reloj de cada tablero**: el objetivo es que el 50 % acabe por tiempo (`telemetry.timeoutTarget`). Ver si los extras cambian quién gana. |
| `game_abandon` | Se sale de una partida sin acabarla           | `cells_filled`, `cells_total`                                                                                                                                                                                                                                                                                    | En qué punto se deja de jugar (¿tablero demasiado largo?).                                                                                           |
| `game_pause`   | Se pausa la partida desde el menú y se retoma | `action` (`pause`, `resume`), `paused_s` (solo en `resume`: segundos en pausa)                                                                                                                                                                                                                                   | Si se usa la pausa (en el transporte, al tener que dejarlo un rato), en qué modos y tableros y cuánto dura.                                          |
| `end_action`   | Se pulsa un botón de la pantalla final        | `action` (`rematch`, `other_board`, `change_players`, `leave` en línea, `replay`, `share`, `home`, `details`), `end_phrase` (la frase que se vio: `rout`, `close`, `first_win`, `unstoppable`, `lead_back`, `comeback`, `machine_close`, `machine`, `none`)                                                      | Qué se hace al acabar (¿piden revancha?) y si las frases de la 4.2.0 animan a jugar otra.                                                            |

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

| Evento           | Cuándo                                                                                                         | Parámetros                                                                                                            | Para qué                                                                 |
| ---------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `feedback`       | Se contesta 👍/👎                                                                                              | `rating`, `moment` (`first_game`, `beat_machine`, `streak`) + partida                                                 | Si gusta, y en qué momento conviene preguntar.                           |
| `story`          | Se abre la historia desde el ❤️ del pie o se pulsa uno de sus enlaces (código, versiones, instalar, Wikipedia) | `action` (`open`, `repo`, `changelog`, `install`, `wikipedia`)                                                        | Si la historia interesa y cuántos van a ver el código.                   |
| `share`          | Se comparte el juego                                                                                           | `channel` (`native`, `whatsapp`, `email`, `copy`, `image`), `place`                                                   | Qué canal funciona para el boca-oreja.                                   |
| `challenge_open` | Se abre un enlace de reto (`?reto=`)                                                                           | `board_size`, `difficulty`                                                                                            | Cuántos retos se aceptan.                                                |
| `challenge_end`  | Termina una partida del reto                                                                                   | `beaten`, `missing` (puntos de diferencia que faltaron) + partida                                                     | Si los retos se superan o son demasiado duros.                           |
| `daily_start`    | Empieza una partida del [reto del día](ideas/reto-del-dia.md) (`/reto`)                                        | `daily_number` (n.º del reto), `daily_first` (si es el primer intento del día) + partida                              | Cuántos juegan el reto y cuántos lo repiten.                             |
| `daily_end`      | Termina una partida del reto del día                                                                           | `daily_number`, `daily_first`, `daily_streak` (días seguidos), `daily_result` (`won`, `lost`, `draw`) + partida       | Si vuelven al día siguiente y si el reto es muy duro.                    |
| `replay_view`    | Se cierra «Ver la partida»                                                                                     | `replay_seen` (última jugada a la que se llegó), `replay_moves` (jugadas de la partida) + partida                     | Si la repetición se usa y si se ve hasta el final.                       |
| `install_offer`  | Sale, se pulsa o se rechaza «📲 Instalar» al acabar una partida                                                | `action` (`shown`, `install`, `no_thanks`), `platform` (`prompt`: aviso del navegador; `ios`: pasos para iPhone/iPad) | Si la oferta interesa o molesta.                                         |
| `push_optin`     | Sale, se acepta, se rechaza o se quita el aviso 🔔 del reto del día (Web Push)                                 | `action` (`shown`, `granted`, `denied`, `default`, `no`, `off`, `error`), `place` (`end`, `menu`)                     | Si el aviso interesa; las visitas desde él llegan con `utm_source=push`. |
| `install_prompt` | Se contesta el aviso de instalación del navegador                                                              | `outcome` (`accepted`, `dismissed`)                                                                                   | Cuántos instalan de verdad.                                              |
| `app_installed`  | El navegador confirma la instalación                                                                           | —                                                                                                                     | Instalaciones (no llega en iPhone/iPad).                                 |

Todos los eventos llevan además `display_mode` (`standalone` si se abrió desde el icono de la
pantalla de inicio, `browser` si no), para saber cuántas partidas se juegan con OSO instalado.

## Contadores del servidor (en línea, sin cookies)

`api/_sala.js` suma por mes, en Redis, sin nada que identifique a nadie: salas creadas, enlaces
enviados por canal, enlaces abiertos (tarde o con la sala llena), invitados que entran y su espera,
partidas empezadas, terminadas por motivo y abandonadas, jugadas, **extras usados** (`power_hint`,
`power_last`, `power_swap`, `power_sos`), **extras comprados** (`buy_hint`, `buy_swap`, `buy_sos`),
errores, conflictos, tiempo de respuesta y comandos de Redis (para no pasar del plan gratuito).

`npm run online:report` enseña el embudo y los extras del mes. Como no dependen de las cookies, son
la cifra de referencia para el juego en línea; GA4 da el detalle de quien acepta.

## Visitas ocultas (sin cookies)

`public/js/visit.js` manda con `sendBeacon` a `/api/visita` una señal por carga del juego con la
elección guardada (`visits` y `visit_granted`, `visit_denied` o `visit_unset`) y otra por clic en
el aviso (`consent_granted`, `consent_denied`). Se suman en el mismo hash mensual que los contadores
en línea. No guarda IP ni nada del navegador.

- **Ocultas para GA4** = `(visit_denied + visit_unset) / visits`: quien rechaza y quien aún no ha
  contestado al aviso (GA4 solo recibe los avisos sin cookies de Consent Mode, que no salen en los
  informes hasta que hay mucho tráfico).
- **Rechazo en el aviso** = `consent_denied / (consent_granted + consent_denied)`.
- **Embudo de la bienvenida** (desde la 3.17.0): `public/js/funnel.js` manda también cada pantalla
  del inicio vista antes de la primera partida, una vez por visita, como
  `setup_{entrada}_{pantalla}` (`setup_first_welcome`, `setup_return_mode`, `setup_first_start`…).
  `npm run online:report` lo enseña por tipo de entrada, con el porcentaje sobre la primera pantalla.
- Son cargas, no personas: recargar cuenta otra vez. Se comparan con las páginas vistas de GA4, no
  con sus usuarios. Quien bloquea scripts no se cuenta en ninguno de los dos.
- Vercel Web Analytics (`public/js/vercel-analytics.js`, solo en producción) da otra cifra de
  visitantes sin cookies para contrastar. Lo consulta la API `/v1/query/web-analytics/visits`.

## Avisos del reto (sin cookies)

`api/_push.js` suma en el mismo hash mensual, sin guardar nada de quien recibe el aviso:

- `push_on` y `push_off`: alguien activa o quita el aviso; `push_played`: un móvil apuntado avisa de
  que ya ha jugado el reto de hoy.
- En cada envío de las 7:00: `push_runs` (la tarea ha llegado a enviar), `push_sent` (avisos que
  acepta el servicio del navegador), `push_gone` (direcciones que ya no valen y se borran),
  `push_fail` y `push_played_today` (no se avisa porque ya se ha jugado).
- `api/_visita.js` cuenta `push_click` cuando se abre el juego desde un aviso, y GA4 recibe esa visita
  con `utm_source=push`.

`push_sent` solo dice que el servicio de avisos del navegador lo ha aceptado, no que se haya visto en
el móvil; lo que de verdad importa es `push_click`. Hasta el 24-10-2026 la tarea no ha enviado
ninguno.

## Limitaciones

- Solo llega a GA4 lo de quien acepta las cookies, y muchas partidas son pruebas de casa: con pocos
  datos, orientan pero no deciden.
- Cada decisión que depende de datos tiene su umbral escrito: tiempos por tablero hacia las 100
  partidas por tablero ([`ideas/reloj.md`](ideas/reloj.md)), y el modo en línea a las 50 partidas o a los
  2 meses ([`ONLINE.md`](ONLINE.md)).

## Añadir una medición

1. Escribir aquí la pregunta que responde y la decisión que permite tomar.
2. Enviarla con `track()` (sin datos personales), apuntarla en el catálogo de
   [`DATALAYER.md`](DATALAYER.md) y probarla: test unitario de los parámetros y e2e
   que mire `window.dataLayer` (ver `tests/e2e/listen.spec.js`).
3. Registrar los parámetros nuevos como dimensiones o métricas en GA4. La configuración está como
   código en el repo privado (`ga4/config.json` y `sync.py`); sin registrar, GA4 no deja consultarlos.
4. Si es un dato de otro tipo, actualizar la política de privacidad.

## Laboratorio de Julia (`lab_version`)

Desde la 3.18.0 todos los eventos llevan `lab_version`: la versión de los valores que Julia guarda en
`/lab` (0 = los de `config.js`). Sirve para comparar el antes y el después de cada cambio del
cuaderno (por ejemplo, victorias en Fácil con `lab_version` 0 frente a 1). Hay que registrarla en
GA4 como dimensión personalizada de evento.
