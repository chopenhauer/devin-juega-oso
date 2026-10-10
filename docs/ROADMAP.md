# Roadmap e ideas de mejora

Lista viva de lo que podemos mejorar en el juego. Nada de esto está comprometido: cada punto se
decide, se hace en una rama con preview de Vercel y se publica en `main` cuando se aprueba.

## Ya hecho

- Rediseño visual (fondo nocturno, fichas 3D, animaciones, victoria con confeti).
- Bugs B01–B05 corregidos (B06 se mantiene a propósito, ver abajo).
- T4.1: nombres como texto de ejemplo («Jugador 1/2») en vez de valor precargado.
- Arquitectura: sitio estático en `public/`, motor de reglas testeable, CSP y cabeceras de
  seguridad, tests unitarios y e2e, CI y Dependabot.
- Inicio por pasos (bienvenida, carrusel de reglas, modo, jugadores, tablero), elecciones
  recordadas en el navegador, avatares exclusivos y panel de altura fija.
- Paso «¿Cómo vais a jugar?» con 2 jugadores: _Enfrentados_ (panel del jugador 2 girado) o _Misma
  vista_; por defecto Enfrentados en móvil y tablet, Misma vista en escritorio.
- Analítica con Google Analytics 4 y Microsoft Clarity, con aviso de cookies Aceptar / Rechazar
  (Consent Mode v2; Clarity solo se carga tras aceptar y la publicidad queda siempre denegada).
- Tema marino con olas suaves al activar el extra OSO→SOS.
- Créditos en el pie de las pantallas de inicio: «made by Vilarequi with ❤️» (2.4.0; antes «Hecho por
  Julia y JoseLuis — Vilarequi — con ❤️»).
- T4.2 fase 1: escritorio e iPad con 1 y 2 jugadores. En horizontal, tablero grande en el centro y
  paneles a los lados (girados hacia cada jugador en _Enfrentados_); en iPad vertical, tablero más
  grande y paneles de una fila arriba y abajo.
- Marcador de la sesión: al acabar cada partida se suman victorias y puntos mientras jueguen los mismos jugadores
  (se reinicia al cambiar nombres, avatares, modo o dificultad; no al cambiar de tablero). Final con «Revancha»,
  «Otro tablero» y «Cambiar jugadores».
- Menú por jugador: un ☰ en el panel de cada jugador; el menú se abre girado hacia quien lo pulsa.
- Fichas que se arrastran: la letra elegida tiene el color de las fichas del tablero, la otra se ve
  tenue, y un dedo animado indica que se puede arrastrar hasta el primer arrastre.
- Temas de temporada Halloween y Navidad, con el botón 🎨 visible hasta «¿Cómo queréis jugar?».
- Pantalla «¿Cómo queréis jugar?» con cabecera OSO, selector 1 · 2 · 4 jugadores y navegación
  simple («Siguiente», «Cómo se juega» y ❓); tarjeta «Máquina» con robots de dificultad (1.9.0).
- Versión en el pie y [`CHANGELOG.md`](../CHANGELOG.md) con las mejoras y decisiones de cada versión.
- Modo 4 jugadores (2.0.0) y marcador de la sesión contra la máquina desde la primera partida.
- Vista de 4 jugadores en el ordenador (2.0.1): en «Misma vista», tablero a la izquierda y las 4
  tarjetas apiladas a la derecha; en tablet, «Enfrentados» por defecto.
- Temas por fechas (2.1.0): 23 temas, menú 🎨 con Clásico y las fiestas cercanas, «Ver otros
  temas» hasta 10, el tema de la fiesta se pone solo ese día y easter egg con todos los temas.
- Easter egg más festivo (2.1.1 y 2.1.2): las pulsaciones seguidas del 🎨 no abren y cierran el
  menú; al llegar a 6 caen huevos de Pascua por toda la pantalla con el fondo oscurecido, sale
  «¡Tienes más temas disponibles!» y suena una fanfarria. El menú no cambia de ancho.
- Sonidos (2.2.0): final de partida (victoria, empate o gana la Máquina), letra, OSO, aviso de
  20 s, quedarse fuera con 4, un sonido por extra y sirena para el SOS. Botón 🔊 / 🔇 en inicio y
  en el menú ☰, recordado en el dispositivo.
