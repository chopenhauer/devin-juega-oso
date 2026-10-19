# El reloj de cada tablero (5, 16, 24)

- **Estado:** Decidir el objetivo (24): **ahora (3.º)** · ajuste por tablero (5): con ~100 partidas por tablero
- **Grupo:** [Reglas y reloj](../ROADMAP.md#5-reglas-y-reloj)
- **Valor / esfuerzo** (estimados por Devin): Alto / Bajo a medio

Ajustar el reloj de cada tablero con lo que pasa en partidas reales, no con una fórmula.

- **Hoy:** el tiempo por jugador está en la tabla `board.seconds` de `config.js`: 4×4 1:00, 5×5 1:30, 6×6 2:00, 7×7 2:30 y 8×8 3:30. En la 3.6.0 se quitaron 30 s a todos porque solo un 6 % de las partidas acababa por tiempo. Es el mismo con 1, 2 y 4 jugadores.
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
  - Desde la 3.7.2, también cuántas veces se usó cada extra (`extras_hint`, `extras_last`,
    `extras_swap`, `extras_sos`), y un evento `extra_used` cada vez que se usa uno.
- **Herramientas (paso 2):**
  - una exploración en GA4 con el porcentaje de partidas que terminan por tiempo en cada tablero;
  - un script en el repo (`scripts/`) que lea los datos (exportación o GA4 Data API) y proponga
    el tiempo de cada tablero para cumplir el objetivo. Con un objetivo del 50 %, la propuesta es
    aproximadamente la mediana del tiempo que necesita el jugador más lento para acabar.
- **Ajuste (paso 3):** ~~pasar de la fórmula a una tabla~~ hecho en 3.3.1 (`board.seconds`). En la
  3.6.0 JoseLuis decidió quitar ya 30 s a todos sin esperar a los datos, para que la tensión con poco
  tiempo se vea. A partir de aquí, ajustar por tablero (y por modo, si hace falta). Solo se ajusta un tablero cuando tiene suficientes partidas (por ejemplo 100), y
  cada ajuste se publica como corrección con su entrada en el changelog.
- **Decisiones abiertas:** si el objetivo es el mismo para todos los tableros y modos (1, 2 y 4
  jugadores); si cuentan las partidas contra la máquina; y cada cuánto se revisa.

## Decidir el objetivo (24)

**El reloj (24):** solo 6 de 69 partidas acaban por tiempo (9 %) y el objetivo es el 50 %. O se
baja ya el 5×5 a 1:15, o se acepta que en familia gusta jugar sin prisa y se baja el objetivo.

- **Datos (17-10-2026):** 7 de 73 partidas acaban por tiempo (10 %).
- **Propuesta de Devin:** bajar el objetivo del 50 % a un 20-25 %, porque en familia se juega sin
  prisa.
- **Datos (19-10-2026):** 10 de 89 partidas acaban por tiempo (11 %), pero 4 de 19 (21 %) en las
  últimas 72 h.
- **Decidido (JoseLuis, 19-10-2026):** cada OSO da la mitad de tiempo, 5 s en vez de 10
  (`clock.bonusSeconds`, en la 4.3.0). Con menos tiempo extra, más partidas deberían acabar por
  tiempo. Revisar el porcentaje en una o dos semanas antes de tocar los relojes de cada tablero.

## Reloj con la pestaña dormida (16)

**Reloj con la pestaña dormida:** si se duerme la pestaña o el dispositivo, ese tiempo no se
descuenta y funciona como una pausa gratis. Decidir si se mantiene así.
