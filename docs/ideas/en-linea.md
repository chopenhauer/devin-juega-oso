# Más allá del 1 contra 1 en línea (4, 6, 11)

- **Estado:** Ideas por decidir
- **Grupo:** [En línea](../ROADMAP.md#3-en-línea)
- **Valor / esfuerzo** (estimados por Devin): Medio / Medio a alto

El juego en línea 1 contra 1 está hecho (3.0.0) y mejorado en la 3.5.0 (invitación y avisos del
rival) y la 3.10.0 (contra la máquina mientras llega el rival). La decisión de arquitectura, los
contadores y los umbrales para revisarla están en [`ONLINE.md`](../ONLINE.md).

- **Revisar la decisión del modo en línea (6):** con los umbrales de `ONLINE.md` (50 partidas o 2
  meses) y el embudo de `npm run online:report`.
- **Volver a jugar con la misma persona otro día (4):** sin pedir un enlace nuevo. Por decidir cómo
  se recuerda al rival sin cuentas ni datos personales.
- **En línea con 4 jugadores o espectadores (11):** necesita la opción C de `ONLINE.md`. En reserva.