- Ajustes del FigJam (2.2.1): navegación ← ❓ →, pantallas de modo, jugadores y tablero, ventana
  de «4 jugadores» en el móvil y anillo de selección de la ficha.
- Reglas animadas del FigJam (2.3.0): arrastrar una letra, completar OSO con ↔ ↕ ⤡ y cuenta
  atrás de los últimos 5 s en rojo, quietas con «reducir movimiento».
- Botones de navegación más simples (2.3.1): ← ❓ → sin amarillo en «Cómo se juega», → amarillo
  en la configuración, «Siguiente →» en el paso de modo y ❓ siempre redondo.
- Escuchar y medir (2.4.0): política de privacidad, eventos anónimos de partida (`game_start`,
  `game_end`, `game_abandon`) con consentimiento, 👍/👎 en momentos elegidos y «💡 Ideas» por email.
- Tema Año Nuevo Chino (2.5.0, idea de Julia): los 12 animales del zodiaco como avatares,
  farolillos y fondo rojo y dorado; se pone solo ese día (fecha lunar en una tabla).
- Nombre visible con el teclado del móvil (2.5.1): al escribir el nombre, la pantalla sube y el
  campo queda encima del teclado.
- Boca-oreja (2.6.0): compartir desde el inicio (📣), el menú ☰ y la pantalla final con el menú
  nativo del móvil o, si no hay, WhatsApp, email y «Copiar enlace»; tarjeta Open Graph del oso,
  evento `share` y enlaces con `utm_campaign=boca_oreja`. Sin nombres de jugadores.
- Sistema de diseño (2.6.1): `public/css/tokens.css` en capas (primitivos, semánticos,
  componentes); `styles.css` y los temas solo usan tokens; guía viva `/design` solo en local y
  previews; `npm run tokens` exporta `docs/tokens.json` (W3C).
- Repo ordenado: `main` protegida (ruleset: solo con el CI `check` en verde, sin force push ni
  borrado), licencia MIT y ramas antiguas borradas.

## Priorización (revisada tras la 2.2.1)

Solo lo pendiente, por valor y esfuerzo (estimados por Devin). Se revisa con cada versión y cuando
lleguen opiniones de los jugadores. Ya hechos de la priorización anterior: temas por fechas y de
temporada (2.1.0), sonidos (2.2.0) y proteger `main`.

| #   | Idea                                                                                  | Valor      | Esfuerzo   | Fase     |
| --- | ------------------------------------------------------------------------------------- | ---------- | ---------- | -------- |
| 1   | ~~Política de privacidad~~ hecho en 2.4.0                                             | Alto       | Bajo       | Hecho    |
| 2   | ~~Telemetría de partidas (`game_end`, paso 1 de la épica de tiempos)~~ hecho en 2.4.0 | Alto       | Bajo       | Hecho    |
| 3   | ~~Feedback rápido 👍/👎 e «💡 Ideas»~~ hecho en 2.4.0                                 | Alto       | Bajo       | Hecho    |
| 4   | ~~Reglas animadas (FigJam, segunda parte)~~ hecho en 2.3.0                            | Alto       | Medio      | Hecho    |
| 5   | ~~Compartir por WhatsApp y email, con tarjeta del enlace~~ hecho en 2.6.0             | Alto       | Bajo       | Hecho    |
| 6   | Tensión con poco tiempo (T4.3)                                                        | Medio-alto | Bajo       | 4        |
| 7   | Hall of fame local                                                                    | Alto       | Medio      | 4        |
| 8   | Ajustar los tiempos con datos reales (pasos 2 y 3)                                    | Alto       | Medio      | 5        |
| 9   | Feedback con texto libre (función de Vercel)                                          | Alto       | Medio      | 5        |
| 10  | Equipos 2 contra 2                                                                    | Medio      | Medio      | 6        |
| 11  | Tablero con teclado y OSOs sin depender del color                                     | Medio      | Medio      | Siempre  |
| 12  | Unificar los tamaños de letra fuera de escala (`--fs-letter-*`, `--fs-title-xl`…)     | Bajo       | Bajo       | Siempre  |
| 13  | Oso bailando al ganar (T4.5)                                                          | Medio      | Medio-alto | Reserva  |
| 14  | Máquina «Experto» (B06)                                                               | Medio      | Medio      | Reserva  |
| 15  | Modo Mercado / tiempo por ayudas (T4.6–T4.7)                                          | Medio      | Alto       | Reserva  |
| 16  | Hall of fame global                                                                   | Medio      | Alto       | Reserva  |
| 17  | Vibración (T4.4)                                                                      | Bajo       | Bajo       | Reserva  |
| 18  | Reloj con la pestaña dormida                                                          | Bajo       | Bajo       | Decidir  |
| 19  | Regalos desbloqueables                                                                | —          | Medio      | Sin plan |

