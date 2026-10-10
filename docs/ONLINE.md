# Jugar en línea 1 contra 1 · decisión y plan

Registro de la decisión de arquitectura para invitar a un amigo a una partida a distancia, con las
alternativas que descartamos y los números que nos dirán si acertamos. Si algún día lo revisamos,
empezar por [«Cómo sabremos si funciona»](#cómo-sabremos-si-funciona).

- **Fecha:** 2026-10-09
- **Decidido por:** JoseLuis (con Julia), a partir del análisis comparativo de cinco opciones.
- **Estado:** aceptada y publicada en la 3.0.0 (10-oct-2026).

## Decisión

**Opción A: todo en Vercel.** Funciones en `api/` + Redis de Upstash (Marketplace de Vercel). El
servidor es el árbitro de la partida y usa las mismas reglas que el juego local (`engine.js` y
`match.js`). El aviso de la jugada del rival llega por _polling_ (consultas cada ~1 s solo mientras
juega el rival). El protocolo no depende del transporte, para poder pasar a SSE, WebSockets o
Cloudflare sin tocar el juego.

**Por qué:** OSO es por turnos, una partida son unas decenas de jugadas y basta con que el rival
vea la jugada en menos de un segundo o dos. Todo queda en el mismo proyecto, deploy y previews, sin
tecnologías en beta ni un segundo proveedor, y cabe en las cuotas gratuitas.

## Alternativas que descartamos (y cuándo volver a ellas)

| Opción                                           | Por qué no ahora                                                                                                        | Volver a ella si…                                                                     |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| **B** · WebSockets de Vercel                     | Beta pública; en Hobby la conexión se corta a los 300 s y seguiría haciendo falta Redis para el pub/sub.                | Salen de beta y la latencia de A no basta.                                            |
| **C** · Cloudflare Durable Objects (PartyServer) | Segundo proveedor, cuenta, deploy y CI aparte. Es la que mejor encaja técnicamente: una sala = un objeto.               | Queremos 4 jugadores en línea, espectadores o chat, o A supera los umbrales de abajo. |
| **D** · Supabase / Ably / Firebase               | El árbitro sería un navegador (se puede hacer trampa, la sala depende de quien la crea) y un SDK de terceros en la web. | Necesitamos un prototipo en horas, no un modo estable.                                |
| **E** · WebRTC (PeerJS)                          | Con redes móviles y NAT estricto falla la conexión directa y hace falta un TURN de pago; difícil de depurar.            | No previsto.                                                                          |

Cuotas consultadas el 2026-10-09 (pueden cambiar): Upstash gratis 500 K comandos/mes, 250 MB y
10 GB de tráfico; Vercel Hobby solo uso personal no comercial y funciones de 300 s como máximo;
Cloudflare Durable Objects gratis 100 K peticiones/día; Supabase Realtime gratis 200 conexiones y
2 M mensajes/mes; Ably gratis 200 conexiones y 6 M mensajes/mes; Firebase RTDB gratis 100 conexiones.

## Cómo funciona

- **Sala:** quien invita crea una sala con un código de 5 caracteres sin letras confusas (p. ej.
  `K7QD2`) y un enlace `juegaoso.com/?sala=K7QD2` que se comparte por WhatsApp o copiando. Flujo
  (feedback de JoseLuis, 10-oct): «2 jugadores» → «¿Dónde está tu rival?» (🛋️ Juntos / 🌐 En
  línea) → en «¿Quién juega?» la tarjeta del jugador 2 es la invitación («Abrir sala», código,
  WhatsApp, Copiar). El amigo abre el enlace y ve la misma pantalla con la tarjeta del anfitrión
  (solo lectura) y la suya. Los dos pasan al tablero; solo el anfitrión elige tamaño y pulsa «¡A
  jugar!» (el invitado ve «… está eligiendo el tablero…»). Estados de la sala en el servidor:
  `waiting` (anfitrión solo) → `lobby` (los dos; `profile` cambia nombre/avatar) → `start` del
  anfitrión → `playing` ⇄ `over`. Si el invitado sale del lobby, la sala vuelve a `waiting`; si sale
  el anfitrión, se cierra. El botón 🌐 arriba a la izquierda presenta el modo. Ronda 2 de feedback: los
  avisos del lobby salen en un toast arriba; la tarjeta del rival enseña su avatar en la rejilla (solo
  lectura); «¡A jugar!» se ve desactivado hasta que el amigo entra; al empezar (y en cada revancha)
  hay una cuenta atrás 3-2-1 en los dos móviles: el servidor arranca el primer reloj `COUNTDOWN_MS`
  (3 s) más tarde y rechaza jugadas antes (`countdown`).
- **Asientos:** cada jugador recibe un token aleatorio (128 bits) que el servidor guarda con hash. El
  token va en `localStorage` (`oso.online.v1`) para poder volver tras recargar o perder la conexión.
- **Árbitro:** el cliente envía intenciones (`place`, `swap`, `sos`, `power`, `leave`) con la
  `version` que conoce; el servidor las valida con `match.js`, descuenta el reloj con su propia hora
  y guarda el estado nuevo con `version + 1`. Una jugada con versión antigua se rechaza (409) y el
  cliente recibe el estado actual: así se evitan duplicados y reintentos.
- **Reloj:** lo lleva el servidor (`times` + hora de inicio del turno). El fin por tiempo se calcula
  en la siguiente consulta, sin procesos en segundo plano. Durante la repetición del 🛟 SOS el reloj
  se para lo que dura la animación, igual que en local. En línea, la ayuda ❓ no para el reloj.
- **Desconexión:** no hay una regla aparte. Si se va quien tiene el turno, su reloj sigue corriendo
  y pierde por tiempo; si vuelve antes, sigue jugando con la partida reconstruida. Salir de la
  partida a propósito cuenta como abandono y gana el rival. Cerrar la pestaña no: el navegador no
  distingue cerrar de recargar, y recargar tiene que recuperar la partida. Si no vuelve, pierde por
  tiempo.
- **¿Sigues ahí?** (idea de JoseLuis): tras 20 s sin jugar, quien tiene el turno ve «¿Sigues ahí?»
  con un botón «¡Sigo aquí!» (avisa al rival: «sigue ahí, está pensando») y quien espera recibe un
  mensaje de ánimo según el marcador o el reloj del rival. El reloj no se para. Evento
  `online_nudge` (`role`, `answered`, `answer_ms`) para ajustar los 20 s.
- **Revancha:** en la misma sala, alternando quién empieza.
- **Privacidad:** sin cuentas. Solo se guardan apodo (máx. 16 caracteres), avatar y jugadas, y la
  sala se borra sola a las 24 h. Límite de salas por IP para evitar abusos (la IP no se guarda).

## Cómo sabremos si funciona

Telemetría pensada para evaluar **esta decisión** (no solo el uso). Dos fuentes:

1. **GA4** (solo con cookies aceptadas, sin nombres): eventos `online_create`, `online_join`,
   `online_join_fail` y `game_start`/`game_end`/`game_abandon` con `mode: 'online'`. Al acabar
   cada partida en línea, `online_quality` con:
   - `move_rtt_p50_ms` / `move_rtt_p95_ms`: lo que tarda el servidor en aceptar tu jugada.
   - `sync_p50_ms` / `sync_p95_ms`: desde que el servidor acepta la jugada del rival hasta que tu
     dispositivo la recibe (medido con la hora del servidor, sin depender del reloj del móvil).
   - `polls`, `poll_errors`, `reconnects` (cortes de más de 5 s) y `conflicts` (409).
2. **Contadores del servidor** en Redis, por día y 90 días: salas creadas y unidas, partidas
   terminadas por motivo, jugadas, peticiones, errores 4xx/5xx, conflictos, comandos de Redis y
   duración de las funciones. Se consultan con `npm run online:report` (lee `/api/stats`, protegido
   con `STATS_TOKEN`) y se comparan con estos umbrales.

| Métrica                                        | Va bien    | Revisar la decisión | Qué haríamos                                                  |
| ---------------------------------------------- | ---------- | ------------------- | ------------------------------------------------------------- |
| `sync_p95_ms` (el rival ve tu jugada)          | ≤ 1.500 ms | > 2.500 ms          | Pasar de _polling_ a SSE o long-polling; si no basta, C.      |
| `move_rtt_p95_ms`                              | ≤ 800 ms   | > 1.500 ms          | Revisar región de la función y de Redis (misma región).       |
| Errores 5xx / peticiones                       | < 0,5 %    | > 2 %               | Revisar logs; si es Upstash o Vercel, C.                      |
| Partidas en línea con `reconnects` > 0         | < 10 %     | > 25 %              | Mejorar reconexión; valorar WebSockets (B o C).               |
| Partidas terminadas / empezadas en línea       | ≥ 70 %     | < 50 %              | Mirar abandonos: ¿problema técnico o de UX?                   |
| Uso de la cuota gratuita (Upstash y funciones) | < 30 %     | > 60 %              | Bajar la frecuencia de consultas o pasar a C (sin _polling_). |

Producto (no decide la arquitectura, pero sí si el modo vale la pena): salas unidas / creadas y
partidas en línea por semana.

**Cuándo revisarlo:** con 50 partidas en línea terminadas o a los 2 meses de publicarlo, lo que
llegue antes. Los parámetros nuevos de GA4 hay que registrarlos como definiciones personalizadas
(Admin → Definiciones personalizadas) para que salgan en los informes.

## Plan por fases

Todo en la rama `devin/juego-en-linea`, con preview y aprobación antes de publicar la **3.0.0**
(cambia cómo se juega; los equipos 2 contra 2 pasan a ser la 4.0.0).

| Fase | Qué                                                                                                                 | Sale cuando                                           |
| ---- | ------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| 1    | `public/js/match.js`: estado, jugadas, relojes y fin de partida como funciones puras; `app.js` solo pinta y envía.  | Todos los tests actuales pasan sin cambios visibles.  |
| 2    | `api/sala.js` + Upstash: crear, unirse, consultar y jugar, validado con `match.js`; límites, TTL y contadores.      | Tests unitarios del servidor; funciona en la preview. |
| 3    | Invitar y unirse: «2 jugadores» → «En línea», tarjeta del jugador 2 como invitación, lobby y tablero del anfitrión. | Capturas en móvil y escritorio; a11y en verde.        |
| 4    | Relojes del servidor, reconexión, abandono, revancha y telemetría `online_*`.                                       | e2e con dos navegadores jugando entre sí.             |
| 5    | Prueba real con dos móviles en redes distintas (wifi y 4G), publicar y registrar los parámetros en GA4.             | JoseLuis dice «publica».                              |

## Decisiones tomadas por defecto (se pueden cambiar)

- La versión del modo en línea es la 3.0.0 y los equipos pasan a la 4.0.0.
- No hay espera especial para quien se desconecta: manda su reloj (ver «Desconexión»).
- Sin espectadores por ahora.
- En línea, la ayuda ❓ no para el reloj (en local, sí).
