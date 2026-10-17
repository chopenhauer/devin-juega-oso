# Que la gente llegue a jugar (30)

- **Estado:** Paso 1, medir: hecho en 3.17.0 · «Jugar ya»: según lo que digan los datos
- **Grupo:** [Llegar, volver y compartir](../ROADMAP.md#4-llegar-volver-y-compartir)
- **Valor / esfuerzo** (estimados por Devin): Alto / Bajo-medio

**Que la gente llegue a jugar (30):** solo 30 de 52 usuarios empiezan una partida. Primero medir
cada paso de la bienvenida (un evento por paso, sin datos personales) para saber dónde se van, y
después probar un botón «Jugar ya» que empiece con las elecciones por defecto (contra la máquina,
5×5, Fácil). Las grabaciones de Clarity ayudan a ver qué pasa en esos pasos.

## Paso 1: medir (3.17.0)

Decidido por JoseLuis: medir antes de cambiar la bienvenida, en GA4 y también en nuestro servidor
sin cookies, para ver a todas las visitas.

- **Qué se cuenta:** cada pantalla del inicio vista antes de la primera partida, una vez por visita
  (`welcome`, `rules_1`…`rules_4`, `mode`, `where`, `players`, `view`, `board` y `start`), y cómo
  llegó la visita (`first`, `return`, `challenge`). Código: `public/js/funnel.js`.
- **Dónde se ve:** `npm run online:report` (contadores del servidor `setup_{entrada}_{pantalla}`) y,
  en GA4, una exploración de embudo con el evento `setup_step` y las dimensiones `step` y `entry`.
- **Cómo leerlo:** el embudo de las primeras visitas empieza en `welcome`; la pantalla con la mayor
  caída es la candidata a cambiar. Si se van en el aviso de cookies o en la bienvenida, «Jugar ya»
  tiene sentido; si se van en las reglas, conviene acortarlas.
- **Cuándo decidir:** con unas 100 primeras visitas en el embudo del servidor (propuesta de Devin).
