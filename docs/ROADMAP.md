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
- Analítica con Microsoft Clarity.
- Tema marino con olas suaves al activar el extra OSO→SOS.
- Créditos en el pie de las pantallas de inicio: «Hecho por Julia y JoseLuis — Vilarequi — con amor».
- T4.2 fase 1: escritorio e iPad con 1 y 2 jugadores. En horizontal, tablero grande en el centro y
  paneles a los lados (girados hacia cada jugador en _Enfrentados_); en iPad vertical, tablero más
  grande y paneles de una fila arriba y abajo.
- Marcador de la sesión: al acabar cada partida se suman victorias y puntos mientras jueguen los mismos jugadores
  (se reinicia al cambiar nombres, avatares, modo o dificultad; no al cambiar de tablero). Final con «Revancha»,
  «Otro tablero» y «Cambiar jugadores».
- Menú por jugador: un ☰ en el panel de cada jugador; el menú se abre girado hacia quien lo pulsa.
- Fichas que se arrastran: la letra elegida tiene el color de las fichas del tablero, la otra se ve
  tenue, y un dedo animado indica que se puede arrastrar hasta el primer arrastre.

## Roadmap F4 (pendiente)

| Tarea | Idea                            | Esfuerzo   | Notas                                                                                                                        |
| ----- | ------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------- |
| T4.2  | Diseño por dispositivo          | Medio      | Fase 1 hecha (1 y 2 jugadores). Fase 2: diseños de 4 jugadores, junto con el modo 4 jugadores.                               |
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

Partidas de cuatro personas en el mismo dispositivo, por turnos. Reglas decididas con JoseLuis:

- **Turnos:** rotan 1 → 2 → 3 → 4; formar OSO da punto y repites turno, igual que ahora.
- **Competición:** todos contra todos; gana quien tenga más puntos y, si hay empate en cabeza,
  comparten la victoria.
- **Jugadores:** solo personas (sin máquinas), cada una con nombre, avatar exclusivo y color.
- **Tablero y reloj:** se elige entre 6 × 6, 7 × 7 y 8 × 8, con el mismo reloj que con 2 jugadores
  en ese tablero (2:30, 3:00 y 4:00 por jugador).
- **Extras:** cada jugador tiene 💡, 👁️ y 🔄 una vez. 👁️ marca la última jugada del rival anterior
  (la casilla más reciente de cualquiera de los otros tres). 🛟 (OSO → SOS) sigue siendo una sola vez
  por partida, para quien lo use primero.
- **Dispositivos:** tablet y ordenador, con un panel a cada lado del tablero. En «Enfrentados»
  cada panel mira hacia su lado; en «Misma vista» todos quedan derechos. En móvil, «4 jugadores»
  sale desactivado con la nota «En tablet u ordenador».
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

**Por hacer:**

| Tema                | Fechas (orientativas) | Avatares e ideas                                                                           |
| ------------------- | --------------------- | ------------------------------------------------------------------------------------------ |
| Año Nuevo           | 31 dic – 1 ene        | 🎆 🥂 🍇 🕛 🎉 🥳; fuegos artificiales al ganar y las 12 uvas como cuenta atrás del reloj. |
| Reyes Magos         | 5 – 6 ene             | 👑 🐪 🎁 ⭐ 🍰; roscón y estrella de Oriente.                                              |
| San Valentín        | 7 – 14 feb            | 💘 🌹 💌 🧸 🍫 🦢; corazones flotando y fichas en rosa y rojo.                             |
| Carnaval            | Semana de carnaval    | 🎭 🤡 🦸 🧚 🦹 🎊; antifaces y confeti.                                                    |
| Pascua / primavera  | Mar – may             | 🐰 🐣 🥚 🌷 🦋 🐝; flores, mariposas y tonos verdes suaves.                                |
| Verano en la playa  | Jul – ago             | 🏖️ 🦀 🐠 🐬 🍉 🍦 🕶️; arena, sol, sombrilla y osos con gafas.                              |
| Otoño               | Sep – nov             | 🍂 🦔 🐿️ 🍄 🌰 🦉; hojas cayendo y tonos ocres.                                            |
| Espacio             | Todo el año           | 🚀 👽 🪐 🛸 👩‍🚀 🌙; estrellas fugaces y planetas.                                           |
| Dinosaurios         | Todo el año           | 🦖 🦕 🌋 🥚 🌿 🦴; volcán y selva prehistórica.                                            |
| Piratas             | Todo el año           | 🏴‍☠️ 🦜 💰 🗺️ ⚓ 🦈; mapa del tesoro (ojo: no mezclar con el tema marino del SOS).           |
| Cumpleaños de Julia | Su fecha              | 🎂 🎈 🎁 🥳; tarta, globos y confeti extra (la fecha solo en el dispositivo).              |

- **Pendiente:** activar el tema solo según la fecha del dispositivo (con el selector para
  volver al clásico), fichas y tablero con decoración del tema, y que el tema marino del SOS
  sustituya o se mezcle con el de temporada (hoy lo sustituye mientras dura).
- **Técnica:** `data-theme` en `body` con variables CSS, dibujos SVG en línea y emoji, sin recursos
  externos para respetar la CSP. Animaciones suaves y quietas con «reducir movimiento».

### Regalos y extras desbloqueables

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

## Otras ideas y decisiones abiertas

- **Reloj con la pestaña dormida:** si se duerme la pestaña o el dispositivo, ese tiempo no se
  descuenta y funciona como una pausa gratis. Decidir si se mantiene así.
- **B06 · la máquina en Difícil no defiende:** se mantuvo a propósito; se puede mejorar si se
  quiere una máquina más dura (por ejemplo un nivel «Experto»).
- **Proteger `main` en GitHub** para que solo se publique con el CI en verde (lo activa el dueño
  del repo).
- **Consentimiento de analítica:** hecho con un aviso Aceptar / Rechazar para GA y Clarity
  (`oso.consent.v1`). Revisar si hace falta una política de privacidad si el juego se abre al
  público general.
