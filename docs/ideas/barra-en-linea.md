# Barra de juego en línea: reacciones y 🍅 tomatada (1)

- **Estado:** Idea · Siguiente
- **Grupo:** [En línea](../ROADMAP.md#3-en-línea)
- **Valor / esfuerzo** (estimados por Devin): Medio / Medio

Reinterpretar la barra de extras cuando juegas en línea. Como no estáis juntos, apetece
comunicarse, dar ambiente y también hacer alguna trastada que en persona no tendría gracia. Junta
dos ideas: las reacciones y la tomatada.

**Reacciones o frases**

- **Para qué:** dar ambiente, mostrar cómo te sientes con la partida (como las reacciones de Google
  Meet) y, de paso, distraer al rival.
- **Dos opciones, por decidir:**
  - **Emojis de ánimo:** una fila corta y fija (😠 😅 😮 👏 🔥…).
  - **Frases cortas:** «¡Guau, vaya remontada!», «Esta va a ser tu partida final», «Oye, no me
    machaques». Pueden ser fijas o salir según cómo vaya la partida (vas ganando, te remontan,
    queda poco tiempo…).
- **Sin texto libre:** solo frases y emojis del juego, en lenguaje inclusivo. Así no hace falta
  moderar y sirve igual con niños.
- **Técnica:** una acción `react` en `api/sala` que guarde solo la última reacción de cada asiento
  y llegue con el polling que ya existe, con un límite de frecuencia para que no sea spam. La
  reacción sale un par de segundos junto a la tarjeta de quien la manda.
- **Medición:** evento `online_react` con el emoji o la frase, para ver cuáles se usan.

**🍅 Tomatada**

Le lanzas una tomatada al rival y su pantalla queda tapada durante 5 s, para que no pueda ver ni
pensar y pierda tiempo. Las manchas se van quitando poco a poco hasta que vuelve a ver el tablero.

- **Cuántas:** una por partida. Quizá, después de gastarla, se puedan comprar más con segundos de
  tu reloj, como en la tienda secreta.
- **Versión por tema:** tomates en el clásico, telarañas en Halloween, bolas de nieve en Navidad,
  confeti en el cumpleaños… Cada tema pone su «proyectil» en `themes.js`.
- **Técnica:** una jugada nueva `throw` en `api/_sala.js`, como `hint` o `buy`, que llega al rival
  con el polling de siempre (puede tardar alrededor de un segundo). La duración y las reglas van en
  `config.js` (`throw.seconds`…). Mientras te tapan, tu reloj sigue corriendo: esa es la gracia.
- **Con niños y accesibilidad:** nada que dé miedo ni ofenda y sin destellos. Con «reducir
  movimiento», las manchas se desvanecen sin animación. El aviso «🍅 Ana te ha lanzado una
  tomatada» sale en la línea de mensajes, como los demás avisos del rival.
- **Medición:** `extra_used` con `extra: 'throw'` y el contador del servidor `power_throw`.

**Decidido:** la tomatada va con su propio botón en la barra y es una por partida. Las reacciones
son para el modo en línea; en «Juntos» no hacen falta.

**Por decidir (estudiarlo antes de construir):**

- Cómo conviven con los extras de ahora (💡 👁️ 🔄 🛟). Hay dos opciones: que en línea sustituyan al
  extra que menos se use (los datos de `extra_used` lo dirán) o una interacción nueva que abra
  otros menús (reacciones, frases…).
- Reacciones con emoji, frases o las dos; y si las frases son fijas o salen según la partida.
- Si la tomatada se puede comprar con segundos después de gastarla, y si hay límites (no en los
  últimos segundos del rival, no dos seguidas).
