# Puntos extra por racha de OSO (27)

- **Estado:** Idea · Futuro. Las rachas ya se miden y desempatan en la 4.0.0 (ver abajo)
- **Grupo:** [Reglas y reloj](../ROADMAP.md#5-reglas-y-reloj)
- **Valor / esfuerzo** (estimados por Devin): Medio-alto / Medio

**Puntos extra por racha (27):** premiar que se insista en puntuar. Hacer OSO ya da otro turno;
la idea es que cada OSO seguido valga más que el anterior y así se vayan bonificando las
partidas. Dos opciones, sin decidir:

- **Bonificación fija:** a partir del segundo OSO de la racha, cada uno vale 1 punto más (1, 2,
  2, 2…).
- **Bonificación creciente:** cada OSO de la racha vale 1 más que el anterior (1, 2, 3, 4…).
  Ojo: esto crece de forma lineal; exponencial sería duplicar (1, 2, 4, 8…). Buen experimento
  para el Laboratorio de Julia (25): simular partidas con cada opción y ver cuál las hace más
  reñidas.
- **Por decidir:** qué es una racha (OSOs seguidos en el mismo turno o en turnos seguidos), si
  un movimiento que hace dos OSO a la vez cuenta como racha, si es opcional al elegir tablero y
  cómo se ve en el marcador y en «Ver la partida». Toca `engine.js` y `match.js`, el servidor en
  línea, la máquina (que tendría que valorar las rachas) y la telemetría.

## Hecho en la 4.0.0: las rachas desempatan

Primer paso, sin puntos extra: cada OSO sigue valiendo 1 y las rachas solo deciden los empates.

- **Qué es una racha:** las jugadas seguidas de un mismo turno que hacen OSO (o SOS). Se acaba
  cuando ese jugador pone una letra sin puntuar. Una jugada que hace 2 OSO a la vez es una sola
  jugada de la racha. Un 🔄 nunca cuenta y la corta. Con 🛟 se recalculan con el historial y la
  palabra del momento, igual que los puntos.
- **Orden:** puntos → racha más larga (jugadas) → número de rachas (turnos con algún OSO). Si todo
  coincide, empate. Con 4 jugadores, solo entre los que empatan en cabeza. Por tiempo o abandono no
  cambia nada.
- **Descartado:** «más OSO en una sola racha» como tercer criterio (JoseLuis, 18-10-2026): se
  parecía demasiado a la racha más larga.
- **Dónde se ve:** la tabla «Esta partida» de la pantalla final y el texto del resultado. En el
  marcador de la partida no, para no cargarlo.
- **Código:** `streaks()` y `standing()` en `match.js` (los usa también el servidor en línea);
  `tiebreak` en la partida y en `game_end`.
- **Lo que queda de esta idea:** los puntos extra por racha. Ya hay con qué medirla: con
  `tiebreak` en GA4 sabremos cuántos empates hay y cuántos deciden las rachas.