**Por qué este orden:** primero las reglas animadas del FigJam, ya diseñadas (decisión de
JoseLuis), que mejoran la primera partida de quien llega nuevo. Justo después, medir: la telemetría
necesita semanas de partidas antes de poder ajustar nada y la política de privacidad debe estar
antes de medir más. Mercado, equipos y ranking global, cuando el feedback diga que se quieren.

## Plan por fases

Cada fase es una versión menor con su rama, preview y aprobación. Las decisiones abiertas se
preguntan una a una al empezar cada fase.

1. ~~**2.3.0 · Aprender jugando**~~ hecho (FigJam, segunda parte)
   - Paso 1 de las reglas: una animación arrastra una letra hasta el tablero.
   - Paso 2: sigue y completa OSO, con ↔ horizontal, ↕ vertical y ⤡ diagonal.
   - Paso del reloj: cuenta atrás de los últimos 5 s que se pone en rojo y acaba en 0:00.
   - Todo quieto con «reducir movimiento». El estilo de la cuenta atrás se reutiliza en la fase 4.
2. ~~**2.4.0 · Escuchar y medir**~~ hecho
   - Política de privacidad en una página propia, enlazada desde el pie y el aviso de cookies.
   - Evento `game_end` de GA con tablero, modo, cómo terminó y tiempos, sin datos personales;
     objetivo `TIMEOUT_TARGET = 0.5` en un solo sitio.
   - 👍/👎 al final de la partida (en momentos elegidos) e «💡 Ideas» en el menú ☰.
   - Decidido: firma «el equipo de juegaoso.com» con hola@juegaoso.com, e «💡 Ideas» por email.
3. ~~**2.6.0 · Boca-oreja**~~ hecho (la 2.5.0 fue el tema Año Nuevo Chino)
   - Compartir desde la pantalla final, el inicio y el menú ☰: menú nativo del móvil y, si no hay,
     WhatsApp, email y «Copiar enlace».
   - Título, descripción e imagen Open Graph para que WhatsApp muestre la tarjeta del oso.
   - Evento `share` y enlaces con `utm_source` para medirlo.
   - Decidido: los textos no llevan los nombres de los jugadores (pueden ser niños).
4. **2.7.0 · Más emoción**
   - Tensión con poco tiempo (T4.3): con 20 s o menos el fondo se tiñe poco a poco.
   - Hall of fame local: récords y rachas en el dispositivo, «¡Nuevo récord!» al acabar.
5. **2.8.0 · Ajustar con datos** (cuando haya unas 100 partidas por tablero)
   - Informe en GA4 y script que propone el tiempo de cada tablero; pasar de la fórmula a una
     tabla de tiempos.
   - Feedback con texto libre por una función de Vercel, con protección contra spam.
6. **3.0.0 · Equipos 2 contra 2**, si el feedback lo pide.

**Siempre, en paralelo:** accesibilidad (tablero con teclado, OSOs sin depender del color), deuda de
diseño (unificar los tamaños de letra fuera de escala, ver [`DESIGN.md`](DESIGN.md)) y afinar los temas
cuando se acerque cada fecha.

**En reserva:** oso bailando, máquina «Experto», Modo Mercado, hall of fame global, vibración y
reloj con la pestaña dormida. Los regalos desbloqueables siguen como idea sin planificar.

## Roadmap F4 (pendiente)

