# Clasificación del reto del día (33)

- **Estado:** Idea · Siguiente (después de medir el reto)
- **Grupo:** [Llegar, volver y compartir](../ROADMAP.md#4-llegar-volver-y-compartir)
- **Valor / esfuerzo** (estimados por Devin): Medio a alto / Alto

## Qué problema resuelve

El [reto del día](reto-del-dia.md) (4.4.0) es el mismo tablero para todo el mundo, pero cada persona
solo ve su resultado y su racha. Idea de JoseLuis (25-10-2026): mantener una clasificación con las
puntuaciones de cada reto (la del día) y otra con las de todos los retos (la general). Da algo que
comparar con la familia y amig@s y un motivo más para volver mañana.

## Datos que la apoyan

Todavía ninguno: el reto salió el 24-10-2026 y en GA4 aún no hay `daily_start` ni `daily_end`. Antes
de hacerla conviene ver cuántas personas juegan el reto cada día y cuántas vuelven (`daily_streak`):
con pocas personas, la clasificación del día estaría casi vacía.

## Propuesta

- **Dos clasificaciones:**
  - **Del día:** el primer intento de cada persona en el reto de hoy (el único que cuenta). Orden
    propuesto: victoria antes que empate y derrota; después, la diferencia de puntos; después, los
    puntos propios.
  - **General:** todos los retos. Por ejemplo, retos superados, mejor racha y puntos acumulados.
- **Dónde se ve:** en la landing de `/reto` y en la tarjeta de la racha de la pantalla final («Eres
  3.º de 12 hoy»), con un enlace a la clasificación completa. Sin tocar la pantalla de las demás
  partidas.
- **Servidor:** es lo primero de OSO que guarda resultados de varias personas juntos. Puede ir en una
  función nueva (`/api/reto`) con Upstash, como las salas en línea (`api/_store.js`). La del día se
  guarda con caducidad y la general, por apodo.
- **Contra las trampas:** el reto y la suerte de la máquina son fijos para cada día
  (`public/js/daily.js`), así que el servidor puede repetir las jugadas con `match.js`, como hace el
  árbitro de las salas, y calcular él la puntuación en vez de creerse la que manda el móvil. Solo
  se acepta un resultado por apodo y día.
- **Versión sencilla sin servidor:** primero, una lista en el móvil con los últimos retos jugados y
  su resultado. Sale de lo que ya se guarda en `oso.daily.v1` (60 días) y no comparte nada con nadie.
  Se parece al [hall of fame local](hall-of-fame.md) (3), y la clasificación compartida sería una
  primera versión del [hall of fame global](hall-of-fame.md) (14).

## Privacidad

Juegan niños, así que en una clasificación compartida:

- Nada de nombres reales: un apodo elegido para la clasificación, nunca el nombre de «Juegas como»
  sin preguntar.
- Salir solo si la persona lo pide («🏆 Salir en la clasificación»), y poder borrarse.
- Moderar los apodos (lista de palabras prohibidas o apodos generados, del tipo «Oso Naranja 27»).
- Contarlo en la [política de privacidad](../../public/privacidad.html) y en
  [ANALYTICS](../ANALYTICS.md) antes de publicarla.

## Decidido

- La idea, apuntada por JoseLuis el 25-10-2026.

## Por decidir

- Si se empieza por la versión sin servidor o directamente por la clasificación compartida.
- Si es de todo el mundo o por grupos (familia, clase) con un código, que dejaría fuera a
  desconocidos.
- Cómo se ordena la clasificación general.
- Si los apodos los elige cada persona o los pone OSO.

## Cómo se mide

- Cuántas personas piden salir en la clasificación y cuántas la abren (eventos nuevos en GA4,
  apuntarlos en `ANALYTICS.md` y `DATALAYER.md`).
- Si quien sale en la clasificación vuelve más días seguidos (`daily_streak`).
