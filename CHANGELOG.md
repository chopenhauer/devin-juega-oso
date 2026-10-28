# Changelog y diario de decisiones

Versiones de OSO, el juego de Julia y JoseLuis, con las mejoras de cada una y las decisiones que
tomamos por el camino. La versión que sale en el pie del juego viene de `public/js/version.js`.

**Cómo numeramos (MAYOR.MENOR.CORRECCIÓN):**

- **Mayor:** un modo nuevo, o una regla nueva o distinta: cómo se puntúa, cómo se gana o cómo se
  desempata. Ejemplos: 4 jugadores (2.0.0), en línea (3.0.0), desempate por rachas (4.0.0).
- **Menor:** algo nuevo que se ve o se usa, sin cambiar las reglas: una pantalla, un botón, un tema,
  un nivel, un aviso o un secreto.
- **Corrección:** arreglos, ajustes de diseño o de textos, cambiar un valor de `config.js` (tiempos,
  horas, máquina), medir algo que no se ve y cambios internos.
- **Sin versión:** si solo cambian documentos, tests o el CI (nada de lo que se publica). Van con la
  siguiente versión.
- **Si una versión mezcla varias cosas,** manda la más alta.

Estas reglas son del 25-10-2026 (decisión de JoseLuis). Las versiones anteriores no se renumeran:
algunas no las siguen, como la 3.6.0 y la 4.3.0 (cambios de tiempos, hoy serían correcciones) o la
3.9.0 (textos en `es.json`, un cambio interno).

Las versiones hasta la 1.8.2 se reconstruyeron a partir del historial de `main`. Lo pendiente está en
[`docs/ROADMAP.md`](docs/ROADMAP.md).

## Próximamente

- **Equipos con 4 jugadores** (idea, versión mayor): elegir entre cada uno por su cuenta o 2 contra 2, con
  nombre de equipo opcional («Equipo 1» contra «Equipo 2» por defecto).

## [4.7.9] - 2026-10-28

**🔎 Código más fácil de leer, sin cambiar nada del juego (Norma)**

- **Por qué:** dos escaneos de Norma del 28-10-2026 marcaron 10 cadenas de `? :` anidadas y 26
  `!!valor`. Son avisos de estilo: ninguno era un fallo.
- **Qué cambia:**
  - Las 10 cadenas de `? :` pasan a funciones pequeñas con `if` y `return`, en el mismo orden: el
    texto de la barra de turno, las etiquetas y los avisos de la sala en línea, el error al abrir
    una invitación, el texto final del reto y el foco del menú lateral (`app.js`), y el modo y la
    entrada del embudo en `onboarding.js`.
  - Los 26 `!!valor` pasan a `Boolean(valor)` en `app.js`, `onboarding.js`, `push.js`, `install.js`,
    `daily.js`, `themes.js`, `api/_sala.js` y `playwright.config.js`.
- **Cómo se hizo:** tres sesiones de Devin en paralelo, cada una con una parte del código sin tocar
  las mismas líneas, y luego juntas en una sola rama.
- **Versión de corrección:** es un cambio interno.

## [4.7.8] - 2026-10-27

**🔎 Los últimos `catch` vacíos, con aviso en la consola**

- **Por qué:** un tercer escaneo de Norma (27-10-2026) marcó los 7 `catch` vacíos que quedaban, la
  llamada a `bootOnline()` sin `.catch()` y la URL `http://localhost` de `scripts/serve.js`.
- **Qué cambia:**
  - Los 7 `catch` usan `swallowed()` de `report.js`, como en la 4.7.6: un `console.warn` la primera
    vez que falla cada sitio (el sonido, la pista del 🎨, la caché del laboratorio, la pregunta de
    los avisos, el contador de visitas y leer el consentimiento). `ga.js` no es un módulo y llama a
    `console.warn` directamente. Ya no queda ningún `catch` vacío en `public/js`.
  - Si recuperar la partida en línea al cargar falla por algo inesperado, ahora queda en la
    consola. El inicio sigue funcionando igual.
  - `scripts/serve.js` (el servidor local de las pruebas, que no se publica) lee la dirección de la
    cabecera `Host` de cada petición, en vez de suponer `localhost`.
- **Versión de corrección:** es un cambio interno.

## [4.7.7] - 2026-10-27

**🔎 Otra vez el aviso del «token» en el marcador de la sesión**

- **Por qué:** Norma volvió a marcar «token en `localStorage`» en `app.js`, en la línea que guarda
  `oso.session.v1`. Es el mismo falso positivo de la 4.7.5: ahí solo va el marcador de las partidas
  seguidas (jugadores, avatares, puntos y ganador), no una credencial. La clave de verdad, la del
  asiento en línea, ya va en una cookie `HttpOnly` desde la 4.7.5.
- **Qué cambia:** en `recordSession` las variables se llaman ahora `SCOREBOARD_STORAGE`,
  `scoreboard` y `group` en vez de `SESSION_KEY`, `session` y `key`, que es lo que hacía pensar en un
  token, con un comentario que lo explica. La clave guardada sigue siendo `oso.session.v1`, así que
  nadie pierde su marcador.
- **Versión de corrección:** es un cambio interno.

## [4.7.6] - 2026-10-27

**🔎 Avisos en la consola cuando algo opcional falla**

- **Por qué:** un segundo escaneo de Norma (27-10-2026) marcó 20 `catch` vacíos. Ninguno se tragaba
  un fallo de la partida: todos protegen cosas opcionales que pueden fallar en el navegador
  (`localStorage` en modo privado o lleno, el sonido, `setPointerCapture`, `sendBeacon`), y el juego
  ya seguía sin ellas. Pero no quedaba rastro, y costaba saber por qué algo no se recordaba.
- **Qué cambia:** `report.js` exporta `swallowed(lugar, error)`, que deja un `console.warn` con
  `OSO: lugar` la primera vez que falla cada sitio, no en cada partida. Los 20 sitios lo usan
  (`clarity.js`, que no es un módulo, llama a `console.warn` directamente). El jugador no ve nada
  nuevo: no hay aviso en pantalla, porque no hay nada que pueda hacer, y no se manda a GA4 ni a otro
  servicio, para no sacar nada del móvil.
- **Versión de corrección:** es un cambio interno.

## [4.7.5] - 2026-10-27

**🔒 Textos con HTML filtrados y la clave en línea, en una cookie**

- **Por qué:** un escaneo de Norma (27-10-2026) avisó de que `translateDom` y el botón «Revancha»
  escribían con `innerHTML`. Los textos salen de `es.json`, que es nuestro, y la CSP ya no deja
  ejecutar scripts en línea, así que el riesgo era bajo. Aun así, un texto mal escrito o una
  traducción futura podían colar etiquetas o atributos.
- **Qué cambia:** `setHtml` (`i18n.js`) lee el HTML con `DOMParser` y solo deja `<b>`, `<strong>`,
  `<em>`, `<br>`, `<span>` (con `class` y `data-config`) y `<a>` (con `href`, `target` y `rel`, y
  solo enlaces que empiezan por `/` o `https://`). Lo demás se queda fuera. Sin dependencias nuevas.
- **La clave del asiento en línea:** Norma señaló «token en `localStorage`» en `oso.session.v1`,
  que es el marcador de las partidas seguidas, no una credencial. La que sí lo es, la clave del
  asiento en una sala, estaba en `oso.online.v1`. Ahora `/api/sala` la pone en una cookie `HttpOnly`
  y `SameSite=Strict` por sala y asiento (solo para `/api/sala`), la renueva en cada acción y la
  borra al salir. El cliente manda solo el número de asiento y `oso.online.v1` guarda el código y el
  asiento. Recargar la página sigue devolviendo a la partida. Un asiento guardado antes de esta
  versión sigue funcionando y su clave pasa a la cookie (decisión de JoseLuis: opción de la cookie).
- **Versión de corrección:** es un arreglo interno, no se ve nada nuevo.

## [4.7.4] - 2026-10-27