| Tarea | Idea                            | Esfuerzo   | Notas                                                                                                                        |
| ----- | ------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------- |
| T4.2  | Diseño por dispositivo          | Medio      | Hecho: fase 1 (1 y 2 jugadores) y fase 2 (4 jugadores en tablet y ordenador, versión 2.0.0).                                 |
| T4.3  | Tensión con poco tiempo         | Bajo       | Con ≤ 20 s el fondo se tiñe poco a poco. Nunca solo color, ≤ 3 parpadeos/s, contraste AA, estático con «reducir movimiento». |
| T4.4  | Vibración                       | Bajo       | Al colocar, puntuar, poco tiempo y ganar. Solo Android (iOS no soporta la Vibration API). Con ajuste para desactivarla.      |
| T4.5  | Oso bailando al ganar           | Medio-alto | Necesita arte nuevo (SVG animado o Lottie, no GIF). Fotograma fijo con «reducir movimiento».                                 |
| T4.6  | Modo Mercado: reglas            | Alto       | Comprar extras con tiempo del reloj (≈ 15 % pista, 10 % jugada rival, 30 % cambio O↔S). Modo opcional; la máquina no compra. |
| T4.7  | Modo Mercado: interfaz          | Medio      | Precio en cada extra, estado «comprable» y confirmación para no comprar sin querer.                                          |
| T4.8  | Prueba completa de cierre de F4 | Medio      | E2E de todo lo anterior.                                                                                                     |

Decisiones pendientes del Modo Mercado: costes exactos, límite de compras por jugador, margen
mínimo de tiempo tras comprar (propuesta: 10 s) y si existe en modo 1 jugador.

## Nuevas ideas

### Modo 4 jugadores

**Hecho en la versión 2.0.0.** Partidas de cuatro personas en el mismo dispositivo, por turnos.
Reglas decididas con JoseLuis:

- **Turnos:** rotan 1 → 2 → 3 → 4; formar OSO da punto y repites turno, igual que ahora.
- **Competición:** todos contra todos; gana quien tenga más puntos y, si hay empate en cabeza,
  comparten la victoria.
- **Jugadores:** solo personas (sin máquinas), cada una con nombre, avatar exclusivo y color.
- **Tablero y reloj:** se elige entre 6 × 6, 7 × 7 y 8 × 8, con el mismo reloj que con 2 jugadores
  en ese tablero (2:30, 3:00 y 4:00 por jugador).
- **Sin tiempo:** quien se queda sin tiempo queda fuera, conserva sus puntos y los demás siguen.
  La partida acaba al llenarse el tablero o cuando solo queda un jugador con tiempo; gana quien
  tenga más puntos.
- **Extras:** cada jugador tiene 💡, 👁️ y 🔄 una vez. 👁️ marca la última jugada del rival anterior
  (la casilla más reciente de cualquiera de los otros tres). 🛟 (OSO → SOS) sigue siendo una sola vez
  por partida, para quien lo use primero.
- **Dispositivos:** tablet y ordenador, con un panel a cada lado del tablero. En «Enfrentados»
  cada panel mira hacia su lado; en «Misma vista» todos quedan derechos. En móvil, «4 jugadores»
  sale atenuado y, al pulsarlo, una ventana avisa «Solo disponible en ordenador o tablet».
- **Motor:** `engine.js` se generaliza a N jugadores, con tests.

#### Evolución: equipos con 4 jugadores

Paso posterior al modo 4 jugadores (sería la versión 3.0.0). Al preparar una partida de cuatro se
elige cómo competir:

- **Cada uno por su cuenta:** todos contra todos, como en el modo 4 jugadores.
- **Por equipos:** 2 contra 2; se suman los puntos de cada equipo y gana el equipo con más puntos.
- **Nombre del equipo:** opcional. Por defecto «Equipo 1» contra «Equipo 2», o el nombre que le
  pongan los jugadores.
- **A decidir:** cómo se eligen los compañeros, si el turno alterna entre equipos y si los
  compañeros comparten extras.

### Hall of fame

Un salón de la fama con las mejores partidas y rachas.

- **Qué guardar:** ganador (nombre + avatar), puntuación, rival, modo, tamaño de tablero, fecha.
  Posibles rankings: más victorias, mayor puntuación por tamaño de tablero, más OSOs en una
  partida, victorias contra la máquina en Difícil.
