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

Partidas de cuatro en el mismo dispositivo, por turnos.

- **Reglas:** el turno rota 1 → 2 → 3 → 4; formar OSO da punto y repites turno, igual que ahora.
  Cada jugador con su reloj y sus extras.
- **Tablero:** con cuatro se llena antes; probablemente mínimo 6 × 6 y tiempo inicial ajustado.
- **Configuración:** nuevo modo «4 jugadores» en el paso Modo; cuatro avatares exclusivos y cuatro
  nombres (≤ 16 caracteres, por defecto «Jugador N»).
- **Pantalla:** un panel por jugador; en tablet, uno en cada lado del dispositivo (vista
  enfrentada a 4 bandas). En móvil, marcador compacto con los cuatro y el panel del turno actual
  destacado.
- **Motor:** `engine.js` hoy asume dos jugadores (puntos y extras por índice 0/1, «el otro
  jugador»); hay que generalizarlo a N jugadores con tests.
- **A decidir:** ¿equipos 2 contra 2 o todos contra todos? ¿Pueden ser máquinas algunos jugadores?
  ¿Cómo funciona OSO→SOS y «ver la jugada rival» con varios rivales?

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

| Tema                | Fechas (orientativas) | Ideas                                                                                                             |
| ------------------- | --------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Halloween           | 15 oct – 2 nov        | Osos disfrazados (bruja, vampiro, fantasma), calabazas, murciélagos y telarañas; fondo naranja y morado.          |
| Navidad             | 1 dic – 6 ene         | Nieve cayendo, gorro de Papá Noel para los osos, luces y regalos bajo el tablero; victoria con lluvia de regalos. |
| Año Nuevo           | 31 dic – 1 ene        | Fuegos artificiales al ganar, serpentinas y las 12 uvas como cuenta atrás en el reloj.                            |
| San Valentín        | 7 – 14 feb            | Corazones flotando, fichas en rosa y rojo, osos con lazos.                                                        |
| Carnaval            | Semana de carnaval    | Osos con antifaz y confeti de colores.                                                                            |
| Primavera           | Mar – may             | Flores, mariposas y tonos verdes suaves.                                                                          |
| Verano              | Jul – ago             | Escenario de playa: arena, sol, olas y osos con gafas de sol y flotador.                                          |
| Otoño               | Sep – nov             | Hojas cayendo y tonos ocres.                                                                                      |
| Cumpleaños de Julia | Su fecha              | Tarta, globos y confeti extra (la fecha se guardaría solo en el dispositivo).                                     |

- **Cosas temáticas:** además del fondo y los colores, pequeños elementos por tema (una calabaza en
  Halloween, regalos en Navidad, una sombrilla en verano), por ejemplo en las fichas, el tablero o
  la pantalla de victoria.
- **Cómo se activa:** automáticamente según la fecha del dispositivo, con un ajuste para elegir el
  tema a mano o volver al clásico.
- **Técnica:** una clase en `body` por tema (como `sea-theme` del SOS) con variables CSS y dibujos
  SVG o emoji propios, sin recursos externos para respetar la CSP. Animaciones suaves y quietas
  con «reducir movimiento».
- **A decidir:** si las cosas temáticas son solo decoración o cambian algo de la partida, y cómo
  convive cada tema con el tema marino del extra OSO→SOS.

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

## Otras ideas y decisiones abiertas

- **Reloj con la pestaña dormida:** si se duerme la pestaña o el dispositivo, ese tiempo no se
  descuenta y funciona como una pausa gratis. Decidir si se mantiene así.
- **B06 · la máquina en Difícil no defiende:** se mantuvo a propósito; se puede mejorar si se
  quiere una máquina más dura (por ejemplo un nivel «Experto»).
- **Proteger `main` en GitHub** para que solo se publique con el CI en verde (lo activa el dueño
  del repo).
- **Consentimiento de analítica:** Clarity se carga siempre, sin aviso, por decisión expresa.
  Revisar si el juego se abre al público general.
