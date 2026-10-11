# Parámetros del juego

<!-- Generado por `npm run config` a partir de public/js/config.js: no lo edites a mano. -->

Todo lo que se puede ajustar como director del juego está en
[`public/js/config.js`](../public/js/config.js). Cambiar un valor ahí lo cambia en el juego, en el
servidor de salas en línea y en los textos que lo mencionan (reglas, avisos, el secreto del 🎨 y el
selector de tableros).

Cómo cambiar uno:

1. Edita el valor en `public/js/config.js` (si añades uno nuevo, explícalo también en `HELP`).
2. `npm run config` para regenerar esta tabla y `npm test` para comprobar que los valores tienen
   sentido.
3. Rama, preview y «publica», como siempre. Anótalo en el CHANGELOG (suele ser un PATCH).

## Tableros y tiempos

| Parámetro | Valor | Qué hace |
| --- | --- | --- |
| `board.seconds` | 4×4 1:00 · 5×5 1:30 · 6×6 2:00 · 7×7 2:30 · 8×8 3:30 | Tableros que se pueden elegir y segundos de reloj de cada jugador en cada uno. Añadir o quitar un tamaño cambia el selector y lo que acepta el servidor. Más tiempo = partidas más largas y menos finales por tiempo. |
| `board.defaultSize` | 5 | Tablero que sale elegido la primera vez (después se recuerda el último). |
| `board.fourPlayersMinSize` | 6 | Tablero mínimo con 4 jugadores; los más pequeños se desactivan. |

## Reloj

| Parámetro | Valor | Qué hace |
| --- | --- | --- |
| `clock.bonusSeconds` | 10 | Segundos que gana quien forma un OSO (por cada uno). Más = partidas más largas y premia más puntuar. |
| `clock.lowSeconds` | 20 | Con este tiempo o menos el reloj se pone en aviso y suena, el fondo se va tiñendo de rojo y late (tensión), y en línea se anima a quien espera. |

## Extras (usos por jugador y partida)

| Parámetro | Valor | Qué hace |
| --- | --- | --- |
| `extras.hint` | 1 | 💡 Pistas por jugador y partida. 0 = desactivada. |
| `extras.last` | 1 | 👁️ Ver la última jugada del rival, por jugador y partida. 0 = desactivada. |
| `extras.swap` | 1 | 🔄 Cambiar una O por una S (o al revés), por jugador y partida. 0 = desactivado. |

## 🛟 SOS

| Parámetro | Valor | Qué hace |
| --- | --- | --- |
| `sos.flashMs` | 900 | Lo que dura el aviso «SOS» antes de repetir la partida. El reloj espera mientras tanto. |
| `sos.pauseMs` | 220 | Pausa entre el aviso y la repetición. |
| `sos.moveMs` | 260 | Lo que tarda en repetirse cada jugada. Más = repetición más lenta y fácil de seguir. |

## 🛒 Tienda secreta (comprar extras gastados)

| Parámetro | Valor | Qué hace |
| --- | --- | --- |
| `shop.taps` | 3 | Toques seguidos en un 💡, 🔄 o 🛟 ya gastado para abrir la tienda (el texto del secreto se ajusta solo). |
| `shop.tapGapMs` | 700 | Tiempo máximo entre dos toques para que cuenten como seguidos. |
| `shop.hintSeconds` | 10 | Segundos del propio reloj que cuesta otra 💡 pista. Se puede comprar mientras queden segundos. |
| `shop.swapSeconds` | 10 | Segundos que cuesta otro 🔄 cambio de letra. |
| `shop.sosSeconds` | 30 | Segundos que cuesta otro 🛟 SOS. Al usarlo, la partida cambia de OSO a SOS (o vuelve) para todo el mundo. |

## Máquina

