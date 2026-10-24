# Reto del día (23)

- **Estado:** Hecho en la 4.4.0
- **Grupo:** [Llegar, volver y compartir](../ROADMAP.md#4-llegar-volver-y-compartir)
- **Valor / esfuerzo** (estimados por Devin): Alto / Medio

**Reto del día (23):** el mismo tablero de salida para todo el mundo cada día, como Wordle, y al
acabar se comparte la imagen del marcador. Da un motivo para volver y para compartir.

- **Por qué ahora:** el uso baja (de 8 usuarios al día el 11 y el 13 de octubre a entre 1 y 5
  desde el 14) y compartir es lo que más gente trae.

## Cómo funciona (4.4.0)

- **Dos experiencias en paralelo** (JoseLuis, 24-10-2026):
  - **[juegaoso.com/reto](https://juegaoso.com/reto)** es la landing propia del reto de hoy: número,
    fecha, el tablero con sus letras, en qué consiste y «Jugar el reto →», que deja el juego
    preparado (solo queda poner nombre y avatar). Tiene su propia tarjeta para WhatsApp
    (`public/reto.html`, generada por `scripts/invite-page.js`). No tiene ❓ ni flechas: arriba, junto
    al 🌐, el 🗓️ se convierte en 🏠 para volver a OSO.
  - **La landing de siempre (`/`)** solo lleva al reto de forma discreta: el botón 🗓️ junto al 🌐 de
    jugar en línea y una línea pequeña bajo «Saltar e ir a jugar» y en «¿Cómo queréis jugar?».
- **El mismo para todo el mundo, sin servidor:** todo sale de la fecha en Madrid
  (`public/js/daily.js`), así que cada móvil calcula el mismo reto por su cuenta, también sin
  conexión. Cambia a las 7:00 de Madrid (`daily.startHour`; antes de esa hora sigue el del día
  anterior, JoseLuis, 24-10-2026).
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
- **Al acabar:** la pantalla final de siempre, con «🗓️ ¡Reto del día n.º … superado!» (o «¡casi!») y
  los días seguidos. «Compartir» manda el resultado con el enlace a `/reto` (campaña
  `reto_del_dia`), y la imagen lleva el número del reto.
- **Medición:** `daily_start` y `daily_end` en GA4 (ver [ANALYTICS](../ANALYTICS.md)), y la entrada
  `daily` en los contadores del servidor de la bienvenida.

## Siguiente

- **Avisos (4.5.0, hecho):** una notificación al día a las 18:00 de Madrid, pedida al acabar el
  primer reto y solo para quien aún no lo ha jugado. Se quita desde el menú (`public/js/push.js`,
  `api/_push.js`, `api/_webpush.js`, `/api/push-cron`).