- **Opción A · local (recomendada para empezar):** se guarda en `localStorage` del dispositivo.
  Sin servidor, sin datos personales fuera del navegador y compatible con la CSP actual. Ideal
  para la familia en una tablet compartida.
- **Opción B · global:** ranking compartido entre todos los jugadores. Necesita backend (por
  ejemplo una función de Vercel con base de datos), protección contra trampas y moderación de
  nombres. Como juegan menores, publicar nombres implica aviso de privacidad y consentimiento
  (RGPD); sería mejor usar solo alias o iniciales.
- **Pantalla:** acceso desde el inicio («🏆 Hall of fame») y al terminar la partida («¡Nuevo
  récord!»), con botón para borrar el historial.

### Temas de temporada (idea de Julia)

Que el juego cambie de skin según la época del año, para que se sienta distinto en cada fiesta.
Un tema cambia los avatares, el icono de portada, los colores, el fondo y el confeti de victoria;
las reglas no cambian. Se elige con el botón 🎨 arriba a la derecha de la pantalla de inicio y se
recuerda en el dispositivo (`oso.theme.v1`). Código: `public/js/themes.js`.

**Ya hechos (v1):**

| Tema         | Avatares                            | Fondo y decoración                                                          |
| ------------ | ----------------------------------- | --------------------------------------------------------------------------- |
| 🎃 Halloween | 🎃 🧛 👻 🧙 🦇 💀 🕷️ 🧟 🐈‍⬛ 🦉 🍬 🩸 | Noche morada y naranja, gotas de sangre arriba, murciélagos y calabazas.    |
| ⛄ Navidad   | ⛄ 🎅 🦌 🐧 🥕 ☕ 🎁 ❄️ 🎄 🍪 🧦 🐻‍❄️ | Noche azul con nieve cayendo, copos, regalos, café caliente y suelo nevado. |

**Hechos en 2.1.0** (las fiestas de San Patricio a Acción de Gracias, las épocas y los lugares son ideas de los niños):

| Tema                   | Fechas (orientativas)              | Avatares e ideas                                                                           |
| ---------------------- | ---------------------------------- | ------------------------------------------------------------------------------------------ |
| Año Nuevo              | 31 dic – 1 ene                     | 🎆 🥂 🍇 🕛 🎉 🥳; fuegos artificiales al ganar y las 12 uvas como cuenta atrás del reloj. |
| Reyes Magos            | 5 – 6 ene                          | 👑 🐪 🎁 ⭐ 🍰; roscón y estrella de Oriente.                                              |
| San Valentín           | 7 – 14 feb                         | 💘 🌹 💌 🧸 🍫 🦢; corazones flotando y fichas en rosa y rojo.                             |
| Carnaval               | Semana de carnaval                 | 🎭 🤡 🦸 🧚 🦹 🎊; antifaces y confeti.                                                    |
| San Patricio           | 17 mar                             | ☘️ 🍀 🌈 🪙 🎩 🧚; tréboles y arcoíris con olla de oro.                                    |
| Pascua                 | Domingo de Pascua (fecha variable) | 🐰 🐣 🥚 🧺 🍫 🌷; huevos de colores escondidos.                                           |
| Sant Jordi             | 23 abr                             | 🐉 🌹 📚 🏰 🛡️ 👸; rosas, libros y un dragón amable.                                       |
| San Juan               | 23 – 24 jun                        | 🔥 🎆 🎇 🌙 🌊 ✨; hogueras y fuegos artificiales.                                         |
| San Fermín             | 7 jul                              | 🐂 🧣 🎉 🏃 🔴 ⚪; pañuelo rojo y toros en dibujo amable.                                  |
| Acción de Gracias      | 4.º jueves de nov                  | 🦃 🥧 🌽 🍁 🍂 🥔; mesa de otoño.                                                          |
| Primavera              | 21 mar – 20 jun                    | 🌷 🦋 🐝 🌸 🐞 🌱; flores, mariposas y tonos verdes suaves.                                |
| Verano                 | 21 jun – 22 sep                    | 🏖️ 🦀 🐠 🐬 🍉 🍦 🕶️; arena, sol, sombrilla y osos con gafas.                              |
| Otoño                  | 23 sep – 20 dic                    | 🍂 🦔 🐿️ 🍄 🌰 🦉; hojas cayendo y tonos ocres.                                            |
| África                 | Todo el año                        | 🦁 🐘 🦒 🦓 🦏 🐊; sabana al atardecer.                                                    |
| Antártida              | Todo el año                        | 🐧 🦭 🐋 🧊 🏔️ 🛷; hielo, auroras y nieve.                                                 |
| Atlántida (imaginario) | Todo el año                        | 🧜 🐙 🐚 🔱 🏛️ 🐠; ciudad sumergida con burbujas.                                          |
| Espacio                | Todo el año                        | 🚀 👽 🪐 🛸 👩‍🚀 🌙; estrellas fugaces y planetas.                                           |
| Dinosaurios            | Todo el año                        | 🦖 🦕 🌋 🥚 🌿 🦴; volcán y selva prehistórica.                                            |
| Piratas                | Todo el año                        | 🏴‍☠️ 🦜 💰 🗺️ ⚓ 🦈; mapa del tesoro (ojo: no mezclar con el tema marino del SOS).           |
| Año Nuevo Chino        | Fecha lunar (ene – feb)            | 🐀 🐂 🐅 🐇 🐉 🐍 🐎 🐐 🐒 🐓 🐕 🐖; farolillos y dragón (2.5.0, idea de Julia).           |
| Cumpleaños             | Sin fecha: se elige a mano         | 🎂 🎈 🎁 🥳; tarta, globos y confeti; para el cumple de cualquiera, sin guardar fechas.    |

