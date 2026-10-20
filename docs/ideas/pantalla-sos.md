# Pantalla del 🛟 al volver a OSO (31)

- **Estado:** Hecho en 4.3.0
- **Grupo:** [Temas, sonido y celebración](../ROADMAP.md#6-temas-sonido-y-celebración)
- **Valor / esfuerzo** (estimados por Devin): Bajo / bajo

## Qué problema resuelve

Visto por JoseLuis (19-10-2026): si en una partida en modo SOS se usa otro 🛟 (comprado en la
tienda), la partida vuelve a OSO, pero la pantalla de transición seguía siendo la del mar, con
«O🛟O». Parecía todavía SOS.

## Qué se hizo (4.3.0)

- Al volver a OSO, la pantalla enseña las fichas «O S O» de la portada, con el icono del tema
  encima (🐻 en el clásico, 🎃 en Halloween…), y «¡Ahora es OSO!».
- El fondo es el del tema de la partida, no el mar. La ida a SOS sigue igual: «S🛟S» en el mar.
- Igual en línea: el rival ve la misma pantalla cuando la partida vuelve a OSO.
- Con «reducir movimiento», nada se mueve.

## Ideas para más adelante

- «🐻 S 🐻»: que los osos (o el icono del tema) hagan de O, para ambientarla todavía más.

## Cómo se mide

No hace falta un evento nuevo: `extra_used` con `extra: sos` ya cuenta cuántas veces se usa el 🛟.
