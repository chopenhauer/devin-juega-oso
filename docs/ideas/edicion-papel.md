# Edición papel (18)

- **Estado:** Idea loca · Futuro
- **Grupo:** [Reglas y reloj](../ROADMAP.md#5-reglas-y-reloj)
- **Valor / esfuerzo** (estimados por Devin): Alto / Alto

Un modo aparte, «edición superespecial», que parezca jugar en una hoja de cuaderno: cuadrícula
dibujada a mano, sin fichas, y la S o la O se escriben con el dedo.

- **Cómo se siente:** el trazo sale primero tal cual lo haces y, al soltar, se convierte en una S o
  una O «pasada a limpio» (un trazo más firme o más fino y menos tembloroso, como si se repasara a
  boli). Los OSOs se tachan con una raya hecha a mano en lugar de colorearse.
- **Técnica:** la cuadrícula y el trazo van en un `<canvas>` o SVG encima del tablero, sin
  dependencias. Para saber si has escrito S u O basta una regla sencilla: la O se cierra sobre sí
  misma y la S cambia de curva. Si no está claro, se pregunta con los dos botones S/O de siempre.
  La lógica de la partida no cambia: el trazo acaba en la misma jugada `place` de `match.js`.
- **Accesibilidad:** tocar la casilla y elegir S/O tiene que seguir funcionando (teclado, lectores
  de pantalla y quien no quiera dibujar). Con «reducir movimiento», la letra se pasa a limpio sin
  animación.
- **Mobile first:** pensado para el dedo en el móvil; en iPad, con dedo o lápiz; en escritorio, con
  el ratón o con el toque de siempre.
- **Medición:** cuántas partidas se juegan en papel y cuántas letras se reconocen a la primera o
  hay que corregir.
- **Decidido:** es un modo aparte, una «edición superespecial» que cambia la dinámica pero
  reutiliza las reglas y los componentes (`engine.js`, `match.js`). Se entraría por un enlace
  propio o de otra forma por decidir. Es una idea loca, para más adelante.
- **Por decidir:** cómo se llega a ella y si en línea el rival ve tu letra tal cual o ya pasada a
  limpio.
