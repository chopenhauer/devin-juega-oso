# Niveles de la máquina (13, 19)

- **Estado:** Extremo hecho en 3.11.0 · Fácil más fácil (19): esperando más datos
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
