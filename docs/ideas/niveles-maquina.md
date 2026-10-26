# Niveles de la máquina (13, 19, 34)

- **Estado:** Extremo hecho en 3.11.0 · Fácil (19): objetivo cumplido sin tocarlo · Difícil:
  revisar con ~30 partidas · 🛟 de la máquina (34): idea · siguiente, después de revisar Difícil
- **Grupo:** [Contra la máquina](../ROADMAP.md#1-contra-la-máquina)
- **Valor / esfuerzo** (estimados por Devin): Alto / Bajo

**B06 · la máquina en Difícil no defiende:** resuelto en la 3.11.0 con tres niveles (decisión de
JoseLuis tras el feedback «en fácil la máquina toma riesgos y es más divertido; en difícil hay empate
y aburre»): Fácil aprovecha el 50 % de los OSO a mano, Difícil el 80 % y Extremo todos, sin dejar
ninguno a tiro y con trampas al final. JoseLuis aprobó el Extremo tal cual (en las simulaciones gana casi siempre a Difícil), con la
condición de revisar a futuro los valores (`machine.easyAim`, `hardAim`, `pool`,
`extremeLookahead`) con GA4 (`difficulty` × `result`) cuando haya partidas suficientes.

## Fácil más fácil (19)

- **Datos (GA4, 28 días hasta el 17-10-2026):** en Fácil la máquina gana 23 de 31 partidas (74 %) y
  en Difícil 7 de 8 (la otra, empate). Del Extremo aún no hay partidas.
- **Por qué importa:** juegan niños, y perder 3 de cada 4 veces contra el nivel más fácil frustra.
- **Propuesta:** bajar `machine.easyAim` (hoy aprovecha el 50 % de los OSO a mano) en
  [`config.js`](../../public/js/config.js) y revisar Difícil. El Laboratorio de Julia
  ([25](laboratorio-de-julia.md)) puede simular antes cuánto gana cada valor.
- **Objetivo por decidir:** por ejemplo, que en Fácil la persona gane la mitad de las partidas.
- **Espera (17-10-2026):** JoseLuis prefiere esperar unos días más para tener más datos antes de
  tocar el Fácil (31 partidas son pocas). Propuesta de Devin: revisarlo con unas 60 partidas en Fácil
  o dentro de dos semanas, lo que llegue antes.
- **Datos (GA4, 28 días hasta el 24-10-2026):** en Fácil la persona gana 28 de 57 partidas (49 %),
  13 de 18 desde el 20-10. Ya se cumple el objetivo propuesto de la mitad, así que la propuesta de
  Devin es no tocar `machine.easyAim`. En Difícil la persona gana 1 de 12 (9 gana la máquina y 2
  empates) y en Extremo 1 de 5: revisar Difícil con el Laboratorio cuando haya unas 30 partidas. El
  reto del día juega en Difícil martes, jueves y domingo, así que dará datos pronto.

## La máquina también usa el 🛟 (34)

- **Idea de JoseLuis (26-10-2026):** que los niveles de la máquina se planteen usar el cambio de OSO
  a SOS (🛟) como una de las cosas que los hacen distintos.
- **Hoy:** la máquina no usa nunca ningún extra: ni 💡, ni 🔄, ni 🛟. Si la persona usa el 🛟, la
  máquina sigue jugando bien, porque busca SOS en vez de OSO, pero nunca decide cambiar ella. El 🛟 es
  uno por partida para todo el mundo: si lo usa uno, se gasta para los dos, salvo que se compre otro en
  la tienda secreta.
- **Por qué puede valer la pena:** el 🛟 vuelve a contar la partida entera con la otra palabra, así
  que puede darle la vuelta al marcador. Es la jugada más espectacular del juego y la máquina no la
  hace nunca. Los niveles se diferenciarían por algo más que por cuántos OSO aprovechan.
- **Propuesta de Devin, por decidir:**
  - **Fácil:** lo usa alguna vez al azar, aunque le salga mal. Encaja con el feedback de la 3.11.0
    («en fácil la máquina toma riesgos y es más divertido») y enseña a los niños qué hace el 🛟.
  - **Difícil:** lo usa una vez, solo si al recalcular pasa a ir ganando, y a partir de la mitad de
    la partida.
  - **Extremo:** lo usa en el mejor momento: calcula cómo quedaría el marcador y cuenta también con
    los OSO o SOS que quedan a tiro en el tablero.
  - Siempre con la misma pantalla «S🛟S» (o «O S O» al volver) y una línea en los mensajes, como «🛟
    La máquina ha cambiado a SOS».
- **Cuidado:**
  - **Que no frustre:** si la máquina gasta el 🛟, la persona se queda sin el suyo. Opciones: que la
    máquina tenga uno propio, o que solo lo use después de que lo haya usado la persona.
  - **Reto del día:** la máquina del reto juega con una semilla para que el reto sea igual para todo
    el mundo. Si usa el 🛟, tiene que decidirlo con la misma semilla.
  - **Laboratorio de Julia ([25](laboratorio-de-julia.md)):** los parámetros nuevos (por ejemplo, desde
    qué momento lo usa y cuánto tiene que ganar) deberían ir en el simulador, para ver antes de
    publicarlo cuánto cambia el % de victorias de cada nivel.
  - **Medir:** hoy `extra_used` solo cuenta los extras de quien juega en ese móvil, nunca los de la
    máquina. Habría que medir aparte cuántas veces lo usa la máquina y si gana más.
- **Código:** poco. `engine.js` ya tiene `replayHistory`, que recalcula la partida con la otra
  palabra, así que la máquina puede saber exactamente cómo quedaría el marcador antes de decidir.
- **Cuándo:** «Siguiente», después de revisar Difícil con ~30 partidas. Así se verá si Difícil
  necesita ser más fácil o más difícil, y el 🛟 de la máquina puede ser una de las palancas.
- **Valor / esfuerzo** (estimados por Devin): Medio / Medio
