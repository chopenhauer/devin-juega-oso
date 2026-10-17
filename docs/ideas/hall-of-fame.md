# Hall of fame (3, 14)

- **Estado:** Local (3): siguiente · Global (14): reserva
- **Grupo:** [Llegar, volver y compartir](../ROADMAP.md#4-llegar-volver-y-compartir)
- **Valor / esfuerzo** (estimados por Devin): Alto / Medio a alto

Un salón de la fama con las mejores partidas y rachas.

- **Qué guardar:** ganador (nombre + avatar), puntuación, rival, modo, tamaño de tablero, fecha.
  Posibles rankings: más victorias, mayor puntuación por tamaño de tablero, más OSOs en una
  partida, victorias contra la máquina en Difícil.
- **Opción A · local (recomendada para empezar):** se guarda en `localStorage` del dispositivo.
  Sin servidor, sin datos personales fuera del navegador y compatible con la CSP actual. Ideal
  para la familia en una tablet compartida.
- **Opción B · global:** ranking compartido entre todos los jugadores. Necesita backend (por
  ejemplo una función de Vercel con base de datos), protección contra trampas y moderación de
  nombres. Como juegan menores, publicar nombres implica aviso de privacidad y consentimiento
  (RGPD); sería mejor usar solo alias o iniciales.
- **Pantalla:** acceso desde el inicio («🏆 Hall of fame») y al terminar la partida («¡Nuevo
  récord!»), con botón para borrar el historial.
