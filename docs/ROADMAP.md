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

## Roadmap F4 (pendiente)

| Tarea | Idea                            | Esfuerzo   | Notas                                                                                                                        |
| ----- | ------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------- |
| T4.2  | Diseño por dispositivo          | Medio      | Móvil en una columna; iPad y escritorio con tablero grande y paneles a los lados. Diseñar primero iPad.                      |
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

## Otras ideas y decisiones abiertas

- **Reloj con la pestaña dormida:** si se duerme la pestaña o el dispositivo, ese tiempo no se
  descuenta y funciona como una pausa gratis. Decidir si se mantiene así.
- **B06 · la máquina en Difícil no defiende:** se mantuvo a propósito; se puede mejorar si se
  quiere una máquina más dura (por ejemplo un nivel «Experto»).
- **Proteger `main` en GitHub** para que solo se publique con el CI en verde (lo activa el dueño
  del repo).
- **Consentimiento de analítica:** Clarity se carga siempre, sin aviso, por decisión expresa.
  Revisar si el juego se abre al público general.
