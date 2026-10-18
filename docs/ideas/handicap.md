# Hándicap y categorías (28)

- **Estado:** Medallas hechas en 4.1.0 · Hándicap jugable: futuro
- **Grupo:** [Reglas y reloj](../ROADMAP.md#5-reglas-y-reloj)
- **Valor / esfuerzo** (estimados por Devin): Medio / Medio-alto

**Hándicap y categorías (28):** poder jugar «dentro de tu categoría». El juego te asigna una
categoría según cómo juegas y, si juegan dos de categorías distintas, el más fuerte da ventaja,
como el hándicap del golf.

- **Posibles ventajas:** puntos de salida, más tiempo en el reloj, extras gratis o una máquina
  que se ajusta sola a tu categoría.
- **Por decidir:** cómo se calcula la categoría sin cuentas ni datos personales (solo en el
  dispositivo, a partir de partidas y resultados, como el hall of fame local (3)), cuántas
  categorías hay y cómo se comparte en línea y en los enlaces de reto (20).

## Lo decidido (4.1.0)

- **Cálculo:** puntos de rango tipo Elo, solo en el dispositivo y por nombre. Se empieza con 900 y
  la máquina tiene un rango fijo (fácil 800, difícil 1200, extremo 1600) que sirve de vara de medir.
  Con 4 jugadores cada uno se compara con los otros tres. Los valores están en `config.js` (`rank.*`)
  y la lógica en `public/js/rank.js`.
- **Categorías:** sin medalla hasta la 5.ª partida o por debajo de 1000; 🥉 Bronce desde 1000, 🥈
  Plata desde 1200 y 🥇 Oro desde 1400.
- **Cómo se ve:** medalla en la esquina del avatar (JoseLuis eligió la opción C del boceto frente a
  cambiar el borde o un doble borde). Sale en «¿Quién juega?», en la partida y en «Esta partida», y
  al subir: «¡Julia sube a Plata! 🥈».
- **La medalla nunca baja**, aunque bajen los puntos.
- **Sin ventajas por ahora:** solo status.

## Pendiente

- **Hándicap jugable:** qué ventaja da cada categoría de diferencia (punto de salida, segundos de
  reloj o un 💡 extra) y si es opcional («Con hándicap»).
- **En línea:** hoy los puntos del rival se fían de lo que manda su dispositivo, porque no dan
  ventaja. Con hándicap habría que pensarlo mejor.
- **Retos (20):** la medalla aún no viaja en los enlaces de reto.