**🔒 Avisos del reto: tampoco a las direcciones guardadas antes** ([6630ea7](https://github.com/chopenhauer/devin-juega-oso/commit/6630ea7f3e16a5bd055656caa56ff210b7552eef))

- **Por qué:** el code scan de seguridad (27-10-2026) vio que la lista de hosts aceptaba cualquier
  subdominio de `google.com` y el cron diario mandaba un POST firmado con VAPID a la URL que
  eligiera quien se apuntaba (un SSRF limitado). La 4.7.1 ya cerró la lista para las nuevas, pero
  las que se guardaron antes seguían en Redis y el cron les seguía enviando hasta que fallaran 7
  días o pasaran 60.
- **Qué cambia:** el cron vuelve a comprobar cada suscripción guardada con `cleanSubscription` antes
  de enviar y borra las que ya no pasan (cuentan en `push_dropped`). Además se rechazan las
  direcciones con puerto o usuario en la URL.
- **Versión de corrección:** es un arreglo interno, no se ve nada nuevo.

## [4.7.3] - 2026-10-27

**🧪 Laboratorio: los datos de GA4, siempre como texto** ([0ed1993](https://github.com/chopenhauer/devin-juega-oso/commit/0ed19931c413ceaf6c8f6b359b4116f571063052))

- **Por qué:** el escaneo de seguridad vio que cualquiera que conozca el ID de medición público
  puede mandar a GA4 una partida falsa con `lab_version` hecho de HTML. `/api/lab-data` lo pasaba
  tal cual y la vista de datos del laboratorio lo metía con `innerHTML` en el título de la tabla:
  podía pintar texto, enlaces o imágenes falsos (la CSP impedía ejecutar scripts).
- **Servidor:** `fetchGames` (`api/_labdata.js`) solo se queda con las filas cuyo `lab_version` es
  `(not set)` o un número de guardado; las demás se descartan.
- **Navegador:** `renderData` (`public/js/lab.js`) construye la tabla con `createElement` y
  `textContent`, sin `innerHTML`, así que aunque llegue un valor raro se ve como texto.
- **Corrección:** un cambio interno de seguridad, sin nada nuevo que se vea.

## [4.7.2] - 2026-10-27

**🔒 Laboratorio: los intentos de entrar se cuentan por IP** ([ffb9c39](https://github.com/chopenhauer/devin-juega-oso/commit/ffb9c39a176e7a6728924a67b6662d07c0c0681f))

- **Por qué:** el escaneo de seguridad encontró que el login de `/lab` contaba todos los intentos
  en un solo contador global (`lab:tries`, 20 cada 15 min). Cualquiera podía mandar 21 contraseñas
  malas cada 15 minutos y dejar a Julia sin poder entrar (la cookie de 30 días ya emitida seguía
  valiendo). No se exponía ningún dato.
- **Qué cambia** (`api/_lab.js`): cada IP (`x-real-ip`, guardada con hash, como en las salas y en
  push) tiene sus 20 intentos cada 15 min. Queda un tope global de 200 cada 15 min como respaldo
  contra la fuerza bruta repartida. Se mira primero el contador de la IP, así que una IP bloqueada
  ya no suma al global: una sola fuente no puede agotarlo.
- **Lo que queda:** alguien con unas 10 IPs distintas aún podría agotar el tope global durante 15
  min. Es el precio de tener el tope; está anotado en `SECURITY_MODEL.md`.
- **Corrección:** un cambio interno de seguridad, sin nada nuevo que se vea.

## [4.7.1] - 2026-10-27

**🔔 La lista de avisos del reto, con tope y limpieza** ([e58f5ea](https://github.com/chopenhauer/devin-juega-oso/commit/e58f5eaba645119ce3ce555628f2319af45158f5))

- **Por qué:** el escaneo de seguridad vio que cualquiera, con muchas IP, podía apuntar direcciones
  falsas sin límite (solo había 30 peticiones / 10 min por IP). Se guardaban para siempre y la
  tarea de las 7:00 las lee todas y avisa a cada una, así que podía no llegar a tiempo a quien de
  verdad quiere el aviso.
- **Tope:** como mucho `push.maxSubs` (2000) móviles apuntados. Con la lista llena no se apunta
  nadie nuevo (`/api/push` responde 503 y suma `push_full`); quien ya está puede seguir
  actualizando. La comprobación y el guardado van en un solo script de Redis, así que el tope
  aguanta peticiones a la vez.
- **Limpieza:** la tarea borra las direcciones que fallan `push.maxFails` (7) días seguidos
  (`push_dropped`) y las que llevan `push.inactiveDays` (60) días sin jugar el reto ni volver a
  apuntarse (`push_stale`; cada suscripción guarda `seen`, el último día que llamó). Si esa persona
  vuelve a jugar un reto, se apunta sola otra vez.
- **Lista de hosts:** de Google solo valen `fcm.googleapis.com` y `jmt<n>.google.com`, no cualquier
  subdominio de `google.com` (eran direcciones que nunca dan 404 y nunca se borraban).

## [4.7.0] - 2026-10-27

**🌟 En pleno, y tras ganar el reto, otra partida**

- **Por qué:** JoseLuis (27-10-2026) ganó un reto 18–0 y preguntó si era el máximo. No lo es: en un
  5×5 caben como mucho 22 OSO (4×4: 9; 6×6: 30; 7×7: 51). Pidió celebrar la partida perfecta en
  cualquier modo y marcarla en la racha, y que al ganar el reto «Revancha» no sea lo principal.
- **En pleno** (`Match.isPleno`): ganas con todos los puntos (los demás, 0) y todas las fichas del
  tablero forman parte de algún OSO (o SOS tras el 🛟). Vale en todos los modos. No cambia ninguna
  regla: solo se celebra.
  - En la pantalla final sale «🌟 ¡En pleno!» con «Todas las fichas puntúan y todos los puntos son
    tuyos», el doble de confeti y sin otra frase. `end_action` lleva `end_phrase: pleno`.
  - En el reto: «🌟 ¡Reto del día n.º … superado en pleno!», se guarda `pleno: true` en
    `oso.daily.v1` y en la racha ese día lleva ★ con otro color en vez de ✓.
  - El OSO wrap cuenta las partidas en pleno (`plenos`).
- **Reto ganado:** el botón grande es «🎮 Jugar otra partida» (en línea, juntos o contra la máquina),
  que lleva al inicio (`end_action: play_more`), y «Repetir el reto» pasa a secundario. Si pierdes o
  empatas, sigue «Revancha» como botón grande. Fuera del reto no cambia nada.
- **Versión menor:** hay un botón y una celebración nuevos, sin cambiar las reglas.

## [4.6.3] - 2026-10-26

**📦 OSO wrap: el móvil empieza a guardar tu año** ([e029c8b](https://github.com/chopenhauer/devin-juega-oso/commit/e029c8b9045fadf649bdd913b6fece9991e38d6f))

- **Por qué:** JoseLuis (26-10-2026) quiere un resumen de fin de año como el de Spotify, el OSO wrap
  ([idea 35](docs/ideas/oso-wrap.md)), y pidió empezar por guardar los datos que luego hagan falta.
  Hasta ahora el móvil no guardaba ningún historial de partidas, y cuanto antes empiece, más tendrá
  que contar el wrap de 2026.
- **Qué se guarda:** al acabar cada partida, unos contadores del año en la clave nueva
  `oso.wrap.v1`. No se guarda cada partida, solo los totales:
  - partidas, días con partida, el primer y el último día;
  - partidas por modo, tablero y tema, y extras usados en el móvil;
  - avatares de quien juega en el móvil y veces que se cambia de tema en el 🎨;
  - la sesión más larga y las maratones: sesiones de 5 partidas o más (`wrap.marathonGames`);
  - veces que cambia tu nombre, el del jugador 1 o el de tu asiento en línea, de una partida a otra;
  - veces que compartes, por canal (WhatsApp, correo, copiar, imagen o el menú del móvil);
  - remontadas con el 🛟, extras comprados en la tienda y secretos encontrados;
  - partidas sin conexión y desde la app instalada;
  - enlaces de reto abiertos, jugados y superados, y veces que se ve «Ver la partida»;
  - tu némesis: quién te gana más, la máquina por nivel o el nombre del rival;
  - los días seguidos con alguna partida, las revanchas y la racha más larga de revanchas seguidas;
  - contra la máquina, las victorias, derrotas y empates por nivel; en línea, los de tu asiento;
  - en Juntos y con 4, cuántas partidas juega y gana cada nombre (como mucho 20 nombres al año);
  - los OSO hechos, la mejor partida, la victoria más amplia y la racha más larga;
  - a qué día de la semana y a qué hora se juega, y cuántas partidas acaban por tiempo;
  - del reto del día: los primeros intentos, las victorias y la mejor racha. `oso.daily.v1` solo
    guarda 60 días, así que esto no se pierde.
- **Privacidad:** nada sale del móvil y no hay eventos nuevos en GA4. Se guardan este año y el
  anterior, y se borra como el resto, con «borrar datos del sitio». La política de privacidad y el
  README ya lo cuentan.
- **No se ve nada:** la pantalla del wrap es para diciembre. Por eso es una corrección.
- **Código:** `wrap.js` es un módulo nuevo y puro, con sus tests. `app.js` lo llama al acabar la
  partida y al acabar el primer intento del reto.

## [4.6.2] - 2026-10-26

**🗓️ La tarjeta del reto, igual que la de la portada** ([0c77839](https://github.com/chopenhauer/devin-juega-oso/commit/0c77839b56c8449051b36eea800fe57356e8a97c))

- **Por qué:** JoseLuis (26-10-2026), con capturas de su móvil: al pasar de la portada a `/reto`
  la tarjeta cambiaba de sitio y de tamaño. Desde la 4.6.1 empezaba justo bajo los botones redondos y
  era más baja. Las dos landings tienen que seguir el mismo patrón, con la tarjeta centrada y el
  mismo peso visual. Solo se ajusta la del reto.
- **Centrada:** la tarjeta del reto se coloca como la de la portada, centrada en la pantalla y
  con los mismos márgenes. Ya no se sube bajo los botones redondos.
- **Mismo tamaño:** la miden los pasos ocultos del inicio, como en la portada, más el hueco de los
  botones de pasos, que aquí no salen y se reparte arriba y abajo. En un móvil de 412 × 915 las dos
  tarjetas van de 180 a 735 px. Con el reto ya jugado, el contenido necesita algo más y la tarjeta
  crece solo eso: 8 px. En el iPad y en el escritorio, lo mismo.
- **Móviles bajos (menos de 680 px de alto):** allí la tarjeta de la portada ya llega hasta los
  botones redondos, así que la del reto sigue empezando justo debajo de ellos con su propio alto, como
  en la 4.6.1, para que el título no quede debajo de un botón.
- **Margen del panel:** el mismo que en la portada. El aire que pidió JoseLuis en la 4.6.1 sale ahora
  del alto de la tarjeta, y el espacio entre bloques no cambia.
- **Sin cambios** en los textos, el orden, el tablero, el botón, la portada ni las reglas. Es una
  corrección: ajuste de diseño.

## [4.6.1] - 2026-10-25

**🗓️ La landing del reto, más corta y clara: qué toca hoy, cómo te fue y cuándo vuelve** ([09727d9](https://github.com/chopenhauer/devin-juega-oso/commit/09727d9e4fb586c2a0051b0ca3bbb43e724b2569), [cf07316](https://github.com/chopenhauer/devin-juega-oso/commit/cf07316d433f0f23a662a23f11102a33fec30c86), [03550b0](https://github.com/chopenhauer/devin-juega-oso/commit/03550b0e06f56f6b4eaea57fed22d2381e83c2e1))

- **Por qué:** en `/reto` todo iba en dos frases largas («6×6 contra la máquina en difícil, con 4
  letras ya puestas» y «✅ Hoy lo has superado 15 a 6 · 🔥 2 días seguidos · el siguiente, en 15 h
  10 min»), y la tarjeta quedaba lejos de los botones de arriba. Petición de JoseLuis: en tres
  segundos tiene que verse qué reto toca, si ya lo has jugado, tu racha y cuándo sale el siguiente.
- **Orden:** título y fecha, tablero, una línea discreta, pequeña y en gris, con la
  configuración sacada del reto de hoy («🎮 6×6 · 🤖 Difícil · 🔤 4 letras iniciales»; JoseLuis la
  quiso sin chips ni círculos), el resultado o la invitación, quién juega y el botón.
- **Ya jugado:** una caja pequeña con el resultado grande («15–6»), «🏆 Reto superado» (o «💪 Reto
  jugado», «🤝 Reto empatado») y «🔥 2 días seguidos». Debajo, aparte, «⏳ Próximo reto en 15 h 10
  min», con la misma cuenta atrás de antes, que se actualiza cada minuto. El botón dice «Repetir el
  reto» y debajo «Puedes practicar sin perder tu racha», porque solo cuenta la primera partida del día.
- **Sin jugar:** «¿Le ganas hoy a la máquina? Solo cuenta el primer intento.» o, si vienes de una
  racha, «🔥 Llevas 3 días seguidos. ¡Juega hoy para no perder la racha!». Ni resultado ni cuenta atrás.
- **Cambio de día:** si la landing se queda abierta, a las 2:00 de Madrid se recarga con el reto
  nuevo (antes seguía enseñando el anterior). Si hay una partida en marcha no se toca.
- **Quién juega:** «🧟 Juegas como **Papá**» con el nombre resaltado y un botón «Cambiar» en la
  misma línea, con su tamaño para el dedo. Hace lo mismo que antes.
- **Más arriba:** en el móvil la tarjeta empieza justo bajo los botones redondos. En un móvil de
  390 × 844, el botón acaba a 599 px con el reto jugado (antes, 677) y a 544 px sin jugar (antes,
  646); en uno de 360 × 640 se ve sin bajar. El tablero no se ha encogido.
- **Aire entre bloques:** a petición de JoseLuis, más espacio entre el panel y su contenido, el
  tablero, la configuración, la invitación o el cuadro del resultado, quién juega y el botón.
- **Decoraciones del tema:** siguen igual, pero detrás de la tarjeta se ven desenfocadas, para que
  nunca tapen el texto.
- **Sin cambios** en la pantalla final, las reglas, cómo se genera el reto, cómo se cuenta la racha
  ni los avisos. Es una corrección según las reglas de numeración: ajustes de diseño y de textos.

## [4.6.0] - 2026-10-25

**🔥 La pantalla final del reto: la racha a la vista y la revancha más arriba** ([fccc543](https://github.com/chopenhauer/devin-juega-oso/commit/fccc543a6031fd52aac8f8b4d90d2f2d06e9682e))

- **Racha del reto:** al acabar el reto sale una tarjeta pequeña con los días seguidos («🔥 3 días
  seguidos»), los 7 últimos retos con un ✓ naranja en los jugados (hoy, con un anillo), «¡Vuelve mañana
  para mantener tu racha!» y cuándo sale el siguiente («Reto n.º 302 en 16 h 0 min»). Sale de lo que ya
  se guardaba en `oso.daily.v1`: no cambia cómo se cuenta la racha ni cómo se genera el reto. La línea
  «🗓️ ¡Reto del día n.º … superado!» ya no lleva los días seguidos detrás.
- **Menos repetido:** el marcador de la sesión sale desde la segunda partida en todos los modos, también
  contra la máquina (antes salía desde la primera, con el mismo resultado que el marcador grande).
- **Más directo:** en el reto no salen «Otro tablero» ni «Cambiar jugadores»; queda «Revancha» y,
  debajo, «Ver la partida», «Compartir» y «📊 Ver detalles». Algo menos de hueco encima del título.
  En un móvil de 360 × 640 se ven el resultado, la racha y «Revancha» sin bajar.
- **Un comentario cada vez:** si sale una frase de la partida, el marcador de la sesión ya no añade la
  suya («Máquina puede empatar en la próxima»). Frases más cortas: «😱 ¡Por los pelos!» y «🚀 ¡Menuda
  paliza de Julia!», que ahora sale también cuando se gana por el doble o más (antes, solo si el rival
  se quedaba a 0).
- **«Ver detalles»** se queda plegado aunque el desempate lo decidan las rachas (el subtítulo ya lo
  dice). Con 4 jugadores sigue abierto, porque es su marcador.
- **Avisos:** al aceptar el 🔔 solo queda una línea corta de confirmación, sin el título.
- Decisión: la racha va en su tarjeta y no como frase (si no, saldría dos veces); la frase de la partida
  sigue siendo de la partida. Petición de JoseLuis, 25-10-2026.

## [4.5.2] - 2026-10-24

**🕑 El reto cambia a las 2:00 y el aviso sale a las 7:00** ([6b2e517](https://github.com/chopenhauer/devin-juega-oso/commit/6b2e51771c4a0eaa691685b06cad0f6fa04aafb0))

- El reto de cada día empieza a las 2:00 de Madrid en vez de a las 7:00 (`daily.startHour`), y la
  cuenta atrás, el número y los días seguidos cambian a esa hora (JoseLuis, 24-10-2026).
- El aviso del reto sale a las 7:00 de Madrid en vez de a las 18:00 (`push.hour`). La tarea de Vercel
  pasa a las 5 y 6 UTC (verano e invierno) y en el plan gratuito puede llegar hasta las 8:00.
- Roadmap repriorizado con los datos del 24-10-2026 e idea nueva 32: que cada persona elija la hora de
  su aviso.

## [4.5.1] - 2026-10-24

**🗓️ El reto, en un toque** ([f1d98df](https://github.com/chopenhauer/devin-juega-oso/commit/f1d98df1362451ba889dcf6de92128314f8c5bf9))

- En `/reto`, «Jugar el reto →» empieza la partida directamente: ya no pasa por «¿Quién juega?» ni
  deja elegir nivel o tablero. Encima pone «Juegas como Julia · cambiar» con el nombre guardado; si no
  hay ninguno, se escribe ahí mismo (opcional).
- En la portada, la línea del reto es más corta («🗓️ Reto del día n.º 297 →») y en «¿Cómo queréis
  jugar?» va debajo de los modos. El texto de la landing del reto también es más corto.

## [4.5.0] - 2026-10-24

**🔔 Avisos del reto del día, sin email ni cuenta** ([3f56999](https://github.com/chopenhauer/devin-juega-oso/commit/3f569996094c3667db65dbfe9169850adc79df8c), [6764a3d](https://github.com/chopenhauer/devin-juega-oso/commit/6764a3daf9e822c8c72c69044b6d2a1fe07357d9), [f92a65d](https://github.com/chopenhauer/devin-juega-oso/commit/f92a65d20e8f2beed7b3e631e699355e1536b00a))

- Al acabar el primer reto del día, OSO pregunta una sola vez «🔔 ¿Te aviso cuando haya reto nuevo?».
  Nunca al entrar. Si se acepta, el navegador da una dirección anónima (Web Push) y el servidor la
  guarda en Upstash hasta que se quita o deja de funcionar.
- Como mucho un aviso al día, a las 18:00 de Madrid (`push.hour`), y solo a quien aún no ha jugado el
  reto de ese día. Al tocarlo se abre `/reto`. Se quita o se vuelve a poner desde el menú («🔔 Avisos
  del reto»).
- Sin dependencias: cifrado y firma VAPID con `node:crypto` (`api/_webpush.js`). Una tarea diaria de
  Vercel (`/api/push-cron`, a las 16 y 17 UTC por el horario de verano e invierno) manda los avisos y
  borra las direcciones que ya no valen.
- **El reto cambia a las 7:00 de Madrid** en vez de a medianoche (`daily.startHour`). Hasta esa hora
  sigue el del día anterior, con su número, su tablero y la cuenta atrás.
- **Límite:** en Android funciona en Chrome sin instalar; en iPhone y iPad solo con OSO en la pantalla
  de inicio. En el plan gratuito de Vercel el aviso puede llegar hasta 59 minutos tarde.
- **Medición:** evento `push_optin` en GA4 (`action`: shown, granted, denied, default, no, off, error;
  `place`: end o menu) y contadores sin cookies `push_on`, `push_off`, `push_sent`, `push_gone`,
  `push_fail` y `push_click`. Las visitas desde un aviso llegan con `utm_source=push`.

## [4.4.0] - 2026-10-24

**🗓️ Reto del día, con su propia dirección: [juegaoso.com/reto](https://juegaoso.com/reto) ([9751937](https://github.com/chopenhauer/devin-juega-oso/commit/975193746057a3c3dc95a2ab42cfd668f768382d), [d9e8d32](https://github.com/chopenhauer/devin-juega-oso/commit/d9e8d32eb5bd4c2b9ee8c6f865f14f9a6db72113), [e6dab9c](https://github.com/chopenhauer/devin-juega-oso/commit/e6dab9c17bd1b669f51d2212343dfe63d5145e9c))**

- El mismo reto para todo el mundo cada día, como Wordle: contra la máquina, con el tablero y el
  nivel del día (5×5 entre semana, 6×6 el fin de semana) y 4 letras ya puestas (`daily.letters`).
  Todo sale de la fecha en Madrid (`public/js/daily.js`), así que funciona sin conexión; la suerte de
  la máquina también es fija, y las mismas jugadas tienen la misma respuesta.
- `/reto` es la landing propia del reto de hoy: número, fecha, el tablero con sus letras y «Jugar el
  reto →», con su tarjeta para WhatsApp (`public/reto.html`); arriba, junto al 🌐, un 🏠 vuelve a OSO.
  La landing de siempre lleva a ella con el botón 🗓️ junto al 🌐 y una línea discreta bajo «Saltar e
  ir a jugar» y en «¿Cómo queréis jugar?». Las dos dicen después cómo quedó y cuánto falta para el
  siguiente.
- En móviles con sitio (680 px de alto o más), la tarjeta empieza debajo de los botones redondos de
  arriba, en vez de quedar por debajo de ellos.
- El número del reto es el día del año (el 24 de octubre, n.º 297), siempre con la fecha.
- Solo cuenta la primera partida del día. Al acabar, «Compartir» manda el resultado con el enlace a
  `/reto`, y la imagen lleva el número del reto.
- **Decisiones (JoseLuis, 24-10-2026):** que el reto tenga una dirección y una landing propias, que la
  landing de siempre solo lleve a él de forma discreta, y numerarlo por el día del año.
- **Medición:** eventos `daily_start` y `daily_end` en GA4, y la entrada `daily` en los contadores
  del servidor.

## [4.3.0] - 2026-10-19

**⏱️ Cada OSO da la mitad de tiempo: 5 segundos en vez de 10 ([a92feaa](https://github.com/chopenhauer/devin-juega-oso/commit/a92feaa5e6844304709c0083e9b4615b2baa0de7))**

- Quien forma un OSO sigue jugando, pero ahora gana +5 s en vez de +10 s (`clock.bonusSeconds`). Vale
  para todos los modos, también en línea, porque el servidor usa la misma configuración.
- **Decisión (JoseLuis, 19-10-2026):** solo el 11 % de las partidas acaba por tiempo. Con menos
  tiempo extra, el final por tiempo debería pesar más. Las reglas y la ayuda ya dicen +5 segundos.

**🛟 Al volver a OSO, la pantalla de transición ya no parece de SOS ([0635c10](https://github.com/chopenhauer/devin-juega-oso/commit/0635c10ec529051f1ab9a67210a03d8c5e919e1b))**

- Si un 🛟 comprado devuelve la partida a OSO, la pantalla enseña las fichas «O S O» de la portada,
  con el icono del tema, y «¡Ahora es OSO!», sobre el fondo del tema de la partida (clásico,
  Halloween…) en vez del mar con «O🛟O». La ida a SOS no cambia. También en línea (idea 31).

**Roadmap:** nuevo orden del «Ahora» con los datos del 19-10-2026: «Jugar ya», reto del día, decidir
el reloj y Fácil más fácil.

## [4.2.0] - 2026-10-19

**🏆 Una pantalla final que cuenta la partida: has ganado → así ha ido → ¿revancha? ([ebaf76a](https://github.com/chopenhauer/devin-juega-oso/commit/ebaf76a02b31a2c8174da2ca9ffdc9d2e23111a8))**

- **Por qué:** a JoseLuis le pasaron un feedback de la pantalla de victoria. La celebración, las dos
  tablas y cinco botones tenían la misma importancia, el tablero se veía por detrás y el resultado
  salía pequeño y en orden de jugador («0 – 5» aunque ganara Julia). Usamos el espíritu de la
  propuesta, no su diseño.
- **El resultado manda:** el marcador sale grande, con el avatar y el nombre de cada jugador junto a
  sus puntos, y el ganador en color. El fantasma (o el avatar que gane) es más pequeño, rebota un
  momento y se queda quieto; con «reducir movimiento» no se mueve.
- **Frases que tienen memoria** (las del feedback, adaptadas): «🚀 ¡Julia arrasa!», «😱 ¡Victoria por
  los pelos!», «🎉 ¡Primera victoria de…!», «🔥 ¡… está imparable: 3 seguidas!», «🏆 ¡… recupera el
  liderato!» y «🏆 ¡… remonta y se pone en cabeza!». Contra la máquina, si gana ella, anima: «💪 ¡Casi!
  La revancha puede ser tuya».
- **Una sola tabla:** el marcador de la sesión, con una frase que dice qué se juega en la siguiente
  («🔥 ¡Papá puede empatar en la próxima!», «⚔️ ¡Todo empatado!»). Las rachas de la 4.0.0 quedan
  plegadas en «📊 Ver detalles», que se abre solo cuando el desempate decide la partida o con 4
  jugadores, donde es la clasificación.
- **Revancha, el botón grande:** «Otro tablero» y «Cambiar jugadores» siguen debajo; «Ver la partida»
  y «Compartir» son ahora enlaces discretos. En GA4, de 89 partidas terminadas en 28 días solo hubo 4
  replays y 1 compartir desde aquí.
- **Más contraste:** fondo sólido y tarjetas más opacas.
- **Cabe en una sola pantalla:** en móviles pequeños o con letra grande, la pantalla final se encoge
  sola (letra y elementos) para que todo se vea sin desplazarse ni cortarse por los lados.
- **«🎁 ¡Tienes un premio!»** tiene la letra más pequeña y «Ábrelo» ya no se sale del aviso con letra
  grande. En el móvil, en la pantalla final, va a la izquierda para no tapar «Inicio».
- **La imagen que se comparte** lleva el marcador con los avatares (sin nombres).
- **Analítica:** evento nuevo `end_action` con el botón pulsado (`rematch`, `other_board`,
  `change_players`, `leave`, `replay`, `share`, `home`, `details`) y la frase que se vio
  (`end_phrase`), para saber si el cambio hace que se pida más revancha. Solo con cookies aceptadas.

## [4.1.0] - 2026-10-19

**⏸️ Pausar la partida desde el menú ([4f6f130](https://github.com/chopenhauer/devin-juega-oso/commit/4f6f1309bd6c9fcc8edafa7cb2079dc8f2363cb4))**

- **Por qué:** JoseLuis y Julia querían poder dejar la partida a medias sin perderla, por ejemplo en
  el transporte, cuando toca hacer otra cosa y no se puede seguir jugando.
- **Cómo funciona:** en el menú de la partida hay una opción nueva, «⏸️ Pausar partida». Al pulsarla,
  el reloj se para (también el de la máquina) y una pantalla opaca tapa el tablero, para que no se vea
  ni se pueda jugar. Dice «La partida está en pausa» y tiene el botón «▶️ Retomar partida», que la
  continúa justo donde estaba.
- **En línea no está:** el reloj del rival lo lleva el servidor, así que una pausa de uno solo no
  sería justa. Allí sigue el aviso «¿Sigues ahí?».
- **Analítica:** evento nuevo `game_pause`, con los parámetros de partida y `action` (`pause` al
  pausar, `resume` al retomar). Al retomar lleva también `paused_s`, los segundos que estuvo en pausa,
  registrado en GA4 como métrica. Solo se manda con las cookies aceptadas.

## [4.0.0] - 2026-10-18

**🔥 Los empates a puntos se desempatan con las rachas ([5fda7df](https://github.com/chopenhauer/devin-juega-oso/commit/5fda7df49d37ceaf6b4cb7d67d241c5c5217cb86))**

- **Por qué:** JoseLuis y Julia querían que un empate a puntos no se quedara siempre en 🤝, y
  empezar a medir las rachas de OSO.
- **Qué es una racha:** como hacer OSO te deja volver a jugar, una racha son las jugadas seguidas de
  un mismo turno que hacen OSO. Una jugada que hace 2 OSO a la vez es una sola jugada de la racha. Un
  🔄 nunca cuenta y la corta. Con 🛟 se recalculan con el historial, igual que los puntos.
- **Orden del desempate:** 1) puntos (cada OSO sigue valiendo 1), 2) racha más larga (más jugadas
  seguidas haciendo OSO), 3) número de rachas (turnos con al menos un OSO). Si todo coincide, es
  empate. Con 4 jugadores se desempata entre los que empatan en cabeza.
- **Decisión:** se quitó «más OSO en una sola racha». Se parecía demasiado a la racha más larga.
- **Lo que no cambia:** quedarse sin tiempo o abandonar decide la partida como antes, y la máquina
  juega igual. Para superar un reto sigue haciendo falta la diferencia de puntos que pide. Una
  victoria por desempate cuenta como victoria en el marcador de la sesión.
- **Pantalla final:** la tabla «Esta partida» muestra «Total puntos», «Racha larga» y «Num rachas»
  de cada jugador, en todas las partidas. Quien gana va primero y las cifras van centradas
  (ajustes de JoseLuis sobre la preview). Si se desempata, el resultado lo dice («Desempate: racha más
  larga» o «Desempate: más rachas»), y un empate completo dice «Mismas rachas». Al compartir, el
  mensaje cuenta que se ganó por rachas.
- **Reglas y ayuda:** explican el desempate.
- **En línea:** el servidor desempata con las mismas reglas, porque está en `match.js`
  (`streaks()` y `standing()`), y guarda `tiebreak` en la partida.
- **GA4:** `game_end` lleva `tiebreak` (`none`, `streak`, `streaks` o `draw`).
- Es la 4.0.0 porque cambia una regla. La idea de los equipos con 4 jugadores pasa a «versión mayor»,
  sin número.

## [3.21.1] - 2026-10-18

**❤️ La historia cuenta cómo llegó OSO a casa ([9570f15](https://github.com/chopenhauer/devin-juega-oso/commit/9570f159173809d78a26202b36cb9e2f5250388a))**

- **Por qué:** Julia y JoseLuis contaron el origen del juego y pidieron que la historia lo recogiera.
- **El origen:** OSO es un juego tradicional de papel y boli (enlazado a su página de Wikipedia). Se
  lo enseñó María José, la madre de Martina, una amiga de Julia, esperando a que acabara la natación
  en el Club Esportiu Mediterrani. Como no siempre tenían papel y boli, Julia y su padre lo
  convirtieron en esta app.
- **«Sigue creciendo…»** se acorta para que la ventana no crezca demasiado.
- El evento `story` suma `action: wikipedia`.

## [3.21.0] - 2026-10-18

**📲 La historia de OSO invita a instalarlo y jugar sin conexión ([f1dedea](https://github.com/chopenhauer/devin-juega-oso/commit/f1dedeabb32daa014c39a0108d8f8e71d87c2da9))**

- **Por qué:** JoseLuis pidió que la ventana del ❤️ cuente que OSO se puede instalar como app y
  jugar sin conexión, con el enlace ahí mismo.
- **Cómo funciona:** la frase «Si quieres, puedes instalarlo como una app y jugar sin conexión» y un
  botón secundario «📲 Instala como una app», entre «Ver el código» y «Cerrar». Usa la
  misma instalación que «📲 Instalar» del final de partida: el aviso del navegador o, en iPhone y
  iPad, los pasos. Sale aunque se dijera «No, gracias» al final de una partida, porque aquí lo pide la
  persona. No sale si ya está instalado o si el navegador no permite instalarlo.
- **«🐙 Ver el código»:** el botón del repositorio ya no dice «en GitHub», para que sea más corto.
- El evento `story` suma `action: install`.

## [3.20.1] - 2026-10-18

**Los secretos se descubren con 1,5 segundos de pulsación ([741d3c2](https://github.com/chopenhauer/devin-juega-oso/commit/741d3c211c3135213ede0123e95b9e8f3772c720))**

- **Por qué:** JoseLuis pidió bajar el tiempo de mantener pulsado a 1,5 s.
- **Un solo parámetro:** `secrets.holdMs` (1500) vale para el 🎨 y para la tienda. Sustituye a
  `themes.eggHoldMs` (3 s) y `shop.holdMs` (2 s).
- **El círculo** sigue saliendo a partir del primer segundo (`secrets.holdRingMs`), así que ahora se
  llena en medio segundo.

## [3.20.0] - 2026-10-18

**Los secretos se descubren manteniendo pulsado, no con toques seguidos ([ea11f76](https://github.com/chopenhauer/devin-juega-oso/commit/ea11f767f9269a1e7e477f4d843fa8e6e1dcb81e))**

- **Por qué:** JoseLuis pidió que los easter eggs salgan al mantener pulsado unos 3 segundos en vez
  de pulsar muchas veces seguidas.
- **🎨 temas:** mantener pulsado el 🎨 3 s (`themes.eggHoldMs`) descubre todos los temas. Un toque
  normal sigue abriendo el menú.
- **🛒 tienda:** mantener pulsado 2 s (`shop.holdMs`) un 💡, 🔄 o 🛟 gastado abre la tienda. Es más
  corto que el del 🎨 porque el reloj sigue corriendo mientras pulsas (decisión de JoseLuis).
- **Se quitan los toques seguidos** para que haya una sola forma de activar cada secreto.
- **Círculo de progreso:** a partir del primer segundo (`secrets.holdRingMs`) se llena un círculo
  alrededor del botón, y el extra gastado se ilumina. Antes no sale, para que un toque normal no
  enseñe el secreto (decisión de JoseLuis). Con «reducir movimiento» sale entero, sin animar.
- **Móvil y teclado:** se bloquean el menú y la selección de texto que iPhone y Android sacan al
  mantener pulsado. Si mueves el dedo, se cancela. Con teclado vale mantener Espacio o Intro.
- **Textos de los secretos:** «mantén pulsado el 🎨 durante 3 segundos» y «mantén pulsado durante 2
  segundos un extra que ya hayas gastado». Se ajustan solos a `config.js`.

## [3.19.0] - 2026-10-18

**❤️ La historia de OSO, en el corazón del pie, y un título más neutro ([0e9f22b](https://github.com/chopenhauer/devin-juega-oso/commit/0e9f22b290a62f334cc4e9ffc26bdbe7a19276ec))**

- En la bienvenida y en las pantallas de antes de jugar, el ❤️ de «made by Vilarequi with ❤️» abre
  una ventana con la historia del juego y un botón «🐙 Ver el código en GitHub» que lleva al
  repositorio público; «todas sus versiones» enlaza a este CHANGELOG. Durante la partida el pie no se
  ve, como hasta ahora.
- **Título más neutro:** «OSO · el juego de Julia» pasa a «OSO · El juego de la O y la S» en la
  pestaña, en el enlace que se comparte, en el nombre de la app instalada y en el título para
  lectores de pantalla. Julia sigue en la historia y en la privacidad, que cuentan quién lo hizo.
- Evento nuevo `story` (`action`: `open`, `repo`, `changelog`) para saber si la historia interesa y
  cuántos van a ver el código. Solo con las cookies aceptadas.

## [3.18.0] - 2026-10-18

**🧪 Laboratorio de Julia: cambia la máquina y el reloj, simula y guárdalo para todos ([640d648](https://github.com/chopenhauer/devin-juega-oso/commit/640d648c72a2796839c3ff665c8f5f8450033e35))**

- **Por qué:** idea 25 del roadmap. JoseLuis quiere que Julia ajuste parámetros con datos y apunte
  en un cuaderno cada cambio (hipótesis, experimento y datos).
- **Qué hay:** una página oculta en `/lab` (sin enlaces, `noindex`) protegida con contraseña
  (`LAB_PASSWORD` en Vercel, cookie de 30 días, intentos limitados). Deja cambiar cuánto aprovecha la
  máquina los OSO en Fácil y en Difícil, entre cuántas jugadas elige y el reloj de cada tablero, con un
  simulador que juega partidas contra jugadores de práctica y lo dibuja en una gráfica.
- **Al momento, para todo el mundo** (decisión de JoseLuis): lo guardado se aplica en el juego, en la
  máquina y en el árbitro en línea (`public/js/tuning.js`, `/api/config`). Con límites por parámetro,
  «Volver al valor anterior», «Valores de fábrica» y, si el servidor falla, los valores de `config.js`.
- **Cuaderno:** cada cambio con su fecha, qué cambió y la nota de Julia.
- **Medición:** todos los eventos de GA4 llevan `lab_version` (0 = valores de fábrica).
- **Partidas de verdad:** una tabla por versión del laboratorio con quién gana en cada dificultad y
  cuántas partidas acaban por tiempo, sacada de GA4 (últimos 90 días) por `/api/lab-data`, que pide
  la misma contraseña. La clave de la cuenta de servicio está cifrada en Vercel
  (`GA4_SERVICE_ACCOUNT_JSON`, solo lectura de informes).

## [3.17.0] - 2026-10-17

**Medimos la bienvenida: en qué pantalla se va quien no llega a jugar ([0393735](https://github.com/chopenhauer/devin-juega-oso/commit/039373527d7c8ab6733e4499ae083c16344052ab))**

- **Por qué:** en GA4, solo 30 de los 52 usuarios de los últimos 28 días empezaron una partida, y
  no sabíamos en qué pantalla se iban los demás. Es la idea 30 del roadmap
  ([`llegar-a-jugar.md`](docs/ideas/llegar-a-jugar.md)); JoseLuis eligió medir antes de cambiar nada.
- **Qué se mide:** cada pantalla del inicio que se ve antes de la primera partida, una vez por
  visita: la bienvenida, cada tarjeta de las reglas (`rules_1`…`rules_4`), el modo, dónde está tu
  rival, los jugadores, la vista, el tablero y «Empezar» (`start`). También cómo llegó la visita:
  primera vez, vuelve (empieza en el modo) o enlace de reto. Sin nombres ni nada que se escriba.
- **Dos sitios, como decidió JoseLuis:**
  - **Nuestro servidor**, sin cookies, cuenta las pantallas de todas las visitas (también de quien
    rechaza las cookies), en el mismo contador mensual que las visitas (`setup_{entrada}_{pantalla}`).
    `npm run online:report` enseña el embudo.
  - **GA4**, solo con las cookies aceptadas, recibe el evento `setup_step` (`step`, `entry`, `mode`)
    para cruzarlo con el resto. Como el aviso de cookies sale encima de la bienvenida, las pantallas
    vistas antes de contestar se guardan en memoria y se mandan solo si luego se acepta; si se rechaza,
    se tiran.
- **La 19 espera:** JoseLuis prefiere esperar unos días más de datos antes de hacer el Fácil más fácil.
- La política de privacidad lo cuenta en «Visitas, sin cookies» y en la lista de Google Analytics.

## [3.16.0] - 2026-10-17

**Sin conexión, «🤖 Contra la máquina» ([4a5d668](https://github.com/chopenhauer/devin-juega-oso/commit/4a5d668a1280b2939f87eec4691ee510491baf57))**

- **Por qué:** JoseLuis probó el juego en modo avión. Al abrir una sala salía «No se puede jugar en
  línea» con un único «Vale», y te quedabas sin saber qué hacer. Pidió que, si no hay conexión, el
  aviso invite a jugar contra la máquina.
- **Cómo:** debajo de «Vale» sale «🤖 Contra la máquina» (más corto que «Jugar contra la máquina»,
  que en el móvil ocupaba dos líneas). Te lleva a «¿Quién juega?» con la
  máquina ya elegida, y desde ahí empiezas la partida, que funciona sin conexión.
- **Cuándo no sale:** con los demás avisos del juego en línea (sala caducada, llena o con un código
  que no existe), porque en esos casos sí hay conexión y se puede probar otra sala.

## [3.15.4] - 2026-10-17

**Si ni «📣 Compartir» cabe, los dos botones ponen el emoji arriba y el texto abajo ([effc740](https://github.com/chopenhauer/devin-juega-oso/commit/effc740b7daa1a1e0adad493c21eb54c823d0dd0))**

- **Por qué:** con la letra del sistema grande (130 % en un Android de 360 px), «📣 Compartir» se
  partía con el 📣 solo en la primera línea. JoseLuis pidió que, en ese caso, los dos botones vayan
  en dos líneas, con el emoji arriba y el texto abajo.
- **Cómo:** el juego prueba el texto largo, luego el corto y, si el corto tampoco cabe en una línea,
  pone los dos botones («📣 Compartir» y «▶️ Replay») con el emoji encima. Van los dos a la vez
  para que se vean iguales y tengan la misma altura. Con la letra normal no cambia nada.
- **Accesibilidad:** el lector de pantalla sigue diciendo «Compartir resultado» y «Ver la partida
  (replay)».

## [3.15.3] - 2026-10-17

**«📣 Compartir» y «▶️ Replay» cuando el texto largo no cabe en una línea ([a016779](https://github.com/chopenhauer/devin-juega-oso/commit/a016779b9175565843d4ec7f3650c979bd1cddb0))**

- **Por qué:** en un móvil de unos 412 px, «📣 Compartir resultado» se partía en dos líneas
  («📣 Compartir» / «resultado») y quedaba más alto que «▶️ Ver la partida», que va a su lado.
  JoseLuis pidió que dijera solo «Compartir» en ese caso, y lo mismo con «Ver la partida», que pasa a
  «Replay».
- **Cómo:** el juego mide cada botón con el texto largo y, si ocupa más de una línea, pone el corto
  (`shareResult.short` y `replayOpen.short` en `es.json`). No depende de un ancho fijo de pantalla,
  sino de lo que mide el botón, así que también funciona con la letra del sistema más grande. Se
  vuelve a medir al girar el móvil o cambiar el tamaño de la ventana. Cuando «Compartir» ocupa toda
  la fila (en línea, sin «Ver la partida»), sigue diciendo «Compartir resultado».
- **Accesibilidad:** el lector de pantalla siempre dice «Compartir resultado» y «Ver la partida
  (replay)» (`aria-label`). Los dos contienen el texto visible, también el corto, para quien maneja
  el móvil con la voz.

## [3.15.2] - 2026-10-17

**Sin conexión también en móviles lentos ([188d6b7](https://github.com/chopenhauer/devin-juega-oso/commit/188d6b7c17dfbd348dd06f588250860cbaa2ba74))**

- **El fallo:** el mismo de la 3.15.1, pero con el service worker. `install.js` lo registraba al
  terminar de cargar la página (`load`), y si los textos tardaban, `install.js` arrancaba después de
  `load` y no lo registraba nunca: esa visita no dejaba el juego guardado para jugar sin conexión.
  Lo destapó el E2E sin conexión en el CI nuevo, que ahora guarda las trazas de los fallos.
- **El arreglo:** el registro pasa a `install-early.js`, que se carga antes que los módulos. Un E2E
  nuevo retrasa los textos y comprueba que el service worker se registra igual.
- **CI más rápido:** los E2E se reparten en 4 máquinas a la vez, se saltan si la rama solo cambia
  documentos y el push a `main` ya no repite el CI. Pasa de unos 12 minutos a unos 4.

## [3.15.1] - 2026-10-17

**«📲 Instalar» ya no se pierde si el navegador avisa pronto (o tarde) ([7d0dd20](https://github.com/chopenhauer/devin-juega-oso/commit/7d0dd20f20fb9346092f26cb380e7cf124b8bdfe))**

- **El fallo:** `i18n.js` espera a cargar los textos antes de arrancar el resto de módulos. Si
  Chrome avisaba de que OSO se puede instalar (`beforeinstallprompt`) en ese rato, `install.js`
  aún no escuchaba y la oferta no salía nunca en esa visita. Lo destapó un E2E que falló en el CI
  justo después de publicar la 3.15.0.
- **El arreglo:** un script pequeño, `install-early.js`, recoge ese aviso antes que los módulos.
  Y si el aviso llega con la pantalla final ya abierta, la oferta aparece en ese momento.
- **Nada más cambia:** sigue saliendo solo al acabar una partida, con «No, gracias».

## [3.15.0] - 2026-10-17

**«📲 Instalar»: OSO en la pantalla de inicio, también sin conexión ([c7e1b57](https://github.com/chopenhauer/devin-juega-oso/commit/c7e1b57af67de663373ba2185c147e9c070cecff))**

- **Por qué:** es la tercera de las ideas que eligió JoseLuis. Sigue siendo web, sin tiendas de
  apps: con un manifest y un service worker se abre desde un icono, como una app, y funciona sin
  conexión.
- **Nada intrusivo (decisión de JoseLuis):** solo se ofrece en la pantalla final, después de jugar,
  nunca en la bienvenida ni a mitad de partida y sin ventanas emergentes. No sale si ya está
  instalado, si el navegador no lo permite o si en esa pantalla ya se pregunta 👍/👎 o se cuenta
  un secreto. «No, gracias» lo esconde para siempre en ese dispositivo (`oso.install.v1`).
- **Cómo se instala:** en Android, Chrome y Edge, «Instalar» abre el aviso del navegador. En iPhone y
  iPad no existe ese aviso, así que explica los pasos: Compartir ⬆️ → «Añadir a pantalla de inicio».
- **Sin conexión:** `public/sw.js` pide siempre primero la red, así que con conexión se juega la
  última versión, y guarda lo que descarga para cuando no la hay. Sin conexión funcionan contra la
  máquina, Juntos y 4 jugadores; en línea avisa de que hace falta conexión. La API de salas y la
  analítica nunca pasan por la caché.
- **Icono:** el 🐻 sobre el fondo morado del juego, generado con `npm run icons`. Julia no lo
  dibuja ahora; queda en el ROADMAP por si quiere hacer uno más adelante.
- **GA4:** eventos nuevos `install_offer`, `install_prompt` y `app_installed`, y `display_mode` en
  todos los eventos para saber cuántas partidas se juegan con OSO instalado.
- **Privacidad:** la política explica la copia del juego para jugar sin conexión y la nueva clave.

## [3.14.0] - 2026-10-17

**«Ver la partida»: la última partida, jugada a jugada ([ea4a998](https://github.com/chopenhauer/devin-juega-oso/commit/ea4a99830d0a89572b9240de7ba67b2d4b13b79e))**

- **Por qué:** es la segunda de las ideas que eligió JoseLuis. Repasar la partida sirve para aprender
  estrategia: ver dónde se hizo cada OSO y dónde se dejó uno a tiro, sobre todo contra el Extremo.
- **En la pantalla final,** el botón «▶️ Ver la partida» abre el tablero vacío y lo va llenando solo.
  Con ⏮ ◀ ⏯ ▶ ⏭ se para, se avanza o se retrocede jugada a jugada. Cada OSO se resalta en la jugada en
  que se hizo, con el marcador de ese momento.
- **Regalos:** la jugada que deja un OSO a tiro del rival sale con un borde rojo discontinuo y
  «⚠️ deja un OSO a tiro del rival». Solo cuentan las jugadas que no puntúan, porque al puntuar se
  sigue jugando.
- **Modos:** contra la máquina, en Juntos, con 4 jugadores y en línea. Si se usó el 🛟 SOS, la
  repetición cuenta con la palabra final, igual que el SOS.
- **Sin guardar nada:** solo se puede ver la última partida, mientras sigue abierta la pantalla final.
- **Medición:** evento `replay_view` al cerrar, con `replay_seen` y `replay_moves`. El ritmo de la
  reproducción está en `config.js` (`replay.stepMs`).

## [3.13.1] - 2026-10-17

**Sabemos cuántas visitas no ve GA4 ([832913b](https://github.com/chopenhauer/devin-juega-oso/commit/832913ba14c71324a42af3d83b961b6e99da4fbe))**

- **Por qué:** JoseLuis quería saber cuántas personas no aceptan las cookies y qué porcentaje de
  visitas queda oculto. GA4 solo ve a quien acepta, y no había ninguna cifra de las demás.
- **Contador propio:** cada vez que se abre el juego, el servidor suma 1 visita con la elección
  guardada (aceptada, rechazada o sin decidir), y otro 1 cada vez que se pulsa Aceptar o Rechazar.
  Sin cookies, sin IP y sin nada que identifique a nadie. Sale al final de `npm run online:report` y
  en el resumen diario.
- **Vercel Web Analytics:** activado en producción. Cuenta páginas vistas sin cookies, para tener
  una segunda cifra con la que comparar.
- **Decisión:** se cuentan cargas de página, no personas, para no tener que guardar nada en el
  dispositivo de quien rechaza. La política de privacidad lo explica en «Visitas, sin cookies».

## [3.13.0] - 2026-10-17

**Enlace de reto contra la máquina ([f46cef3](https://github.com/chopenhauer/devin-juega-oso/commit/f46cef3c6776e350c05202fc7ba8930b83de0312))**

- **Por qué:** es la primera de las ideas que eligió JoseLuis tras la 3.12.0. Compartir es lo que más
  visitas trae, y un reto da un motivo para jugar en cuanto llega el enlace.
- **Al compartir el resultado contra la máquina,** el texto reta: «Te reto en OSO 🐻: 5×5 contra la
  máquina en difícil. Yo gané 9 a 4. ¿Lo superas?», con un enlace `?reto=5-hard-9-4` (y `&tema=` si el
  tema no es el clásico) y la campaña `utm_campaign=reto`.
- **Al abrir el enlace,** el juego va directo a elegir avatar con el modo, el nivel, el tablero y el
  tema del reto, y un aviso dice qué hay que superar. Las preferencias guardadas solo cambian si se
  juega.
- **Superar el reto es ganar por más diferencia** (la máquina tiene azar, así que es más justo que
  contar solo los puntos); si quien reta perdió, basta con ganar. Al acabar sale «🏆 ¡Reto superado!» o
  cuánto faltó, y se puede devolver el reto.
- **Medición:** eventos `challenge_open` y `challenge_end` (`beaten`, `missing`) y el valor
  `challenge` en `theme_source`.
- **Decisión:** de momento solo contra la máquina; en «Juntos» y en línea no cambia nada.

## [3.12.0] - 2026-10-17

**El resultado se comparte con una imagen del marcador ([f773bc2](https://github.com/chopenhauer/devin-juega-oso/commit/f773bc2a4390a2bbace9f65991aa32e31bbef047))**

- **Por qué:** JoseLuis pidió que «Revancha» diga el tamaño del tablero y que, al compartir el
  resultado, vaya una captura con el marcador de la sesión.
- **«Revancha»:** debajo pone «mismo tablero (4×4)», con el tamaño de la partida que acaba de terminar.
- **Imagen del marcador:** al terminar se dibuja una imagen de 1080 px de ancho con los colores del
  tema: quién gana, el resultado, el tablero y el marcador de la sesión (avatares, nombres, victorias y
  puntos), con juegaoso.com debajo. «Compartir resultado» la adjunta al texto en los móviles que
  dejan compartir ficheros; si no, el cuadro de compartir ofrece «🖼️ Descargar imagen».
- **Decisión:** la imagen lleva los nombres, como la pantalla; el texto sigue sin nombres.
- **Analítica:** el evento `share` tiene un canal nuevo, `image`, cuando se descarga la imagen.

## [3.11.0] - 2026-10-16

**Tres niveles contra la máquina: Fácil, Difícil y Extremo ([8b2a344](https://github.com/chopenhauer/devin-juega-oso/commit/8b2a344e8ce061dd31f0d355a435c633cb93fdb7))**

- **Por qué:** quienes juegan decían que en Fácil es más divertido «porque la máquina toma riesgos»
  y que en Difícil «nadie comete errores y se vuelve aburrido». Difícil siempre hacía el OSO que tenía
  a mano y, si no, ponía una O en el centro: jugaba siempre igual, solo con O, y no defendía (B06).
  Dos máquinas en Difícil empataban 0-0 siempre.
- **Fácil:** aprovecha la mitad de los OSO que tiene a mano (antes, 7 de cada 10). Cuando no puntúa,
  elige al azar entre las jugadas más centradas, con O y con S, así que a veces te deja huecos.
- **Difícil:** igual, pero aprovecha 8 de cada 10. Ya no llena el tablero de O ni juega siempre lo
  mismo.
- **Extremo (nuevo):** los aprovecha todos y nunca te deja un OSO a tiro si puede evitarlo. Al final
  de la partida busca trampas: jugadas que te dejan sin ninguna casilla segura, para que tengas que
  regalarle puntos. Si no le queda otra que regalar, regala lo menos posible. Robot nuevo, morado y
  con llamas.
- **Avatares en 3 filas:** contra la máquina, los avatares del jugador 1 van en 3 filas de 4 también
  en iPad y escritorio, a la altura de los 3 botones de nivel. Los emojis, los textos y
  las esquinas crecen con la tarjeta: más pequeños en el móvil, más grandes en iPad y escritorio.
- **Comprobado con miles de partidas simuladas** entre niveles: Difícil gana a Fácil el 86 % de las
  veces en 5×5 y Extremo gana a los otros dos casi siempre. Ninguna jugada tarda más de 20 ms.
- **Parámetros** en [`config.js`](public/js/config.js): `machine.easyAim` (0,5), `machine.hardAim`
  (0,8), `machine.pool` y `machine.extremeLookahead`. El parámetro `difficulty` de GA4 suma el valor
  `extreme`.

## [3.10.0] - 2026-10-16

**Contra la máquina mientras llega tu rival ([65b1bda](https://github.com/chopenhauer/devin-juega-oso/commit/65b1bda163a7ad2e73beab930e4ea1a0fd96b414))**

- **Si nadie entra en tu sala en 1 minuto**, sale «🤖 vs. máquina mientras» (texto corto que
  eligió JoseLuis, para que el botón no ocupe tres líneas en el móvil). Decidimos ofrecerlo porque en octubre 2 de las 7 salas caducaron sin rival. El minuto se ajusta en
  `config.js` (`online.machineOfferSeconds`).
- **La sala sigue abierta** mientras juegas: con el tablero y la dificultad que tenías, y puedes jugar
  varias seguidas.
- **Cuando llega tu rival** suena el aviso y sale «✅ Ha llegado {nombre}» con el botón «Ir con
  {nombre}». Decidimos avisar y dejar que elijas, en vez de cortar la partida o cerrar la sala: al
  pulsarlo se deja la partida contra la máquina y se pasa a elegir el tablero con tu rival, que
  mientras tanto ve «{nombre} está eligiendo el tablero».
- **Salir de la partida** (🏠 Inicio, Otro tablero, Cambiar jugadores o Nueva partida) cierra la sala.
  Si la sala caduca sola (30 min), la partida sigue y se avisa.
- **Analítica:** evento `online_machine` con `action` (`offered`, `accepted`, `rival_arrived`,
  `switched`), para saber si sirve.

## [3.9.0] - 2026-10-13

**Textos en un fichero aparte, listos para traducir ([bdf85a8](https://github.com/chopenhauer/devin-juega-oso/commit/bdf85a83a2ffa02fede9cacfda966d4c3a2516bb))**

- **Todos los textos del juego en [`public/locales/es.json`](public/locales/es.json)**, con una clave
  por texto (`"winnerHome": "🏠 Inicio"`). El HTML marca cada texto con `data-i18n` y el código usa
  `t('clave', { variables })`, con plurales. Decidimos JSON porque es lo que leen las herramientas de
  traducción. De momento solo hay español: no se ve nada distinto.
- **Idioma:** el juego elige el del navegador y, si no lo tiene, usa el español. Para añadir uno basta
  con copiar `es.json`, traducirlo y apuntarlo en `LANGS` (`public/js/i18n.js`).
- **Pruebas que avisan** si queda un texto fuera del fichero, si falta una clave o si sobra alguna.
- **Mensajes para otras personas con signos solo al final**, como se habla: «He ganado a la máquina 7
  a 5 en OSO 🐻!», «Te atreves?», «Jugamos a OSO? 🐻». Vale para compartir, el email y la invitación a
  la sala. Dentro del juego seguimos con ¿¡.
- **Analítica:** los eventos llevan `browser_language` (`es-ES`, `en-US`…) y `app_language`, para saber
  qué idiomas faltan. Está en `docs/ANALYTICS.md` y en la página de privacidad.
- **Se quedan fuera:** la página de privacidad, que se traducirá entera como documento, y las
  explicaciones de `config.js`, que son para nosotros y no para quien juega.
- **Va después de la 3.8.2 (Halloween afinado),** que salió mientras se preparaba esta: la incluye
  entera y el nombre de cada tema, también el de Halloween, sale ahora de `es.json`.
- De paso: los campos de nombre de los jugadores 3 y 4 decían «Nombre del jugador 1» a los lectores de
  pantalla.

## [3.8.2] - 2026-10-13

**Halloween afinado ([5641c6f](https://github.com/chopenhauer/devin-juega-oso/commit/5641c6f0d38d600ff0f314eb509b8f5274c42e08))**

- **Telarañas en vez de sangre:** el goteo rojo de arriba se veía cortado en el móvil (dos gotas
  sueltas, una detrás del 🎨). Ahora hay una telaraña en cada esquina y una 🕷️ que baja colgada de
  su hilo y vuelve a subir. Con «reducir movimiento», la araña se queda quieta.
- **Fichas de calabaza:** las fichas puestas son naranjas con la letra oscura y las casillas vacías,
  más oscuras. El borde de la casilla que se puede cambiar con 🔄 pasa a blanco, porque el naranja
  no se veía sobre la ficha.
- **OSOs que brillan:** las casillas de un OSO conservan el color de quien lo hizo y suman un brillo
  verde «fosforito».
- **Más adornos:** 24 en vez de 16 y algo más visibles (42 % en vez de 28 %), también en iPad y
  escritorio.
- **🩸 → 🕯️:** la gota de sangre deja de ser avatar y adorno; JoseLuis prefirió algo menos
  sangriento para quienes juegan.
- **Accesibilidad extra a reserva:** jugar con el teclado y los OSOs sin depender del color pasan
  a «Reserva» en el ROADMAP, por decisión de JoseLuis («no me parece crítico o relevante»).

## [3.8.1] - 2026-10-13

**Textos más parejos y mensajes para compartir con aire ([9abde31](https://github.com/chopenhauer/devin-juega-oso/commit/9abde31))**

- **«¿Dónde está tu rival?»:** los dos textos miden casi lo mismo y ocupan las mismas líneas: «Os
  turnáis en un móvil, tablet u ordenador: enfrentados o con la misma vista.» y «Cada uno en
  su móvil, tablet u ordenador: tu rival entra con un enlace especial.» («tu rival» en vez de «el
  invitado», para no dar por hecho el género).
- **Mensajes para compartir con aire:** una línea en blanco entre el resultado, la pregunta y el
  enlace, también en el menú nativo del móvil (el enlace va dentro del texto, porque Android lo
  pegaba con un espacio).

## [3.8.0] - 2026-10-13

**Pantalla final: «🏠 Inicio» y «Compartir resultado» aparte ([6a5ce31](https://github.com/chopenhauer/devin-juega-oso/commit/6a5ce31))**

- **Botón «🏠 Inicio»** arriba a la derecha de la pantalla final: vuelve al paso de modo, como «Llévame
  al 🎨». En línea sale de la sala, igual que «Salir».
- **«📣 Compartir resultado» más separado** de Revancha, Otro tablero y Cambiar jugadores, para que se
  vea como otra cosa.

## [3.7.3] - 2026-10-12

**Una sola escala de tamaños de letra ([34ae0b1](https://github.com/chopenhauer/devin-juega-oso/commit/34ae0b116c6ac3bfcf44dc1a1e2369cbb00f589d))**

Quedaban 28 tamaños de letra: 20 en una escala con pasos de 1 px (12, 13, 14, 15…) y 8 sueltos de
componentes (letras del tablero, título de victoria, iconos de los extras…). Ahora hay 12.

- La escala: 12 · 14 · 16 · 18 · 20 · 24 · 28 · 32 · 44 · 56 · 80 · 100 px (`--fs-2xs` … `--fs-hero-xl`).
- Cada tamaño antiguo pasa al más cercano, casi siempre a 1 o 2 px. Lo que más se nota: los textos
  de 15 px (mensajes, nombres, relojes, ayuda) pasan a 16 y los de 17 a 18, que se leen mejor, y la
  etiqueta 🤖 sube de 10 a 12 px.
- Desaparecen los tokens de componente (`--fs-letter-*`, `--fs-title-xl`, `--fs-extra`,
  `--fs-emoji-xl`, `--fs-legal-heading`). Solo queda aparte el 🛟 gigante, que crece con la pantalla.
- Decisión: 12 pasos y no los 7 que estaban apuntados, porque con 7 había saltos de 15 a 20 px o de
  34 a 48 px y el juego cambiaba de aspecto.
- Un test falla si alguien añade un tamaño de letra fuera de la escala.

## [3.7.2] - 2026-10-12

**Medimos qué extras se usan y documentamos toda la analítica ([adede81](https://github.com/chopenhauer/devin-juega-oso/commit/adede817a5ba360329e6e6834c86bf95c53f11fd))**

JoseLuis quería saber qué extra se usa más: 💡 pista, 👁️ última jugada, 🔄 cambio de letra o 🛟 SOS.
Hasta ahora no se medía. El juego no cambia.

- Cada vez que alguien usa un extra se envía `extra_used` con `extra` (`hint`, `last`, `swap` o
  `sos`), el modo y el tablero. Solo cuenta lo que se usa en este dispositivo: ni la máquina ni,
  en línea, el rival (su propio móvil lo cuenta).
- `game_end` lleva cuántas veces se usó cada extra en la partida (`extras_hint`, `extras_last`,
  `extras_swap`, `extras_sos`), también con 0, para ver si los extras cambian quién gana o si se
  acaba más por tiempo. Las cuatro métricas y la dimensión `extra` están registradas en GA4.
- En línea, el servidor ya contaba los extras sin cookies; ahora `npm run online:report` los enseña,
  junto con las compras de la tienda secreta.
- Nuevo [`docs/ANALYTICS.md`](docs/ANALYTICS.md): qué se mide, para qué sirve cada dato, qué no se
  mide nunca y cómo añadir una medición nueva.
- Nuevo [`AGENTS.md`](AGENTS.md): inventario del repo, documentos, comandos, cómo se publica y
  reglas del proyecto, para que cualquier agente futuro arranque rápido.
- Decisión: no preguntamos «¿Qué extra te ha ayudado más?» al acabar; basta con medir el uso.
- Tests: los toques del easter egg del 🎨 se envían como una ráfaga, porque en el CI lento se
  espaciaban demasiado (`themes.eggTapGapMs`) y fallaban a veces.

## [3.7.1] - 2026-10-12

**Todo escala con la pantalla: el juego cabe en móviles estrechos o con «tamaño de pantalla» grande**

JoseLuis mandó capturas del Oppo de un amigo: el pie partido en dos líneas, «1 / jugador», los botones
de la sala fuera de la tarjeta, los emojis fuera de sus círculos y el tablero con scroll. Lo
reproducimos: su Chrome muestra la web como si el móvil midiera unos 270 px de ancho (el «tamaño de
pantalla» o el zoom en grande), y la interfaz estaba hecha en píxeles fijos a partir de 360 px.

- **Una sola unidad que escala:** todos los tamaños de `tokens.css` y `styles.css` pasan de px a rem
  (los bordes y detalles de 1–3 px siguen en px). La raíz mide 16 px a partir de 360 px de ancho y, por
  debajo, encoge con la pantalla (`--font-root`, hasta el 75 %): letra, botones, avatares, paneles y
  tablero encogen juntos. En el móvil en vertical también encoge si hay menos de 615 px de alto
  (`--font-root-phone`), para que la configuración y la partida quepan sin scroll.
- **El tablero sale del alto que queda:** en el móvil, `100dvh - 19,5rem` (antes 300 px fijos, que
  se quedaban cortos con paneles más altos y daban unos píxeles de scroll a 412×640).
- **Las etiquetas de modo no se parten** (`white-space: nowrap`).
- **Decisión:** en móviles de 360 px o más, tablets y escritorio todo se ve igual que antes: 30 de 32
  capturas idénticas píxel a píxel y las otras 2 solo cambian el reloj (32 px).
- **Decisión:** en pantallas de menos de 360 px la letra baja del mínimo de 12 px (9 px a 270 px). En
  esos móviles todo se ve ampliado, así que en la mano miden lo mismo que en un móvil normal.
- **Pruebas:** `tests/e2e/responsive.spec.js` comprueba a 270×490, 320×568 y 360×560 que no hay
  scroll, que el pie y las etiquetas van en una línea, que los emojis caben en sus círculos, que los
  botones de la sala no se salen y que la raíz vuelve a 16 px a 390 px.

## [3.7.0] - 2026-10-12

**Sala con el tema del anfitrión, cada uno abajo, intro «S🛟S» y temas medidos en GA4**

Tres peticiones de JoseLuis tras jugar en línea, más una pregunta: «¿estamos midiendo en GA4 cuáles son los
temas o skins más usados?» (no lo estábamos).

- **El tema viaja con la sala:** al abrir la sala se guarda el tema del anfitrión (`theme`, validado
  contra `THEMES`) y quien abre el enlace lo ve y elige entre sus avatares. Decisión: el tema del
  invitado no se guarda; al salir de la sala vuelve el suyo. Mientras hay sala, el 🎨 no cambia el
  tema (el anfitrión tendría que abrir otra sala), para que los avatares de los dos sigan siendo del
  mismo tema.
- **Cada uno se ve abajo:** en el móvil del invitado, su barra va abajo y la del anfitrión arriba
  (antes lo veía al revés). En escritorio, cada uno tiene su panel a la izquierda. Los colores de cada
  jugador no cambian.
- **Intro SOS a pantalla completa:** al activar el 🛟 sale «S🛟S» (o «O🛟O» al volver) durante
  `sos.flashMs`, que pasa de 0,9 a 2,5 s, sin botón. Las letras entran de golpe, el 🛟 gira, la
  pantalla tiembla y salen ondas; con «reducir movimiento», la misma pantalla quieta. Ahora también
  sale en línea, en los dos móviles: el servidor ya paraba el reloj ese tiempo.
- **GA4:** `game_start`, `game_end`, `game_abandon` y `feedback` llevan `theme` y `theme_source`
  (`chosen`, `festival`, `host` o `default`), para distinguir lo que se elige de lo que pone la fecha.
  Nuevo evento `theme_change` (`theme`, `theme_from`) al elegir en 🎨. Dimensiones registradas en
  GA4; solo hay datos desde la publicación.

## [3.6.1] - 2026-10-12

**El botón de cada secreto te lleva a usarlo, y «Cuéntanos más» con su altura ([dccb524](https://github.com/chopenhauer/devin-juega-oso/commit/dccb5248718d834a6eddd1c739c71d4422a8a1ae))**

Dos ajustes que pidió JoseLuis.

- El botón del mensaje de cada secreto te lleva a donde se usa. «Llévame al 🎨» te devuelve al
  inicio, al paso «¿A qué jugáis?», y hace brillar el 🎨. «¡A jugar!», de la tienda secreta, empieza
  la revancha desde la pantalla final, o desde el inicio te lleva al tablero con «¡A jugar!» brillando.
  Al empezar la partida, brillan también los extras. Con «reducir movimiento» se marca con un borde,
  sin animación. Lo que brilla y cuánto dura (`secrets.spotlightMs`, 3 s) está en `config.js`.
- El easter egg de los temas solo saltaba una vez hasta recargar la página. Ahora «Llévame al 🎨» lo
  vuelve a activar, para que se pueda ver sin recargar ni borrar nada.
- Decisión: en línea el botón sigue siendo «¡Voy a probarlo!» y no te mueve, para no sacarte de la
  sala ni quitarte la revancha con tu rival.
- Cada secreto de `secrets.js` dice ahora su botón (`cta`: texto y destino `home` o `play`). El
  secreto n.º 3 de Julia solo tendrá que elegir uno.
- En el diálogo «¡Gracias!», el botón «Cuéntanos más» salía enorme en Safari: el diálogo era algo más
  alto que su contenido y el espacio sobrante estiraba el enlace. Ahora el contenido de los diálogos
  se queda centrado y el botón tiene la altura de cualquier botón principal (54 px).

## [3.6.0] - 2026-10-11

**Tensión con poco tiempo y relojes 30 s más cortos ([86f5740](https://github.com/chopenhauer/devin-juega-oso/commit/86f57409785dbd582e4138a57b0887b15e26adb3))**

Idea del ROADMAP (T4.3) elegida por JoseLuis, con un ajuste suyo: para que la tensión se vea, menos
tiempo en todos los tableros.

- Con 20 s o menos en el reloj de quien tiene el turno, el fondo se va tiñendo de rojo desde los
  bordes, cada vez más, y late como un corazón (dos latidos por segundo). Se suma al reloj que
  parpadea y al pitido que ya había. Con «reducir movimiento» solo cambia el color, sin latir.
- Relojes: 4×4 1:00, 5×5 1:30, 6×6 2:00, 7×7 2:30 y 8×8 3:30 (30 s menos en todos). También en 4
  jugadores y en línea, porque salen de la misma tabla de `config.js`.

**Decisiones**

- Quitar 30 s ya, sin esperar a las 100 partidas por tablero: solo un 6 % de las partidas acababa
  por tiempo (2 de 31 en 28 días) y el objetivo es el 50 %. Lo revisaremos con `game_end`.
- El umbral de la tensión es el mismo `clock.lowSeconds` (20 s) del aviso del reloj, para que todo
  empiece a la vez.
- El fondo sigue el reloj de quien tiene el turno: si pasa a alguien con más tiempo, se apaga.
- En escritorio se nota menos (el panel tapa casi todo el fondo). Queda como posible mejora teñir
  también el borde del panel.

## [3.5.0] - 2026-10-11

**En línea, más acompañado: la invitación y los avisos del rival ([0946baf](https://github.com/chopenhauer/devin-juega-oso/commit/0946baf70330b44cf32d59ee947777c32c488828))**

Las dos primeras prioridades del ROADMAP revisado tras la 3.4.0. En octubre se abrieron 5 salas en
producción y solo en 2 entró alguien: se perdían antes de entrar.

- **Quién es quién:** en la sala, la tarjeta propia dice «Tú» y la otra «Te invita» (o «Tu rival»
  para quien abre la sala). La del rival solo enseña su avatar y su nombre, sin la rejilla de
  avatares, que parecía que se podía tocar.
- **Cuando llega el rival,** quien abrió la sala oye un aviso, el título de la pestaña pasa a
  «✅ Leo ya está aquí · OSO» (se ve aunque estés en WhatsApp) y pasa solo a elegir el tablero.
- **Avisos del rival** en la línea de mensajes: «💡 Ana ha usado una pista», «👁️ Ana ha mirado tu
  última jugada», «🔄 Ana ha cambiado una letra», «🛟 Ana ha cambiado a SOS» y «🛒 Ana ha comprado una
  💡 pista en la tienda secreta (−10 s)». Si llegan dos cosas a la vez, van en el mismo aviso.
- **Medir el embudo** sin depender de las cookies: el servidor cuenta enlaces enviados (WhatsApp o
  copiar), enlaces abiertos (y si llegan tarde o con la sala llena), invitados dentro y cuánto tardan
  de media. Se ve con `npm run online:report`. En GA, con permiso: `online_invite` (`channel`) y
  `online_invite_open`.

**Decisiones**

- Avisar también de las compras de la tienda secreta: así el rival descubre el secreto por la otra
  persona (boca-oreja).
- Pasar solo al tablero cuando llega el rival, sin pulsar →.
- Los 30 minutos de la sala no cambian hasta saber cuántos enlaces se abren tarde.

## [3.4.0] - 2026-10-11

**Secreto n.º 2: la tienda secreta de extras ([b8b4d97](https://github.com/chopenhauer/devin-juega-oso/commit/b8b4d97ec79e81d60861e3513491cd13a9a2a032))**

Idea de JoseLuis: un segundo easter egg con los extras, que también estrena «Ya sabías…».

- Pulsar 3 veces seguidas un 💡, 🔄 o 🛟 ya gastado abre «🛒 Tienda secreta»: «¿Compras otra 💡 pista
  por 10 segundos de tu reloj?». Al comprar se restan los segundos y el extra vuelve a estar
  disponible, pero no se usa solo: hay que volver a pulsarlo.
- Decidido: 💡 pista y 🔄 cambio de letra cuestan 10 s; 🛟 SOS, 30 s. Se puede comprar tantas veces
  como tiempo quede (siempre tiene que quedar algo después de pagar), en todos los modos, también en
  línea, donde lo valida el servidor.
- Un 🛟 comprado vuelve a cambiar la partida (de SOS a OSO, o al revés) para todo el mundo, igual que
  el primero.
- Es el 2.º secreto de la lista: se cuenta como los demás (cada 2 partidas, uno al día) y mide
  `secret_found` con `secret: tienda`; cada compra manda `extra_bought` con `extra`.
- Precios y número de toques en `config.js` (apartado «Tienda secreta», ver `docs/CONFIG.md`).

**Decisiones**

- En dos tiempos (JoseLuis): comprar solo recarga el extra; se usa cuando quieras con otro toque,
  también el 🔄.
- Los 3 toques solo abren la tienda en un extra ya gastado y en tu turno; 👁️ «Última jugada» no se
  vende.
- Después de pagar tiene que quedarte tiempo: con el precio o menos, la tienda lo explica y no
  enseña «Comprar».
- El reloj sigue corriendo con la tienda abierta: pensar también cuesta tiempo.
- Los extras gastados siguen atenuados, para que la tienda siga siendo un secreto.

## [3.3.1] - 2026-10-11

**Todos los parámetros del juego en un solo fichero ([d451806](https://github.com/chopenhauer/devin-juega-oso/commit/d4518066b05ec443f88727cdcf3a48657caf60a4))**

Idea de JoseLuis: como director del juego, tener a mano todo lo que se puede ajustar.

- Nuevo [`public/js/config.js`](public/js/config.js): tiempos de cada tablero, segundos extra por
  OSO, usos de los extras, máquina, salas en línea (cierre a los 30 min, cuenta atrás, «¿Sigues
  ahí?»), secretos, easter egg del 🎨, encuesta, sonido… Cada valor viene explicado.
- Lo usan a la vez el juego y el servidor de salas, y también los textos que mencionan un valor: las
  reglas (+10 segundos), el selector de tableros (que se genera desde la tabla de tiempos), los avisos
  de sala cerrada y el secreto del 🎨 («seis veces»).
- Decidido: el tiempo de cada tablero pasa de una fórmula a una tabla (mismos valores: 1:30, 2:00,
  2:30, 3:00 y 4:00), que se entiende y se ajusta mejor.
- [`docs/CONFIG.md`](docs/CONFIG.md) es la tabla del director con cada parámetro, su valor y qué hace.
  Se genera con `npm run config` y un test avisa si se queda vieja o si un valor no tiene sentido.
- El juego no cambia: mismos valores que en la 3.3.0.

## [3.3.0] - 2026-10-11

**Secretos: un premio por volver a jugar ([9c975dd](https://github.com/chopenhauer/devin-juega-oso/commit/9c975dd4adf3618b7307f66e1b587b2310b20bc2))**

Idea de JoseLuis: premiar que se vuelva y se juegue más contando, poco a poco, las funciones
escondidas (easter eggs) del juego.

- Cada 2 partidas terminadas sale arriba un aviso «🎁 ¡Tienes un premio!», igual que los de
  las salas en línea, con el botón «Ábrelo» al final. Al abrirlo: «Déjame que te cuente un
  secreto…» y cómo se activa una función escondida, pero no qué pasa, para que lo descubras tú.
- Cuenta jugar, no ganar: cualquier modo (máquina, «Juntos» o en línea) y cualquier resultado.
- Como mucho un secreto al día, de uno en uno y sin repetir. Si toca en plena racha, sale en la
  pantalla final; si toca al volver otro día, en el inicio.
- Con el segundo secreto aparece «Ya sabías…», con una pista corta de los anteriores y «Saber más».
- El primer secreto es el de los temas (las 6 pulsaciones del 🎨). Los nuevos se añaden al final
  de `public/js/secrets.js`; por ahora salen en ese orden.
- Se guarda solo en el navegador (`oso.secretos.v1`), sin cuentas. El contador arranca con las
  partidas que el dispositivo ya había jugado, así que quien ya jugaba recibe su primer secreto
  en el inicio.
- Si el secreto y la pregunta «¿Os está gustando OSO?» coinciden, gana el secreto y la pregunta
  espera a otra partida.
- Medición: eventos `secret_shown` (qué secreto y dónde: `place` start o end) y `secret_found`
  (al activarlo, con `told` para saber si se le había contado). Las dimensiones `secret` y
  `told` quedan registradas en GA4 por la API.

## [3.2.1] - 2026-10-11

**Pantalla final más ordenada: botones en línea y marcador de la sesión ([3500548](https://github.com/chopenhauer/devin-juega-oso/commit/35005485c9ec6178dae4c3fbbdb6693fa949a0e4))**

- En las partidas en línea no está «Otro tablero», y «Salir» se quedaba solo en media fila.
  Ahora ocupa la fila entera, como «Revancha» y «Compartir resultado»: los tres botones tienen el
  mismo ancho y van centrados (petición de JoseLuis). En el modo «Juntos» no cambia nada.
- Marcador de la sesión: la 👑 de quien va en cabeza tiene su propia columna, la primera y sin
  título. Así los avatares y los nombres de todos quedan alineados a la izquierda bajo «Jugador»
  (petición de JoseLuis).
- Roadmap: nueva idea de JoseLuis, mandar al rival un emoji o una reacción rápida en las
  partidas en línea.

## [3.2.0] - 2026-10-11

**Las salas sin empezar se cierran a los 30 min ([0852acf](https://github.com/chopenhauer/devin-juega-oso/commit/0852acf42680ea12054dbe7482cde76054e11cbb))**

- Si pasan 30 minutos desde que se abre una sala y la partida no ha empezado, el servidor la
  cierra. El anfitrión ve «⌛ Sala cerrada: no empezó en 30 min. Abre otra.» y tiene «Abrir sala»
  en la misma pantalla para crear una nueva con otro código. Quien estaba invitado vuelve al inicio
  con «… Pide otro enlace.», y si abre el enlace viejo se le explica por qué ya no vale.
- Una sala que no llega a empezar se borra de Redis a la hora y media en vez de a las 24 h. Una
  partida empezada no se cierra por este límite.
- Medición: contador `expired` en el servidor y evento `online_expired` (`role`: `host` o `guest`).

**Decisiones**

- Idea de JoseLuis: así nadie se queda esperando para siempre y no se guardan salas olvidadas. La
  cuenta empieza al abrir la sala, no cuando entra el rival.

## [3.1.0] - 2026-10-11

**Invitaciones en línea más claras** ([a5c9bbd](https://github.com/chopenhauer/devin-juega-oso/commit/a5c9bbdaf0669ecf9c33fdde209844630c79d13b))

- Los textos del juego en línea usan palabras que valen para cualquiera: «Esperando a tu rival…»,
  «Invita a tu rival», «… ya está aquí. ¡Elige el tablero!», «Tu rival espera tu jugada», «Invita a
  quien quieras». Antes decían «tu amigo» o «está listo».
- El mensaje de WhatsApp lleva un solo enlace, el de la sala, con la UTM dentro
  (`utm_campaign=en_linea`, `utm_source=whatsapp` o `copy`). Así GA separa las invitaciones a
  partidas en línea del «compartir» de boca-oreja. Al entrar se quita el código de la dirección,
  pero la UTM se queda para que GA la vea.
- Los enlaces de sala tienen su propia tarjeta en WhatsApp: «Te reto a una partida de OSO 🐻» con la
  imagen `og-sala.png` («¡Te reto a una partida!» · «🌐 Juega en línea»). Un middleware de
  Vercel (`middleware.js`) sirve `sala.html`, que es la misma página con otras etiquetas Open Graph y se genera al publicar.
- Más espacio entre el selector de tablero y «¡A jugar!».
- El aviso del juego en línea («Esperando a tu rival…») se ve más: queda centrado entre el borde de
  arriba de la pantalla y la tarjeta, tiene la misma altura que los botones ← → y lleva letra más
  grande con borde amarillo.

**Decisiones**

- Lenguaje inclusivo (propuesta de JoseLuis): términos neutros como «rival» o «quien te invitó» en
  vez de «amig@», porque los lectores de pantalla leen mal la @. La regla está en
  [`docs/DESIGN.md`](docs/DESIGN.md).
- Mobile first y responsive como regla general (JoseLuis): se diseña primero para el móvil en
  vertical y se amplía para iPad y escritorio. También está en `docs/DESIGN.md`.

**Difusión (fuera del juego)**

- JoseLuis añade juegaoso.com a los «Enlaces externos» del artículo
  [Oso (juego)](<https://es.wikipedia.org/wiki/Oso_(juego)>) de Wikipedia en español
  ([edición del 11-oct](https://es.wikipedia.org/w/index.php?diff=175771474)). En el resumen de la
  edición declara el conflicto de intereses, porque somos los autores; el juego sigue las reglas de
  ese mismo artículo. Las normas de Wikipedia desaconsejan enlazar webs propias, así que puede que
  otro editor lo retire. Si pasa, no se vuelve a añadir: se propone en la página de discusión.

## [3.0.1] - 2026-10-11

**Analítica solo en producción y paneles para seguir el juego en línea** ([e43b69a](https://github.com/chopenhauer/devin-juega-oso/commit/e43b69ac85905609d4fabca886998a7457cd79a2))

- Google Analytics y Microsoft Clarity se cargan solo en juegaoso.com y devin-juega-oso.vercel.app.
  Las previews de Vercel ya no envían datos, así que las pruebas no se mezclan con las partidas de
  verdad en los paneles de GA4 y Looker Studio.
- GA4: registramos como definiciones personalizadas los parámetros de los eventos en línea. Las
  dimensiones son `role`, `answered` y `reason`. Las métricas en milisegundos son
  `move_rtt_p50_ms`, `move_rtt_p95_ms`, `sync_p50_ms`, `sync_p95_ms` y `answer_ms`, y las demás
  son `polls`, `poll_errors`, `reconnects` y `conflicts`. La descripción de `mode` ya incluye
  `online`. GA solo los cuenta desde que se registran (10-oct-2026).
- Paneles en GA4: «OSO · Panel» (uso, tiempos, juego y máquina) y «OSO · Feedback» (👍/👎).
- Informe en Looker Studio con cuatro páginas: «¿Va bien la opción A?» (con los umbrales de
  [`docs/ONLINE.md`](docs/ONLINE.md)), «Calidad de conexión», «¿Sigues ahí?» y «Juego en general».
  Llega por email cada lunes a las 08:00 (hora de Madrid).
- JoseLuis los montó con un agente en el navegador, a partir de prompts preparados en el proyecto.
  Después los revisamos con capturas. Los enlaces de los paneles no están en este repo porque es
  público.
- Al revisarlos, GA contaba 3 salas creadas y nada más, y el servidor 2 salas, 1 unión y 1 partida
  empezada y terminada. Hay tres causas. El consentimiento es por dispositivo, así que si el
  invitado no acepta cookies, GA no lo ve. GA también recibía las previews (arreglado en esta
  versión). Y «últimos 28 días» no incluye el día de hoy. La serie semanal sale plana porque todos
  los datos caen en la semana 41: no es un fallo.
- Decisión: para evaluar la opción A del juego en línea mandan los contadores del servidor
  (`/api/sala?stats=1`), que cuentan todas las partidas y separan producción de preview. GA solo
  ve a quien acepta cookies (cada dispositivo decide), así que se queda corto con los invitados; lo
  usamos para la calidad de conexión.

## [3.0.0] - 2026-10-10

**Jugar en línea 1 contra 1** ([cc103c1](https://github.com/chopenhauer/devin-juega-oso/commit/cc103c1fafcf5e07a6fd82057d8875dad5cc5fb7))

- Botón 🌐 arriba a la izquierda que presenta el modo, con «Invitar a un amigo».
- «2 jugadores» pregunta «¿Dónde está tu rival?»: 🛋️ Juntos (mismo dispositivo) o 🌐 En línea.
- En línea, la tarjeta del jugador 2 sirve para invitar: «Abrir sala», «Código: XXXXX» en una
  línea y WhatsApp y Copiar enlace alineados con las filas de avatares. El amigo abre el enlace y ve
  la misma pantalla con la tarjeta de quien invita (solo lectura) y la suya para rellenar.
- Los dos pasan al tablero, pero solo quien invita elige el tamaño y pulsa «¡A jugar!». El botón
  está desactivado hasta que el amigo está listo. Después, cuenta atrás 3-2-1 en los dos
  dispositivos.
- Los avisos de la sala («Esperando a tu amigo…», «… te invita», «… está listo», «… está eligiendo
  el tablero…», errores) salen en un aviso arriba de la pantalla.
- El servidor hace de árbitro: valida cada jugada, lleva los relojes (no corren durante la cuenta
  atrás) y gestiona abandono y revancha. Recargar la página recupera la partida.
- «¿Sigues ahí?» a los 20 s sin jugar para quien tiene el turno, y un mensaje de ánimo para quien
  espera.
- Telemetría para evaluar la decisión: eventos `online_create`, `online_join`, `online_join_fail`,
  `online_quality` y `online_nudge` (con consentimiento) y contadores anónimos por mes en el
  servidor.

**Decisiones**

- Opción A: funciones de Vercel + Upstash Redis + polling. Las alternativas, los umbrales para
  revisarla y el flujo están en [`docs/ONLINE.md`](docs/ONLINE.md).
- Cerrar la pestaña no cuenta como abandono (no se distingue de recargar): quien no vuelve pierde
  por tiempo. Salir desde el menú sí es abandono, y entonces no hay revancha.
- Flujo de la sala rediseñado con el feedback de JoseLuis (capturas y FigJam «Ronda 2»).
- La política de privacidad explica qué se envía en las partidas en línea.

## [2.6.1] - 2026-10-10

**Sistema de diseño** ([334ec7e](https://github.com/chopenhauer/devin-juega-oso/commit/334ec7e92da9fba7e0ef9bbfbb57068001402341))

- Nuevo `public/css/tokens.css`, la única fuente de colores, letra, espacios, radios, sombras,
  animación y capas, en tres capas: primitivos, semánticos y componentes. Los nombres anteriores
  (`--accent`, `--p1`…) siguen como alias.
- `styles.css` ya solo usa tokens. El juego se ve igual: comparamos 61 capturas de antes y después
  (móvil y escritorio, temas incluidos).
- Los temas solo cambian tokens semánticos; los de `themes.js` pueden cambiar cualquier token. El
  confeti del tema clásico sale de los tokens.
- Guía viva en `/design`, solo en local y en las previews (decisión de JoseLuis: no se publica).
- `npm run tokens` exporta `docs/tokens.json` (formato W3C) para llevarlos a Figma.
- Preparado para alto contraste, densidad compacta y marcas de jugador sin depender del color.
- Tests que fallan si vuelven valores sueltos, si se usa un token que no existe o si `tokens.json`
  se queda viejo.

## [2.6.0] - 2026-10-10

**Boca-oreja** ([1773776](https://github.com/chopenhauer/devin-juega-oso/commit/17737766fe2ee4557108339ed961151f4b8c81b2))

- Compartir OSO desde tres sitios: 📣 en la pantalla de inicio (junto a 🔊 y 🎨), «📣 Invitar a
  jugar» en el menú ☰ y «📣 Compartir resultado» en la pantalla final.
- En el móvil se abre el menú de compartir del teléfono. Si el dispositivo no lo tiene, sale una
  ventana con 💬 WhatsApp, ✉️ Email y 🔗 «Copiar enlace», que se cierra con «Cerrar» o Esc.
- Desde la pantalla final se comparte el resultado («¡He ganado a la máquina 7 a 5 en OSO 🐻! ¿Te
  atreves?», con versiones para derrota, empate, 2 y 4 jugadores); desde el inicio y el menú, una
  invitación a jugar.
- Tarjeta del enlace (Open Graph): título, descripción e imagen 1200×630 del oso con O-S-O, para
  que WhatsApp y otras apps muestren una vista previa. Se regenera con `npm run og`.
- Evento `share` de GA con el canal (`native`, `whatsapp`, `email`, `copy`) y el sitio (`start`,
  `menu`, `end`), solo con las cookies aceptadas. Los enlaces llevan `utm_source` y
  `utm_campaign=boca_oreja`.

**Decisiones**

- Se llama «Boca-oreja» (idea de JoseLuis) y es la 2.6.0, porque la 2.5.0 fue el tema Año Nuevo
  Chino; las fases siguientes del roadmap suben un número.
- Los textos no llevan los nombres de los jugadores, porque pueden ser niños.
- Sin SDKs ni botones de redes sociales: solo enlaces normales, por la CSP y la privacidad.

## [2.5.1] - 2026-10-10

**Nombre visible con el teclado del móvil**
([e7e5f11](https://github.com/chopenhauer/devin-juega-oso/commit/e7e5f11))

- En el móvil, al escribir el nombre de un jugador la pantalla sube para que el campo quede encima
  del teclado y se vea lo que escribes. Al cerrar el teclado vuelve a su sitio.

**Decisiones**

- El teclado tapa la pantalla sin redimensionarla, así que medimos cuánto tapa (`visualViewport`),
  añadimos ese espacio debajo y centramos el campo en la parte visible. No usamos
  `interactive-widget=resizes-content` porque encogería toda la página y cambiaría el diseño
  (orientación y alturas) mientras escribes.

## [2.5.0] - 2026-10-10

**Tema Año Nuevo Chino** (idea de Julia,
[7ef8aa8](https://github.com/chopenhauer/devin-juega-oso/commit/7ef8aa8))

- Tema nuevo 🏮 «Año Nuevo Chino», 24 en total: los 12 animales del zodiaco chino como avatares
  (🐀 🐂 🐅 🐇 🐉 🐍 🐎 🐐 🐒 🐓 🐕 🐖), farolillos, sobres rojos, dragón y fuegos artificiales
  subiendo, fondo rojo y dorado y confeti a juego.
- Sale en el menú 🎨 desde un mes antes hasta un mes después y se pone solo el día de Año Nuevo
  Chino.

**Decisiones**

- La fecha es lunar y cambia cada año, así que va en una tabla (2025–2035) en `public/js/themes.js`;
  cuando se acabe, el tema sigue en «Ver otros» y solo hay que añadir los años nuevos.
- Si coincide con Carnaval (17 de febrero de 2026), ese día gana el Año Nuevo Chino.

## [2.4.0] - 2026-10-10

**Escuchar y medir** ([0a5cb1c](https://github.com/chopenhauer/devin-juega-oso/commit/0a5cb1c),
[6f3e11b](https://github.com/chopenhauer/devin-juega-oso/commit/6f3e11b))

- Política de privacidad en `/privacidad`, enlazada desde el aviso de cookies y el pie.
- Eventos de GA `game_start`, `game_end` y `game_abandon`, solo si se aceptan las cookies: tablero,
  modo, dificultad, cómo terminó (tiempo o tablero lleno), quién ganó (persona, máquina o empate),
  tiempos y casillas ocupadas. Objetivo `TIMEOUT_TARGET = 0.5` en `public/js/telemetry.js`.
- «¿Os está gustando OSO?» con 👍/👎 debajo de los botones del final, en segundo plano. Al
  contestar, una ventana «¡Gracias!» con «💡 Cuéntanos más» (email) y «Cerrar».
- «💡 Ideas y opiniones» en el menú ☰: abre un email a hola@juegaoso.com con el asunto puesto.
- Pie en una línea: «made by Vilarequi with ❤️ · versión · Cookies · Privacidad».

**Decisiones**

- La política la firma «el equipo de juegaoso.com», sin nombre, con contacto hola@juegaoso.com
  (reenvío de email de name.com hacia un correo real).
- Las ideas llegan por email (`mailto:`): sin servidor ni datos guardados en la web. El texto
  libre dentro del juego queda para la 2.7.0.
- Los eventos no llevan nombres, avatares ni nada que se escriba.
- Cuándo preguntar 👍/👎: en la primera partida del dispositivo, al ganar a la máquina y cada 3
  partidas seguidas entre los mismos jugadores. Nunca justo cuando gana la máquina ni dos veces en
  menos de 5 partidas (`FEEDBACK_COOLDOWN`, `FEEDBACK_STREAK`). Si contestan, no se vuelve a
  preguntar hasta la siguiente versión menor. El evento `feedback` indica el momento.

## [2.3.1] - 2026-10-10

**Botones de navegación más simples** ([ad80892](https://github.com/chopenhauer/devin-juega-oso/commit/ad80892),
[78cc6e7](https://github.com/chopenhauer/devin-juega-oso/commit/78cc6e7))

- En «Cómo se juega» los botones (← ❓ →) son simples, con el mismo aspecto y sin amarillo; ← y →
  tienen el mismo tamaño y ❓ sigue siendo redondo.
- En la configuración de la partida ← y → tienen el mismo ancho y → sigue siendo amarillo.
- En el paso de modo, el botón principal pasa a «Siguiente →», con un ancho parecido al de
  «👀 Cómo se juega».

**Decisiones**

- El amarillo queda para las acciones que hacen avanzar hacia la partida; la explicación de las
  reglas solo usa botones simples.

## [2.3.0] - 2026-10-09

**Reglas animadas del FigJam** ([c38dbc0](https://github.com/chopenhauer/devin-juega-oso/commit/c38dbc0))

- Paso 1: una mano 👆 coge la S de abajo y la arrastra hasta una casilla vacía del tablero. El
  texto dice ahora «arrástrala hasta una casilla vacía del tablero (o tócala)».
- Paso 2: sigue donde lo dejó el paso 1. Arrastra una O al hueco, las tres fichas se ponen azules
  con un «+1» y debajo salen ↔ horizontal, ↕ vertical y ⤡ diagonal.
- Paso del reloj: cuenta de 0:07 a 0:00, en rojo desde 0:05, y se queda un momento en 0:00.
- Cada tarjeta empieza su animación desde el principio al llegar a ella; solo se anima la visible.
- Prueba en navegador de las animaciones y de «reducir movimiento».

**Decisiones**

- La 2.3.0 son las reglas animadas, como estaba previsto; «Escuchar y medir» pasa a la 2.4.0.
- Con «reducir movimiento» todo se queda quieto mostrando el final de la jugada: la S puesta, OSO
  en azul y el reloj en 0:05 en rojo.
- Solo CSS, sin JavaScript nuevo salvo reiniciar la tarjeta visible. La tarjeta mide casi lo mismo
  que antes (6 px más en un móvil de 390 px, sin scroll).

## [2.2.1] - 2026-10-09

**Ajustes del FigJam** ([7589942](https://github.com/chopenhauer/devin-juega-oso/commit/7589942),
[cf9ab43](https://github.com/chopenhauer/devin-juega-oso/commit/cf9ab43))

- Navegación de los pasos con 3 botones repartidos por igual: ←, ❓ y →. El ❓ queda siempre en el
  centro, también en «Elige el tablero».
- «👀 Cómo se juega» en la pantalla de modo lleva al primer paso de las reglas.
- Pantalla de modo: el emoji arriba y el texto debajo.
- Extras de las reglas: emojis en una columna centrada y frases alineadas a la izquierda.
- Jugadores con 4: avatares en 3 filas de 4, más grandes.
- Pantalla de tablero: «más puntos OSO posibles», sin la línea de resumen (sigue para lectores de
  pantalla), más margen en la flecha del selector, la etiqueta separada y «¡A jugar!» debajo.
- 4 jugadores en el móvil: el botón sale atenuado y, al pulsarlo, una ventana avisa «Solo
  disponible en ordenador o tablet».
- Ficha O/S seleccionada: el relieve va dentro de la ficha y el anillo del jugador la rodea entera.
- Pie: «… — con ❤️».

**Decisiones:** la bienvenida sigue saliendo solo la primera vez. En la pantalla de modo se mantiene
el texto «👀 Cómo se juega» en lugar de solo ←, para que se entienda adónde lleva. Al publicar se
borraron las ramas antiguas: en el repo queda solo `main`.

## [2.2.0] - 2026-10-09

**Sonidos** ([9a77e3a](https://github.com/chopenhauer/devin-juega-oso/commit/9a77e3a))

- Al acabar la partida suena una fanfarria si gana una persona (o varias), una melodía neutra si
  hay empate y una melodía descendente si gana la Máquina.
- Durante la partida: un «tic» al poner una letra, dos notas al formar OSO, un doble pitido cuando
  a un jugador le quedan 20 s (una vez por partida) y, con 4 jugadores, un sonido al quedarse fuera.
- Extras: 💡, 👁️ y 🔄 tienen un sonido corto propio; 🛟 SOS suena como una sirena de unos 1,5 s,
  porque cambia las reglas para todos (idea de JoseLuis).
- Botón 🔊 / 🔇 en la pantalla de inicio, junto al 🎨, y «Sonido» en el menú ☰ de la partida.
  Se recuerda en el dispositivo y silencia todo, también la fanfarria del easter egg.
- **Decisiones:** todo se genera en el navegador con Web Audio, sin archivos ni cambios en la CSP;
  empieza encendido y a volumen suave; la repetición del SOS no suena para no tapar la sirena.

## [2.1.2] - 2026-10-09

- En la celebración del easter egg el fondo se oscurece, para que el mensaje «¡Tienes más temas
  disponibles!» destaque. Con «reducir movimiento» también se oscurece, sin animación.

## [2.1.1] - 2026-10-09

**Easter egg de los temas, más festivo**

- Las pulsaciones seguidas del 🎨 ya no abren y cierran el menú: se queda como estaba.
- Al llegar a 6 caen huevos de Pascua por toda la pantalla, sale «¡Tienes más temas disponibles!»
  y suena una pequeña fanfarria (generada en el navegador, sin archivos de audio).
- **Decisiones:** el menú mantiene su ancho y no lleva el mensaje; «Ver otros temas» se amplía con
  todos los temas, sin separar los que ya estaban de los nuevos.

## [2.1.0] - 2026-10-09

**Temas por fechas** ([4f5cb32](https://github.com/chopenhauer/devin-juega-oso/commit/4f5cb32))

- 20 temas nuevos, 23 en total. Cada uno tiene 12 avatares, colores, fondo, decoración y confeti:
  - fiestas: Año Nuevo, Reyes Magos, San Valentín, Carnaval, San Patricio, Pascua, Sant Jordi, San
    Juan, San Fermín y Acción de Gracias;
  - épocas: Primavera, Verano y Otoño;
  - lugares y aventuras: África, Antártida, Atlántida, Espacio, Dinosaurios y Piratas;
  - Cumpleaños.
- Menú 🎨 con un máximo de 5 temas: Clásico y las fiestas que estén a menos de un mes, antes o
  después. «Ver otros temas» llega hasta 10 en total.
- Easter egg: con 6 pulsaciones seguidas del 🎨 (en menos de 3 s) salen todos los temas hasta que se
  recarga la página.
- **Decisiones:**
  - El día de la fiesta su tema se pone solo; al día siguiente vuelve el que se eligió. Si ese día se
    elige otro a mano, se respeta.
  - Las épocas solo salen en el menú mientras duran y nunca se ponen solas.
  - Cumpleaños no tiene fecha, para no guardar la de nadie; se elige a mano en «Ver otros».
  - «Ver otros» empieza por Cumpleaños y alterna un lugar o aventura con la próxima fiesta. El tema
    puesto sale siempre en el menú.
  - Pascua, Carnaval y Acción de Gracias calculan su día cada año.
  - La mayoría de los temas son de los niños.

## [2.0.1] - 2026-10-09

**Vista de 4 jugadores en el ordenador** ([e0bd3c6](https://github.com/chopenhauer/devin-juega-oso/commit/e0bd3c6), [6de8815](https://github.com/chopenhauer/devin-juega-oso/commit/6de8815))

- En «Misma vista», el tablero queda a la izquierda y las 4 tarjetas de jugador se apilan a la
  derecha, en orden de turno y sin scroll.
- Los botones O y S de esa vista son cuadrados, como las casillas del tablero.
- **Decisiones:** en tablet se abre por defecto «Enfrentados» y en el ordenador «Misma vista»; se
  puede cambiar en el paso «Vista».

## [2.0.0] - 2026-10-09

**Modo 4 jugadores** ([d38323b](https://github.com/chopenhauer/devin-juega-oso/commit/d38323b), [b9daeea](https://github.com/chopenhauer/devin-juega-oso/commit/b9daeea), [5b8a6c6](https://github.com/chopenhauer/devin-juega-oso/commit/5b8a6c6))

- Cuatro personas, cada una con su nombre, su avatar y su color, y un panel a cada lado del tablero.
- Vistas «Enfrentados» (cada panel mira a su lado de la mesa) y «Misma vista» (todos derechos).
- Al final salen los 4 marcadores, y el marcador de la sesión cuenta a los cuatro.
- **Decisiones:** todos contra todos y gana quien tenga más puntos (empate en cabeza = victoria
  compartida); turnos 1 → 2 → 3 → 4; tableros 6 × 6, 7 × 7 y 8 × 8 con el mismo reloj que con 2
  jugadores; quien se queda sin tiempo queda fuera con sus puntos y los demás siguen hasta que solo
  quede uno con tiempo; solo personas, sin máquina; cada jugador con 💡, 👁️ y 🔄 una vez; 👁️ marca la
  última jugada de un rival; 🛟 sigue siendo una vez por partida; solo en tablet u ordenador (en
  móvil, desactivado con «En tablet u ordenador»).

**Marcador contra la máquina** ([af17f60](https://github.com/chopenhauer/devin-juega-oso/commit/af17f60))

- El marcador de la sesión sale ya desde la primera partida contra la máquina (con 2 y 4 jugadores,
  desde la segunda).

## [1.9.0] - 2026-10-09

**Pantalla de modo y máquina** ([5013856](https://github.com/chopenhauer/devin-juega-oso/commit/5013856), [76671b0](https://github.com/chopenhauer/devin-juega-oso/commit/76671b0), [da85180](https://github.com/chopenhauer/devin-juega-oso/commit/da85180))

- La pantalla «¿Cómo queréis jugar?» lleva la cabecera OSO y el selector 1 · 2 · 4 jugadores.
- Navegación más simple: «Siguiente», «Cómo se juega» (vuelve al inicio) y ❓ para las reglas.
- La dificultad de la máquina pasa a la pantalla de jugadores, en la tarjeta «Máquina».
- Robots propios para fácil y difícil, con la boca tapada («#!» y «#$@!»).
- Versión del juego en el pie y este changelog.
- **Decisiones:** sin barra de progreso. «4 jugadores» visible pero desactivado hasta tenerlo listo.
  El robot no lleva emojis encima: cada dificultad tiene su dibujo.

## [1.8.2] - 2026-10-09

- Las reglas completas ya no quedan tapadas por el botón 🎨 ni por los créditos ([c5adc53](https://github.com/chopenhauer/devin-juega-oso/commit/c5adc53)).

## [1.8.1] - 2026-10-09

- El botón 🎨 se ve en las pantallas de inicio hasta elegir el número de jugadores
  ([03c7ae4](https://github.com/chopenhauer/devin-juega-oso/commit/03c7ae4)).

## [1.8.0] - 2026-10-09

- Google Analytics 4 ([0e187bb](https://github.com/chopenhauer/devin-juega-oso/commit/0e187bb)) y aviso de cookies con «Aceptar» y «Rechazar»
  ([ea003e2](https://github.com/chopenhauer/devin-juega-oso/commit/ea003e2)).
- **Decisiones:** Consent Mode v2 con la analítica denegada hasta aceptar y la publicidad siempre
  denegada (no hay anuncios). Clarity, que antes se cargaba siempre, ahora solo se carga tras
  aceptar. «Cookies» en el pie permite cambiar de opinión.

## [1.7.1] - 2026-10-09

- Las fichas arrastradas con el ratón ya no se quedan colgadas en escritorio ([0fb6139](https://github.com/chopenhauer/devin-juega-oso/commit/0fb6139)).

## [1.7.0] - 2026-10-09

- Temas Clásico, 🎃 Halloween y ⛄ Navidad: avatares, icono, fondo y confeti ([c24e0db](https://github.com/chopenhauer/devin-juega-oso/commit/c24e0db)).
- **Decisiones:** el botón 🎨 va fuera de la carta, arriba a la derecha, con una pista de tamaño que
  solo se repite hasta abrirlo la primera vez ([1f26742](https://github.com/chopenhauer/devin-juega-oso/commit/1f26742)). Las reglas no cambian con el tema.
  Los temas futuros están en el roadmap (varios, ideas de Julia).

## [1.6.0] - 2026-10-09

- Marcador de la sesión al final de cada partida, con Revancha, Otro tablero y Cambiar jugadores
  ([9598ebb](https://github.com/chopenhauer/devin-juega-oso/commit/9598ebb)).
- **Decisión:** el marcador se reinicia al cambiar de jugadores o de modo, pero no al cambiar de
  tablero.

## [1.5.0] - 2026-10-09

- Diseño de escritorio e iPad para 1 y 2 jugadores ([5b1e78b](https://github.com/chopenhauer/devin-juega-oso/commit/5b1e78b)).
- Fichas que se arrastran hasta el tablero ([f3a8d38](https://github.com/chopenhauer/devin-juega-oso/commit/f3a8d38)).
- Menú ☰ en cada panel, girado hacia quien lo abre ([655577b](https://github.com/chopenhauer/devin-juega-oso/commit/655577b), [08840df](https://github.com/chopenhauer/devin-juega-oso/commit/08840df)).
- **Decisiones:** el tablero, lo más grande posible. El modo 4 jugadores queda para una fase 2.

## [1.4.1] - 2026-10-08

- Accesibilidad WCAG 2.2 AA, revisada con axe, y guía de diseño en `docs/DESIGN.md` ([e4fedc4](https://github.com/chopenhauer/devin-juega-oso/commit/e4fedc4)).

## [1.4.0] - 2026-10-08

- Tema marino con olas al pasar de OSO a SOS ([3045764](https://github.com/chopenhauer/devin-juega-oso/commit/3045764), [3b6f0a3](https://github.com/chopenhauer/devin-juega-oso/commit/3b6f0a3)).
- Créditos en el pie: «Hecho por Julia y JoseLuis — Vilarequi — con amor» ([05f6894](https://github.com/chopenhauer/devin-juega-oso/commit/05f6894)).
- **Decisión:** el marcador dice «puntos OSO» o «puntos SOS», nunca «OSOS» ([4e935c2](https://github.com/chopenhauer/devin-juega-oso/commit/4e935c2)).
- **Decisión:** los regalos desbloqueables quedan solo como idea en el roadmap ([7128d7b](https://github.com/chopenhauer/devin-juega-oso/commit/7128d7b)).

## [1.3.0] - 2026-10-08

- Inicio por pasos: bienvenida, cómo se juega, modo, jugadores y tablero ([95ca111](https://github.com/chopenhauer/devin-juega-oso/commit/95ca111)).
- Avatares exclusivos, reglas en carrusel y panel de altura fija ([bfe2d7e](https://github.com/chopenhauer/devin-juega-oso/commit/bfe2d7e)).
- Paso «¿Cómo vais a jugar?»: enfrentados o misma vista ([ae2b460](https://github.com/chopenhauer/devin-juega-oso/commit/ae2b460)).
- Microsoft Clarity como script externo ([ffdcba8](https://github.com/chopenhauer/devin-juega-oso/commit/ffdcba8)).
- **Decisiones:** la bienvenida solo sale la primera vez y las elecciones se recuerdan en el
  dispositivo.

## [1.2.1] - 2026-10-08

- Arquitectura: motor de reglas separado de la interfaz, CSP y cabeceras de seguridad, fuente propia,
  tests y CI ([d5e1934](https://github.com/chopenhauer/devin-juega-oso/commit/d5e1934), [f4d1fe2](https://github.com/chopenhauer/devin-juega-oso/commit/f4d1fe2)).

## [1.2.0] - 2026-10-08

- Corrige los fallos B02–B05: clics durante el turno de la máquina, recálculo SOS, reloj y salida a
  mitad del recálculo ([ef49f20](https://github.com/chopenhauer/devin-juega-oso/commit/ef49f20)).
- Ayuda en partida con pausa, contador de extras y nombres por defecto «Jugador N».

## [1.1.0] - 2026-10-08

- Rediseño visual: tema nocturno, fichas 3D, animaciones y logo OSO ([dec65d3](https://github.com/chopenhauer/devin-juega-oso/commit/dec65d3)).

## [1.0.0] - 2026-10-08

- Primera publicación en Vercel del juego OSO v12 que hicieron Julia y JoseLuis ([ce664f9](https://github.com/chopenhauer/devin-juega-oso/commit/ce664f9)).
- **Decisiones:** repositorio privado en GitHub; cada cambio se prepara en una rama con preview y se
  publica al hacer merge a `main`.
