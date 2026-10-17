# Modo 4 jugadores y equipos (10)

- **Estado:** Modo 4 hecho en 2.0.0 · Equipos 2 contra 2 (10): si se pide
- **Grupo:** [Juntos en un dispositivo](../ROADMAP.md#2-juntos-en-un-dispositivo-2-y-4-jugadores)
- **Valor / esfuerzo** (estimados por Devin): Medio / Medio

**Hecho en la versión 2.0.0.** Partidas de cuatro personas en el mismo dispositivo, por turnos.
Reglas decididas con JoseLuis:

- **Turnos:** rotan 1 → 2 → 3 → 4; formar OSO da punto y repites turno, igual que ahora.
- **Competición:** todos contra todos; gana quien tenga más puntos y, si hay empate en cabeza,
  comparten la victoria.
- **Jugadores:** solo personas (sin máquinas), cada una con nombre, avatar exclusivo y color.
- **Tablero y reloj:** se elige entre 6 × 6, 7 × 7 y 8 × 8, con el mismo reloj que con 2 jugadores
  en ese tablero (2:00, 2:30 y 3:30 por jugador).
- **Sin tiempo:** quien se queda sin tiempo queda fuera, conserva sus puntos y los demás siguen.
  La partida acaba al llenarse el tablero o cuando solo queda un jugador con tiempo; gana quien
  tenga más puntos.
- **Extras:** cada jugador tiene 💡, 👁️ y 🔄 una vez. 👁️ marca la última jugada del rival anterior
  (la casilla más reciente de cualquiera de los otros tres). 🛟 (OSO → SOS) sigue siendo una sola vez
  por partida, para quien lo use primero.
- **Dispositivos:** tablet y ordenador, con un panel a cada lado del tablero. En «Enfrentados»
  cada panel mira hacia su lado; en «Misma vista» todos quedan derechos. En móvil, «4 jugadores»
  sale atenuado y, al pulsarlo, una ventana avisa «Solo disponible en ordenador o tablet».
- **Motor:** `engine.js` se generaliza a N jugadores, con tests.

## Evolución: equipos con 4 jugadores

Paso posterior al modo 4 jugadores (sería la versión 4.0.0). Al preparar una partida de cuatro se
elige cómo competir:

- **Cada uno por su cuenta:** todos contra todos, como en el modo 4 jugadores.
- **Por equipos:** 2 contra 2; se suman los puntos de cada equipo y gana el equipo con más puntos.
- **Nombre del equipo:** opcional. Por defecto «Equipo 1» contra «Equipo 2», o el nombre que le
  pongan los jugadores.
- **A decidir:** cómo se eligen los compañeros, si el turno alterna entre equipos y si los
  compañeros comparten extras.
