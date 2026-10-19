# Pantalla del 🛟 al volver a OSO (31)

- **Estado:** Idea · si se quiere animar y ambientar más
- **Grupo:** [Temas, sonido y celebración](../ROADMAP.md#6-temas-sonido-y-celebración)
- **Valor / esfuerzo** (estimados por Devin): Bajo / bajo

## Qué problema resuelve

Visto por JoseLuis (19-10-2026): si en una partida en modo SOS se vuelve a pulsar 🛟, la pantalla de
transición sigue pareciendo la de SOS, cuando la partida vuelve a OSO.

## Propuesta

- Que la pantalla de vuelta diga claramente OSO, no SOS.
- Para ambientarla más, enseñar «🐻 S 🐻»: los osos hacen de O, igual que el 🛟 hace de O en
  «S🛟S».

## Por decidir

- Si es un fallo que hay que arreglar o solo una mejora de ambiente: según el código
  (`sosIntro` en `public/js/app.js`), la pantalla ya debería poner «O🛟O» y «¡Ahora es OSO!». Hay
  que comprobarlo en el móvil.
- Si «🐻 S 🐻» cambia con el tema elegido (por ejemplo, un avatar del tema en vez del 🐻).

## Cómo se mide

No hace falta un evento nuevo: `extra_used` con `extra: sos` ya cuenta cuántas veces se usa el 🛟.
