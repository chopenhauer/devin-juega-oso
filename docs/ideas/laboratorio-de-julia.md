# Laboratorio de Julia (25)

- **Estado:** primera versión en 3.18.0 (`/lab`)
- **Grupo:** [Contra la máquina](../ROADMAP.md#1-contra-la-máquina)
- **Valor / esfuerzo** (estimados por Devin): Medio / Medio

**Laboratorio de Julia (25):** una página o un script para cambiar los valores de la máquina
(el 50 %, el 80 %…), simular cientos de partidas y ver en una gráfica cuánto gana cada nivel.
Hipótesis, experimento y datos; también sirve para revisar los niveles (19).

- **También sirve para:** probar las rachas ([27](rachas.md)) antes de cambiar las reglas.

## Qué hay en la 3.18.0

- **Dónde:** `juegaoso.com/lab`, sin enlaces y con `noindex`. Contraseña en Vercel (`LAB_PASSWORD`),
  cookie de 30 días e intentos limitados.
- **Parámetros:** `machine.easyAim`, `machine.hardAim`, `machine.pool` y `board.seconds.4`…`8`, cada
  uno con su mínimo y su máximo (`public/js/tuning.js`). El servidor rechaza lo que se salga.
- **Decisión de JoseLuis:** lo guardado se aplica al momento para todo el mundo, también en el árbitro
  en línea, sin pasar por el código. Por eso hay «Volver al valor anterior», «Valores de fábrica» y,
  si el servidor falla, el juego usa `config.js`.
- **Simulador:** 150 partidas en 5×5 contra la máquina en Fácil, con jugadores de práctica que ven el
  20 %, el 50 % o el 80 % de los OSO (`public/js/lab-sim.js`). Compara el valor de ahora con el que se
  prueba.
- **Partidas de verdad:** GA4 de los últimos 90 días agrupado por `lab_version` (`/api/lab-data`):
  quién gana en cada dificultad y cuántas partidas acaban por tiempo.
- **Cuaderno:** cada guardado con su número, fecha, qué cambió (de → a), la nota de Julia y si fue
  un cambio, un «volver atrás» o los valores de fábrica. Se guarda en Redis (`lab:config`).

## Por decidir

- El simulador no usa el reloj: para el reloj solo sirven los datos de verdad.
- Más parámetros si a Julia le gusta: precios de la tienda secreta y tiempo extra por OSO.