#### Menú de temas por fechas (idea de los niños)

Con tantos temas, el menú 🎨 no puede enseñarlos todos. Hecho en 2.1.0:

- **Menú:** como máximo 5 temas: siempre el Clásico y los que tengan su fecha cerca (de un mes
  antes a un mes después; por ejemplo San Fermín del 7 de junio al 7 de agosto).
- **Por defecto:** el Clásico, salvo el mismo día de la fiesta, que se pone ese tema solo (San
  Valentín el 14 de febrero, San Fermín el 7 de julio).
- **«Ver otros»:** despliega más temas, hasta 10 en total contando los del menú. El resto del año
  los temas de fiesta quedan ahí.
- **Easter egg:** pulsar el 🎨 más de 5 veces seguidas enseña todos los temas, aunque sean más de 10.
- **Tipos de tema:** fiestas (con día), épocas del año (con periodo) y lugares (todo el año).
- **Decisiones:**
  - El tema de la fiesta solo dura ese día y después vuelve el elegido.
  - Las épocas salen en el menú mientras duran.
  - «Ver otros» empieza por Cumpleaños y alterna lugares y próximas fiestas.
  - El easter egg son 6 pulsaciones seguidas (menos de 0,7 s entre una y otra) y dura hasta recargar.

- **Pendiente:** fichas y tablero con decoración propia de cada tema, y que el tema marino del SOS
  sustituya o se mezcle con el de temporada (hoy lo sustituye mientras dura).
- **Técnica:** `data-theme` en `body` con variables CSS, dibujos SVG en línea y emoji, sin recursos
  externos para respetar la CSP. Animaciones suaves y quietas con «reducir movimiento».

### Regalos y extras desbloqueables

**Solo idea, sin planificar:** JoseLuis no quiere hacerlo por ahora.

Pequeños regalos que se desbloquean jugando (por ejemplo al ganar, al formar varios OSO seguidos
o al completar partidas): avatares nuevos, temas o skins (como el marino del SOS), fichas
especiales o un extra adicional en la siguiente partida.

- **A decidir:** qué se desbloquea, con qué logro, si es por jugador o por dispositivo y si los
  regalos dan ventaja en la partida o son solo cosméticos.
- **Guardado:** en `localStorage`, igual que las preferencias y el hall of fame local.

### Intercambio de tiempo por ayudas

