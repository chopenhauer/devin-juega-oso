# OSO wrap: tu año en OSO (35)

- **Estado:** Contadores hechos en 4.6.3 · la pantalla del wrap, a principios de diciembre
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

## Qué faltaba

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

## Hecho en 4.6.3: los contadores

Al acabar cada partida, `wrap.js` suma los totales del año en `oso.wrap.v1`
(`{ years: { 2026: {...} } }`, solo este año y el anterior):

| Campo                                  | Qué cuenta                                                                                                               |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `games`, `days`, `firstDay`, `lastDay` | Partidas acabadas, días con alguna partida, el primero y el último                                                       |
| `modes`, `boards`, `themes`            | Partidas por modo (`solo`, `two`, `four`, `online`), tablero y tema                                                      |
| `themeChanges`                         | Veces que se elige otro tema en el 🎨 (¿se queda siempre con el mismo?)                                                  |
| `avatars`                              | Partidas con cada avatar de quien juega en el móvil (¿cuál es el más común?, ¿es fiel a uno?)                            |
| `longestSession`, `marathons`          | La sesión más larga, en partidas, y cuántas llegaron a `wrap.marathonGames` (5)                                          |
| `lastName`, `nameChanges`              | Tu nombre (jugador 1, o tu asiento en línea) en la última partida y cuántas veces ha cambiado                            |
| `shares`                               | Veces que compartes, por canal: `native`, `whatsapp`, `email`, `copy`, `image`                                           |
| `dayRun`, `bestDayRun`                 | Días seguidos con alguna partida: los de ahora y la racha más larga del año                                              |
| `beatenBy`                             | Tu némesis: quién te gana, `machine.<nivel>` o el nombre del rival (como mucho 20)                                       |
| `sosComebacks`                         | Veces que el 🛟 te pone por delante cuando ibas perdiendo (no en línea)                                                  |
| `plenos`                               | Partidas ganadas en pleno en el móvil (`Match.isPleno`)                                                                  |
| `bought`, `secrets`                    | Extras comprados en la tienda secreta y veces que se encuentra cada secreto                                              |
| `offline`, `installed`                 | Partidas sin conexión y desde la app instalada                                                                           |
| `challenges`                           | Enlaces de reto: `opened`, `played` y `beaten`                                                                           |
| `replays`                              | Veces que se ve «Ver la partida»                                                                                         |
| `rematches`, `rematchRun`              | Revanchas pedidas y la tanda más larga de revanchas seguidas                                                             |
| `extras`                               | Extras usados en el móvil (💡 `hint`, 👁️ `last`, 🔄 `swap`, 🛟 `sos`), nunca los de la máquina ni los del rival en línea |
| `machine`                              | Contra la máquina, `won`/`lost`/`draw` por nivel                                                                         |
| `online`                               | En línea, `won`/`lost`/`draw` de tu asiento                                                                              |
| `names`                                | En Juntos y con 4, partidas y victorias de cada nombre (como mucho 20 al año)                                            |
| `points`, `best`                       | OSO hechos en el móvil y el máximo de una persona en una partida                                                         |
| `bigWin`                               | La victoria más amplia, contra la máquina o en línea                                                                     |
| `streak`                               | La racha más larga en una partida                                                                                        |
| `timeouts`                             | Partidas que acabaron por tiempo                                                                                         |
| `weekdays`, `hours`                    | Partidas por día de la semana (0 = domingo) y por hora                                                                   |
| `daily`                                | Retos del día: primeros intentos (`played`), victorias (`won`) y mejor racha (`bestStreak`)                              |

- **Quién es «tú»:** contra la máquina, el jugador 1; en línea, tu asiento; en Juntos y con 4, todos,
  porque todos juegan en ese móvil. Por eso ahí se cuenta por nombre.
- **El día** es el de Madrid, contado desde las 0:00, y la hora es la del móvil.
- **Sesión:** la del marcador: partidas seguidas con los mismos jugadores, avatares, modo y nivel.
- **Ideas de JoseLuis (26-10-2026):** avatares, temas, maratones, cambios de nombre y veces que se
  comparte, para que el wrap enseñe también otras funciones del juego. Después pidió guardar también
  las otras ocho propuestas (🛟, tienda, sin conexión, retos, «Ver la partida», némesis, días seguidos
  y revanchas), «y luego vemos si se emplearán».
- **No cuenta:** las partidas que se dejan a medias.

## Cuidado

- **Privacidad:** todo se queda en el móvil, como ahora. Hay que añadir la clave nueva al README y a
  la política de privacidad.
- **Móvil compartido:** en una tablet de familia, el wrap sería de todo lo que se juega en ella. Se
  podría separar por el nombre del jugador 1, pero es un nombre que cada uno escribe y puede cambiar.
- **Borrar:** igual que con el hall of fame, tiene que haber una forma de borrarlo.

## Cómo se mide

Con eventos nuevos: cuántos abren el wrap, hasta qué pantalla llegan y cuántos lo comparten. Y si las
visitas que llegan por un wrap compartido empiezan a jugar.
