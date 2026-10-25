# Reto del día (23)

- **Estado:** Hecho en 4.4.0 (reto), 4.5.0 (avisos), 4.5.1 (un toque) y 4.5.2 (reto a las 2:00 y aviso a
  las 7:00) ·
  medir: **ahora (2.º)**
- **Grupo:** [Llegar, volver y compartir](../ROADMAP.md#4-llegar-volver-y-compartir)
- **Valor / esfuerzo** (estimados por Devin): Alto / Medio

**Reto del día (23):** el mismo tablero de salida para todo el mundo cada día, como Wordle, y al
acabar se comparte la imagen del marcador. Da un motivo para volver y para compartir.

- **Por qué se hizo:** el uso baja (de 8 usuarios al día el 11 y el 13 de octubre a entre 1 y 5
  desde el 14) y compartir es lo que más gente trae.

## Cómo funciona (4.4.0–4.5.1)

- **Dos experiencias en paralelo** (JoseLuis, 24-10-2026):
  - **[juegaoso.com/reto](https://juegaoso.com/reto)** es la landing propia del reto de hoy: número,
    fecha, el tablero con sus letras, en qué consiste y «Jugar el reto →», que empieza la partida al
    momento (4.5.1), sin pasar por «¿Quién juega?» ni elegir nivel o tablero. Usa el nombre guardado («Juegas como Julia ·
    cambiar»); si no hay, lo pide ahí mismo y es opcional (JoseLuis, 24-10-2026). Tiene su propia tarjeta para WhatsApp
    (`public/reto.html`, generada por `scripts/invite-page.js`). No tiene ❓ ni flechas: arriba, junto
    al 🌐, el 🗓️ se convierte en 🏠 para volver a OSO.
  - **La landing de siempre (`/`)** solo lleva al reto de forma discreta: el botón 🗓️ junto al 🌐 de
    jugar en línea y una línea corta («🗓️ Reto del día n.º 297 →», 4.5.1) bajo «Saltar e ir a jugar»
    en la bienvenida y debajo de los modos en «¿Cómo queréis jugar?». Cuando ya se ha jugado, la
    línea dice el resultado y cuánto falta: «🗓️ Reto n.º 297: 7 a 3 · otro en 21 h».
- **El mismo para todo el mundo, sin servidor:** todo sale de la fecha en Madrid
  (`public/js/daily.js`), así que cada móvil calcula el mismo reto por su cuenta, también sin
  conexión. Cambia a las 2:00 de Madrid (`daily.startHour`; antes de esa hora sigue el del día anterior. En la 4.5.0 eran las 7:00 y en la 4.5.2 pasó a las 2:00, JoseLuis, 24-10-2026).
  - **Número:** el día del año (el 24 de octubre es el n.º 297), siempre con la fecha al lado, para
    que no parezca que el reto acaba de empezar (JoseLuis, 24-10-2026).
  - **Tablero y nivel según el día:** 5×5 de lunes a viernes (Fácil el lunes, el miércoles y el
    viernes; Difícil el martes y el jueves) y 6×6 el fin de semana (Fácil el sábado y Difícil el
    domingo). Siempre contra la máquina.
  - **Letras ya puestas:** `daily.letters` (4) letras en el tablero al empezar. Nunca forman OSO ni
    SOS ni dejan un OSO a punto, así que no dan puntos a nadie, tampoco después de un 🛟.
  - **La suerte de la máquina, fija:** si dos personas hacen las mismas jugadas, la máquina responde
    igual.
- **Si ya lo has jugado:** la landing y la línea dicen cómo quedó y cuánto falta para el siguiente;
  la landing, con 2 días seguidos o más, también la racha.
- **Un intento al día:** solo cuenta la primera partida terminada del día; se puede repetir, pero no
  cambia el resultado. Se guarda en el móvil (`oso.daily.v1`, los últimos 60 días).
- **Al acabar:** la pantalla final de siempre, con «🗓️ ¡Reto del día n.º … superado!» (o «¡casi!»)
  y la tarjeta de la racha (`#dailyStreak`, 4.6.0): los días seguidos, los 7 últimos retos con ✓ en los
  jugados, «¡Vuelve mañana para mantener tu racha!» y cuándo sale el siguiente. Solo «Revancha» como
  botón grande: sin «Otro tablero» ni «Cambiar jugadores». «Compartir» manda el resultado con el enlace a `/reto` (campaña
  `reto_del_dia`), y la imagen lleva el número del reto.
- **Medición:** `daily_start` y `daily_end` en GA4 (ver [ANALYTICS](../ANALYTICS.md)), y la entrada
  `daily` en los contadores del servidor de la bienvenida.

## Avisos (4.5.0)

- **Sin email ni cuenta:** al aceptar, el navegador da una dirección anónima (Web Push) que se guarda
  en Upstash con el último día que se jugó el reto, y se borra al quitar los avisos o cuando deja de
  valer. Código: `public/js/push.js`, `api/_push.js`, `api/_webpush.js` (sin dependencias),
  `/api/push` y `/api/push-cron`.
- **Cuándo se pregunta:** solo al acabar el primer reto del día y una sola vez («🔔 ¿Te aviso cuando
  haya reto nuevo?»). Se quita o se vuelve a poner en el menú, en «🔔 Avisos del reto». En el iPhone
  solo funciona con OSO en la pantalla de inicio; si no, no se pregunta.
- **Cuándo llega:** como mucho uno al día, a las 7:00 de Madrid para todo el mundo (`push.hour`, 4.5.2; en la 4.5.0 eran las 18:00), y solo a quien aún no ha jugado el reto de ese día. La tarea de Vercel se lanza a las 5 y a las 6 UTC (verano e invierno) y en el plan gratuito puede llegar hasta 59 minutos tarde. Al tocarlo se
  abre `/reto?utm_source=push&utm_medium=notification&utm_campaign=reto_del_dia`.
- **Comprobado y por comprobar:** están probados la API, el cifrado, que la tarea rechaza las
  llamadas sin su clave y el aviso que enseña el service worker. Todavía no se ha visto llegar un
  aviso de verdad a un móvil ni qué pasa al tocarlo.
- **Medición:** `push_optin` en GA4 y los contadores `push_*` del servidor (ver
  [ANALYTICS](../ANALYTICS.md#avisos-del-reto-sin-cookies)).

## Siguiente

- **Medir (ahora, 2.º):** con una semana de datos, cuántos juegan el reto (`daily_start`), cuántos
  vuelven otro día (`daily_streak`), cuántos lo superan (`daily_result`; si casi nadie gana el
  martes, el jueves y el domingo, el Difícil del reto es demasiado duro), cuántos aceptan el aviso
  (`push_optin`) y cuántos vuelven desde él (`push_click`).
- **[Elegir la hora del aviso](hora-del-aviso.md) (32):** idea de JoseLuis (24-10-2026), que cada
  persona elija a qué hora quiere el aviso. Va después de medir.