| Parámetro | Valor | Qué hace |
| --- | --- | --- |
| `machine.delayMs` | 650 | Lo que «piensa» la máquina antes de mover. Menos = más ágil pero menos natural. |
| `machine.easyScoreChance` | 0.7 | En fácil, probabilidad (0 a 1) de que aproveche un OSO que tiene a mano. Más = máquina fácil más difícil. |
| `machine.easyPool` | 6 | En fácil, entre cuántas buenas jugadas elige al azar cuando no puntúa. Más = más despistada. |

## En línea

| Parámetro | Valor | Qué hace |
| --- | --- | --- |
| `online.closeAfterMinutes` | 30 | Si la partida no empieza en estos minutos desde que se abre la sala, se cierra. |
| `online.countdownSeconds` | 3 | Cuenta atrás «3, 2, 1…» en las dos pantallas antes de la primera jugada. |
| `online.nudgeSeconds` | 20 | Sin mover este tiempo, sale «¿Sigues ahí?» y se anima a quien espera. |
| `online.pollMs` | 1000 | Cada cuánto pregunta el juego al servidor. Menos = más rápido pero más peticiones. |
| `online.roomsPerConnection` | 20 | Salas que puede abrir una misma conexión en la ventana de abajo (anti-abuso). |
| `online.roomsWindowMinutes` | 10 | Ventana del límite anterior. |
| `online.roomHours` | 24 | Horas que se guarda una sala con partida empezada (para revanchas y reconexión). |
| `online.closedRoomHours` | 1 | Horas que se guarda una sala cerrada, para avisar a quien abra el enlace viejo. |

## Secretos

| Parámetro | Valor | Qué hace |
| --- | --- | --- |
| `secrets.gamesPerSecret` | 2 | Partidas terminadas (cualquier modo y resultado) para cada secreto nuevo; como mucho 1 al día. |

## Temas y easter egg del 🎨

| Parámetro | Valor | Qué hace |
| --- | --- | --- |
| `themes.eggTaps` | 6 | Pulsaciones seguidas en 🎨 para descubrir todos los temas (el texto del secreto se ajusta solo). |
| `themes.eggTapGapMs` | 700 | Tiempo máximo entre dos pulsaciones para que cuenten como seguidas. |
| `themes.eggWindowMs` | 3000 | Tiempo máximo para hacer todas las pulsaciones. |
| `themes.eggPartyMs` | 3600 | Lo que dura la lluvia de huevos al descubrirlo. |
| `themes.festivalDays` | 31 | Días antes y después de una fiesta en que su tema sale en el menú 🎨. |
| `themes.menuMax` | 5 | Temas como máximo en el menú 🎨 (contando el clásico). |
| `themes.listMax` | 10 | Temas como máximo contando también «Ver otros». |

## Encuesta «¿Os está gustando OSO?»

| Parámetro | Valor | Qué hace |
| --- | --- | --- |
| `feedback.streak` | 3 | Se pregunta cada este número de partidas seguidas en la misma sesión. |
| `feedback.cooldown` | 5 | Partidas mínimas entre dos preguntas. |

## Medición

| Parámetro | Valor | Qué hace |
| --- | --- | --- |
| `telemetry.timeoutTarget` | 0.5 | Objetivo (0 a 1) de partidas que acaban por tiempo; sirve para ajustar los tiempos con datos. |

## Sonido

| Parámetro | Valor | Qué hace |
| --- | --- | --- |
| `sound.volume` | 0.16 | Volumen general de los sonidos (0 a 1). |

## Pantalla (técnico)

| Parámetro | Valor | Qué hace |
| --- | --- | --- |
| `screen.fourMinWidth` | 700 | Ancho mínimo de pantalla (px) para ofrecer 4 jugadores. |
| `screen.fourMinHeight` | 600 | Alto mínimo de pantalla (px) para ofrecer 4 jugadores. |
| `screen.swipePx` | 40 | Distancia (px) que hay que deslizar el dedo para pasar de regla en «Cómo se juega». |
| `screen.keyboardMinPx` | 100 | Altura (px) a partir de la que se considera que el teclado del móvil tapa la pantalla. |
