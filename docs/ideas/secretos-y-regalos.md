# Secretos y regalos desbloqueables (2, 17)

- **Estado:** Secretos hechos en 3.3.0 y 3.4.0 · Secreto n.º 3 (2): cuando Julia quiera · Regalos (17): sin plan
- **Grupo:** [Llegar, volver y compartir](../ROADMAP.md#4-llegar-volver-y-compartir)
- **Valor / esfuerzo** (estimados por Devin): Medio / Bajo a medio

**Primer paso hecho en 3.3.0: los secretos.** Cada 2 partidas (máximo uno al día) se cuenta cómo
activar una función escondida (ver `public/js/secrets.js` y el CHANGELOG). Para añadir un secreto
nuevo basta una entrada al final de `SECRETS`: una buena tarea para Julia es inventar el
siguiente. En 3.4.0 llegó el 2.º, la tienda secreta (comprar extras gastados con segundos). Lo de desbloquear regalos de verdad sigue siendo solo idea:

Pequeños regalos que se desbloquean jugando (por ejemplo al ganar, al formar varios OSO seguidos
o al completar partidas): avatares nuevos, temas o skins (como el marino del SOS), fichas
especiales o un extra adicional en la siguiente partida.

- **A decidir:** qué se desbloquea, con qué logro, si es por jugador o por dispositivo y si los
  regalos dan ventaja en la partida o son solo cosméticos.
- **Guardado:** en `localStorage`, igual que las preferencias y el hall of fame local.
