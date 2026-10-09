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
- Temas de temporada Halloween y Navidad, con el botón 🎨 visible hasta «¿Cómo queréis jugar?».
- Pantalla «¿Cómo queréis jugar?» con cabecera OSO, selector 1 · 2 · 4 jugadores y navegación
  simple («Siguiente», «Cómo se juega» y ❓); tarjeta «Máquina» con robots de dificultad (1.9.0).
- Versión en el pie y [`CHANGELOG.md`](../CHANGELOG.md) con las mejoras y decisiones de cada versión.
- Modo 4 jugadores (2.0.0) y marcador de la sesión contra la máquina desde la primera partida.
- Vista de 4 jugadores en el ordenador (2.0.1): en «Misma vista», tablero a la izquierda y las 4
  tarjetas apiladas a la derecha; en tablet, «Enfrentados» por defecto.

## Priorización (octubre 2026)

Orden propuesto por valor y esfuerzo, estimados por Devin; se revisa cuando lleguen opiniones de
los jugadores.

| #   | Idea                                                            | Valor      | Esfuerzo      | Por qué                                                          |
| --- | --------------------------------------------------------------- | ---------- | ------------- | ---------------------------------------------------------------- |
| 1   | Política de privacidad                                          | Alto       | Bajo          | juegaoso.com es pública y juegan niños con GA y Clarity          |
| 2   | Proteger `main` (solo publicar con el CI en verde)              | Medio      | Muy bajo      | Lo activa el dueño del repo en GitHub                            |
| 3   | Feedback rápido 👍/👎 (evento de GA) e «💡 Ideas» en el menú ☰ | Alto       | Bajo          | Saber qué gusta                                                  |
| 4   | Temas que se activan solos según la fecha                       | Alto       | Bajo          | Idea de Julia; Halloween y Navidad ya existen                    |
| 5   | Tensión con poco tiempo (T4.3)                                  | Medio-alto | Bajo          | Más emoción con poco trabajo                                     |
| 6   | Hall of fame local                                              | Alto       | Medio         | Récords y rachas en el dispositivo, sin servidor                 |
| 7   | Más temas de temporada (Año Nuevo y Reyes primero)              | Alto       | Bajo cada uno | 11 pendientes; se hacen según se acerque cada fecha              |
| 8   | Feedback con texto libre (función de Vercel → email o issue)    | Alto       | Medio         | Backend pequeño con protección contra spam                       |
| 9   | Equipos 2 contra 2 (3.0.0)                                      | Medio      | Medio         | Faltan decisiones: compañeros, turnos y extras                   |
| 10  | Oso bailando al ganar (T4.5)                                    | Medio      | Medio-alto    | Necesita arte nuevo                                              |
| 11  | Máquina «Experto» (B06)                                         | Medio      | Medio         | Solo si Difícil se queda corta                                   |
| 12  | Modo Mercado / tiempo por ayudas (T4.6–T4.7)                    | Medio      | Alto          | Cambia las reglas; faltan costes y límites                       |
| 13  | Hall of fame global                                             | Medio      | Alto          | Servidor, protección contra trampas y privacidad de menores      |
| 14  | Vibración (T4.4)                                                | Bajo       | Bajo          | Solo en Android                                                  |
| 15  | Reloj con la pestaña dormida                                    | Bajo       | Bajo          | Decisión pendiente; hoy funciona como una pausa                  |
| 16  | Regalos desbloqueables                                          | —          | Medio         | Solo idea, sin planificar (JoseLuis no quiere hacerlo por ahora) |

**Agrupación propuesta:** 1–5 como versión 2.1.0; hall of fame (6) como 2.2.0; los
temas (7) según el calendario; Mercado, equipos y ranking global (12, 9 y 13) cuando el feedback
diga que se quieren.

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

**Por hacer** (las fiestas de San Patricio a Acción de Gracias, las épocas y los lugares son ideas de los niños):

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
| Cumpleaños de Julia    | Su fecha                           | 🎂 🎈 🎁 🥳; tarta, globos y confeti extra (la fecha solo en el dispositivo).              |

#### Menú de temas por fechas (idea de los niños)

Con tantos temas, el menú 🎨 no puede enseñarlos todos. Propuesta:

- **Menú:** como máximo 5 temas: siempre el Clásico y los que tengan su fecha cerca (de un mes
  antes a un mes después; por ejemplo San Fermín del 7 de junio al 7 de agosto).
- **Por defecto:** el Clásico, salvo el mismo día de la fiesta, que se pone ese tema solo (San
  Valentín el 14 de febrero, San Fermín el 7 de julio).
- **«Ver otros»:** despliega más temas, hasta 10 en total contando los del menú. El resto del año
  los temas de fiesta quedan ahí.
- **Easter egg:** pulsar el 🎨 más de 5 veces seguidas enseña todos los temas, aunque sean más de 10.
- **Tipos de tema:** fiestas (con día), épocas del año (con periodo) y lugares (todo el año).

- **Pendiente:** activar el tema solo según la fecha del dispositivo (con el selector para
  volver al clásico), fichas y tablero con decoración del tema, y que el tema marino del SOS
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
