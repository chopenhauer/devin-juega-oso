# Changelog y diario de decisiones

Versiones de OSO, el juego de Julia y JoseLuis, con las mejoras de cada una y las decisiones que
tomamos por el camino. La versión que sale en el pie del juego viene de `public/js/version.js`.

**Cómo numeramos (MAYOR.MENOR.CORRECCIÓN):**

- **Mayor:** cambia cómo se juega (modos o reglas nuevas). Ejemplo: el modo 4 jugadores será la 2.0.0.
- **Menor:** novedades sin cambiar las reglas (temas, marcador, pantallas, avisos).
- **Corrección:** arreglos y ajustes visuales.

Las versiones hasta la 1.8.2 se reconstruyeron a partir del historial de `main`. Lo pendiente está en
[`docs/ROADMAP.md`](docs/ROADMAP.md).

## Próximamente

- **4.0.0 · Equipos con 4 jugadores** (idea): elegir entre cada uno por su cuenta o 2 contra 2, con
  nombre de equipo opcional («Equipo 1» contra «Equipo 2» por defecto).

## [3.12.0] - 2026-10-17

**El resultado se comparte con una imagen del marcador**

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
