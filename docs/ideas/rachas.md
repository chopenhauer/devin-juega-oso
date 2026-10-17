# Puntos extra por racha de OSO (27)

- **Estado:** Idea · Futuro
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
