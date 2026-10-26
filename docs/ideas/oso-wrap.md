# OSO wrap: tu año en OSO (35)

- **Estado:** Idea · siguiente, con fecha: los contadores tendrían que salir en noviembre para que el
  wrap de 2026 tenga algo que contar
- **Grupo:** [Llegar, volver y compartir](../ROADMAP.md#4-llegar-volver-y-compartir)
- **Valor / esfuerzo** (estimados por Devin): Medio / Medio

## Qué es

Idea de JoseLuis (26-10-2026): a finales de año, un resumen de cómo ha jugado cada persona, como el
Spotify Wrapped. Unas pocas pantallas que se pasan con el dedo, con datos curiosos y divertidos, y una
imagen para compartir al final.

## Qué podría enseñar

Solo lo que se juega en ese móvil, por ejemplo:

- partidas jugadas y ganadas, y contra quién: la máquina (por nivel), en Juntos o en línea;
- cuántos OSO has hecho en total y tu mejor partida (más OSO, o la victoria más ajustada);
- tu racha más larga en una partida y tu mejor racha de retos del día;
- tu tablero, tu tema y tu extra favoritos (💡, 👁️, 🔄 o 🛟);
- el día de la semana y la hora a la que más juegas;
- un título final divertido, como «🐻 Oso de las rachas» o «🛟 Rey del SOS».

## Qué falta hoy

- **Los datos:** el móvil no guarda un historial de partidas. `oso.session.v1` es solo el marcador
  de la sesión, `oso.feedback.v1` cuenta las partidas jugadas y `oso.daily.v1` guarda los retos de
  los últimos 60 días. Haría falta guardar, por año, unos contadores pequeños (no cada partida) en una
  clave nueva de `localStorage`.
- **Qué no sirve:** GA4 no vale para esto. Es anónimo, solo cuenta a quien acepta las cookies y no se
  puede leer desde el móvil de cada persona.
- **Relación con el [hall of fame local](hall-of-fame.md) (3):** los dos necesitan guardar en el
  móvil cómo fueron las partidas. Conviene hacerlos con los mismos datos.

## Propuesta de Devin

1. **Pronto, y es poco:** empezar a guardar los contadores del año en el móvil. No se ve nada nuevo.
   Cuanto antes salga, más tendrá que contar el wrap de 2026: si sale en noviembre, contará unas
   seis semanas.
2. **A principios de diciembre:** la pantalla del wrap.
   - Se abre desde un aviso discreto en el inicio, del 1 de diciembre a mediados de enero.
   - Las pantallas usan los temas y el diseño que ya hay. Hay que respetar «reducir movimiento».
   - Al final, una imagen para compartir, como la del marcador (3.12.0).
   - Si alguien ha jugado muy poco, no sale el wrap, o sale una versión corta.

## Cuidado

- **Privacidad:** todo se queda en el móvil, como ahora. Hay que añadir la clave nueva al README y a
  la política de privacidad.
- **Móvil compartido:** en una tablet de familia, el wrap sería de todo lo que se juega en ella. Se
  podría separar por el nombre del jugador 1, pero es un nombre que cada uno escribe y puede cambiar.
- **Borrar:** igual que con el hall of fame, tiene que haber una forma de borrarlo.

## Cómo se mide

Con eventos nuevos: cuántos abren el wrap, hasta qué pantalla llegan y cuántos lo comparten. Y si las
visitas que llegan por un wrap compartido empiezan a jugar.