Que el jugador consiga ventajas a cambio de dedicar tiempo de su reloj: más pistas, ayudas
adicionales u otros extras del roadmap. Es la misma idea que el **Modo Mercado (T4.6/T4.7)**, que
ya define costes orientativos; las decisiones pendientes son las mismas (costes, límite de
compras, margen mínimo de tiempo y modo 1 jugador).

### Feedback e ideas de los jugadores

**Hecho en 2.4.0:** 👍/👎 como evento de GA en momentos elegidos (primera partida, ganar a la
máquina, cada 3 partidas seguidas; nunca tras ganar la máquina) e «💡 Ideas» por email a
hola@juegaoso.com. Queda el texto libre con la función de Vercel (2.8.0).

Que quien juega pueda mandarnos su opinión o ideas para que el juego evolucione. Antes de hacerlo
hay que decidir dos cosas:

- **Dónde ponerlo:**
  - **Menú ☰ de la partida:** una opción «💡 Ideas y opiniones», siempre a mano y sin
    interrumpir.
  - **Final de la partida:** una pregunta corta en la pantalla de resultado (por ejemplo «¿Os ha
    gustado? 👍 / 👎» y un enlace para contar más). Llega a más gente, pero conviene que salga
    pocas veces (por ejemplo tras la tercera partida y no más de una vez por dispositivo).
  - **Propuesta:** las dos; el menú siempre y la pregunta del final solo de vez en cuando.
- **Cómo recibirlo (abierto a sugerencias):**
  - **Evento de GA:** sirve para la valoración rápida 👍 / 👎 y contarla en los informes. No vale
    para texto libre (GA limita los textos y no permite datos personales) y solo llega si se
    aceptan las cookies.
  - **Evento o etiqueta de Clarity:** permite ver la grabación de la partida de quien opinó. Útil
    como complemento, pero no está pensado para leer mensajes y depende del consentimiento.
  - **Email (`mailto:`):** sin backend, pero abre la app de correo, deja visible la dirección y
    muchos no terminan de enviarlo.
  - **Formulario externo (Tally, Google Forms, Formspree):** rápido de montar y guarda las
    respuestas en una tabla; hay que abrir la CSP a ese servicio o enlazarlo en otra pestaña.
  - **Función propia en Vercel (`/api/feedback`):** formulario dentro del juego que guarda la idea
    o la manda por email (por ejemplo con Resend) o la crea como issue en GitHub para tenerla junto
    al roadmap. Es lo más integrado; necesita un token en el servidor y protección contra spam
    (límite de envíos y campo trampa).
  - **Propuesta:** 👍 / 👎 como evento de GA y el texto libre con la función de Vercel, que lo
    manda por email o como issue.
- **A tener en cuenta:** juegan niños, así que no pedir nombre ni email (o que sea opcional),
  avisar de para qué se usa y no guardar más de lo necesario.

### Tiempos por tablero según partidas reales (épica)

Ajustar el reloj de cada tablero con lo que pasa en partidas reales, no con una fórmula.

- **Hoy:** el tiempo por jugador sale de una fórmula (`timeFor` en `engine.js`): 4×4 1:30, 5×5
  2:00, 6×6 2:30, 7×7 3:00 y 8×8 4:00. Es el mismo con 1, 2 y 4 jugadores.
- **Objetivo:** que el **50 %** de las partidas terminen porque a alguien se le acaba el tiempo.
  El 50 % es un parámetro (por ejemplo `TIMEOUT_TARGET = 0.5`) en un solo sitio, para poder
  cambiarlo sin tocar el resto.
- **Telemetría (paso 1, hecho en 2.4.0):** un evento de GA al acabar cada partida (`game_end`) con:
  - tablero, número de jugadores, contra la máquina o no, y dificultad;
  - cómo terminó: tablero lleno, sin tiempo o abandonada (`game_start` sin `game_end`);
  - tiempo disponible, tiempo usado y tiempo sobrante de cada jugador, número de jugadas y
    versión del juego;
  - sin nombres ni datos personales.
  - **Ojo:** solo llega de quien acepta las cookies, así que la muestra puede estar sesgada.
- **Herramientas (paso 2):**
  - una exploración en GA4 con el porcentaje de partidas que terminan por tiempo en cada tablero;
  - un script en el repo (`scripts/`) que lea los datos (exportación o GA4 Data API) y proponga
    el tiempo de cada tablero para cumplir el objetivo. Con un objetivo del 50 %, la propuesta es
    aproximadamente la mediana del tiempo que necesita el jugador más lento para acabar.
- **Ajuste (paso 3):** pasar de la fórmula a una tabla de tiempos por tablero (y por modo, si
  hace falta). Solo se ajusta un tablero cuando tiene suficientes partidas (por ejemplo 100), y
  cada ajuste se publica como corrección con su entrada en el changelog.
- **Decisiones abiertas:** si el objetivo es el mismo para todos los tableros y modos (1, 2 y 4
  jugadores); si cuentan las partidas contra la máquina; y cada cuánto se revisa.

### Sonidos

**Hecho en 2.2.0.** Todo se genera en el navegador con Web Audio (sin archivos y sin abrir la CSP),
empieza encendido y a volumen suave:

- **Final de partida:** fanfarria si gana una persona (o varias), melodía neutra en el empate y
  melodía descendente si gana la Máquina.
- **Partida:** «tic» al poner letra, dos notas al formar OSO, doble pitido con 20 s (una vez por
  jugador y partida) y sonido de «fuera» con 4 jugadores.
- **Extras:** 💡, 👁️ y 🔄 con un sonido corto propio; 🛟 SOS con una sirena de ~1,5 s porque
  cambia las reglas.
- **Silencio:** botón 🔊 / 🔇 en la pantalla de inicio y «Sonido» en el menú ☰. Se recuerda en el
  dispositivo y silencia todo, también la fanfarria del easter egg.
- **Ideas:** ajustar volumen o quitar el «tic» si en casa resulta pesado.

### Compartir y boca-oreja (viralidad)

**Hecho en 2.6.0** (Boca-oreja): 📣 en el inicio, «📣 Invitar a jugar» en el menú ☰ y «📣 Compartir
resultado» en la pantalla final; tarjeta Open Graph (`public/og.png`, se regenera con
`npm run og`), evento `share` con `channel` y `place`, y `utm_campaign=boca_oreja`. Sin nombres.
Queda lo de «Más adelante».

Que corra la voz: que quien juega lo comparta fácilmente con familia y amigos.

- **Dónde:**
  - en la pantalla final, por ejemplo «¡He ganado 7 a 5 en OSO 🐻! ¿Me ganas? juegaoso.com»;
  - en la pantalla de inicio o en el pie, «Invita a alguien a jugar».
- **Cómo:**
  - en el móvil, el menú nativo de compartir (Web Share API), que ya incluye WhatsApp, Telegram,
    email…;
  - si no está disponible: botones de **WhatsApp** (`https://wa.me/?text=…`), **email**
    (`mailto:?subject=…&body=…`) y «Copiar enlace»;
  - sin SDKs ni botones de redes sociales, por la CSP y la privacidad de los niños.
- **Que el enlace se vea bonito:** hoy la web no tiene descripción ni metadatos Open Graph. Hay
  que añadir título, descripción e imagen (`og:image`) para que WhatsApp muestre una tarjeta con
  el oso.
- **Medir:** evento de GA `share` con el canal y enlaces con `utm_source` (`whatsapp`, `email`…)
  para saber cuántas visitas llegan por boca a boca.
- **Más adelante:** un enlace de reto («juega este tablero y este tema») o un código QR para
  enseñarlo en la tablet.
- **Decisiones abiertas:** si el texto incluye los nombres de los jugadores (por defecto no) y
  dónde sale el botón.

## Otras ideas y decisiones abiertas

- **Reloj con la pestaña dormida:** si se duerme la pestaña o el dispositivo, ese tiempo no se
  descuenta y funciona como una pausa gratis. Decidir si se mantiene así.
- **B06 · la máquina en Difícil no defiende:** se mantuvo a propósito; se puede mejorar si se
  quiere una máquina más dura (por ejemplo un nivel «Experto»).
- **Consentimiento de analítica:** hecho con un aviso Aceptar / Rechazar para GA y Clarity
  (`oso.consent.v1`). Revisar si hace falta una política de privacidad si el juego se abre al
  público general.
