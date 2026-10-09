# Changelog y diario de decisiones

Versiones de OSO, el juego de Julia y JoseLuis, con las mejoras de cada una y las decisiones que
tomamos por el camino. La versión que sale en el pie del juego viene de `public/js/version.js`.

**Cómo numeramos (MAYOR.MENOR.CORRECCIÓN):**

- **Mayor:** cambia cómo se juega (modos o reglas nuevas). Ejemplo: el modo 4 jugadores será la 2.0.0.
- **Menor:** novedades sin cambiar las reglas (temas, marcador, pantallas, avisos).
- **Corrección:** arreglos y ajustes visuales.

Las versiones hasta la 1.8.2 se reconstruyeron a partir del historial de `main`. Lo pendiente está en
[`docs/ROADMAP.md`](docs/ROADMAP.md).

## Próximamente

- **3.0.0 · Equipos con 4 jugadores** (idea): elegir entre cada uno por su cuenta o 2 contra 2, con
  nombre de equipo opcional («Equipo 1» contra «Equipo 2» por defecto).

## [2.1.0] - 2026-10-09

**Temas por fechas** ([4f5cb32](https://github.com/chopenhauer/devin-juega-oso/commit/4f5cb32))

- 20 temas nuevos, 23 en total. Cada uno tiene 12 avatares, colores, fondo, decoración y confeti:
  - fiestas: Año Nuevo, Reyes Magos, San Valentín, Carnaval, San Patricio, Pascua, Sant Jordi, San
    Juan, San Fermín y Acción de Gracias;
  - épocas: Primavera, Verano y Otoño;
  - lugares y aventuras: África, Antártida, Atlántida, Espacio, Dinosaurios y Piratas;
  - Cumpleaños.
- Menú 🎨 con un máximo de 5 temas: Clásico y las fiestas que estén a menos de un mes, antes o
  después. «Ver otros temas» llega hasta 10 en total.
- Easter egg: con 6 pulsaciones seguidas del 🎨 (en menos de 3 s) salen todos los temas hasta que se
  recarga la página.
- **Decisiones:**
  - El día de la fiesta su tema se pone solo; al día siguiente vuelve el que se eligió. Si ese día se
    elige otro a mano, se respeta.
  - Las épocas solo salen en el menú mientras duran y nunca se ponen solas.
  - Cumpleaños no tiene fecha, para no guardar la de nadie; se elige a mano en «Ver otros».
  - «Ver otros» empieza por Cumpleaños y alterna un lugar o aventura con la próxima fiesta. El tema
    puesto sale siempre en el menú.
  - Pascua, Carnaval y Acción de Gracias calculan su día cada año.
  - La mayoría de los temas son de los niños.

## [2.0.1] - 2026-10-09

**Vista de 4 jugadores en el ordenador** ([e0bd3c6](https://github.com/chopenhauer/devin-juega-oso/commit/e0bd3c6), [6de8815](https://github.com/chopenhauer/devin-juega-oso/commit/6de8815))

- En «Misma vista», el tablero queda a la izquierda y las 4 tarjetas de jugador se apilan a la
  derecha, en orden de turno y sin scroll.
- Los botones O y S de esa vista son cuadrados, como las casillas del tablero.
- **Decisiones:** en tablet se abre por defecto «Enfrentados» y en el ordenador «Misma vista»; se
  puede cambiar en el paso «Vista».

## [2.0.0] - 2026-10-09

**Modo 4 jugadores** ([d38323b](https://github.com/chopenhauer/devin-juega-oso/commit/d38323b), [b9daeea](https://github.com/chopenhauer/devin-juega-oso/commit/b9daeea), [5b8a6c6](https://github.com/chopenhauer/devin-juega-oso/commit/5b8a6c6))

- Cuatro personas, cada una con su nombre, su avatar y su color, y un panel a cada lado del tablero.
- Vistas «Enfrentados» (cada panel mira a su lado de la mesa) y «Misma vista» (todos derechos).
- Al final salen los 4 marcadores, y el marcador de la sesión cuenta a los cuatro.
- **Decisiones:** todos contra todos y gana quien tenga más puntos (empate en cabeza = victoria
  compartida); turnos 1 → 2 → 3 → 4; tableros 6 × 6, 7 × 7 y 8 × 8 con el mismo reloj que con 2
  jugadores; quien se queda sin tiempo queda fuera con sus puntos y los demás siguen hasta que solo
  quede uno con tiempo; solo personas, sin máquina; cada jugador con 💡, 👁️ y 🔄 una vez; 👁️ marca la
  última jugada de un rival; 🛟 sigue siendo una vez por partida; solo en tablet u ordenador (en
  móvil, desactivado con «En tablet u ordenador»).

**Marcador contra la máquina** ([af17f60](https://github.com/chopenhauer/devin-juega-oso/commit/af17f60))

- El marcador de la sesión sale ya desde la primera partida contra la máquina (con 2 y 4 jugadores,
  desde la segunda).

## [1.9.0] - 2026-10-09

**Pantalla de modo y máquina** ([5013856](https://github.com/chopenhauer/devin-juega-oso/commit/5013856), [76671b0](https://github.com/chopenhauer/devin-juega-oso/commit/76671b0), [da85180](https://github.com/chopenhauer/devin-juega-oso/commit/da85180))

- La pantalla «¿Cómo queréis jugar?» lleva la cabecera OSO y el selector 1 · 2 · 4 jugadores.
- Navegación más simple: «Siguiente», «Cómo se juega» (vuelve al inicio) y ❓ para las reglas.
- La dificultad de la máquina pasa a la pantalla de jugadores, en la tarjeta «Máquina».
- Robots propios para fácil y difícil, con la boca tapada («#!» y «#$@!»).
- Versión del juego en el pie y este changelog.
- **Decisiones:** sin barra de progreso. «4 jugadores» visible pero desactivado hasta tenerlo listo.
  El robot no lleva emojis encima: cada dificultad tiene su dibujo.

## [1.8.2] - 2026-10-09

- Las reglas completas ya no quedan tapadas por el botón 🎨 ni por los créditos ([c5adc53](https://github.com/chopenhauer/devin-juega-oso/commit/c5adc53)).

## [1.8.1] - 2026-10-09

- El botón 🎨 se ve en las pantallas de inicio hasta elegir el número de jugadores
  ([03c7ae4](https://github.com/chopenhauer/devin-juega-oso/commit/03c7ae4)).

## [1.8.0] - 2026-10-09

- Google Analytics 4 ([0e187bb](https://github.com/chopenhauer/devin-juega-oso/commit/0e187bb)) y aviso de cookies con «Aceptar» y «Rechazar»
  ([ea003e2](https://github.com/chopenhauer/devin-juega-oso/commit/ea003e2)).
- **Decisiones:** Consent Mode v2 con la analítica denegada hasta aceptar y la publicidad siempre
  denegada (no hay anuncios). Clarity, que antes se cargaba siempre, ahora solo se carga tras
  aceptar. «Cookies» en el pie permite cambiar de opinión.

## [1.7.1] - 2026-10-09

- Las fichas arrastradas con el ratón ya no se quedan colgadas en escritorio ([0fb6139](https://github.com/chopenhauer/devin-juega-oso/commit/0fb6139)).

## [1.7.0] - 2026-10-09

- Temas Clásico, 🎃 Halloween y ⛄ Navidad: avatares, icono, fondo y confeti ([c24e0db](https://github.com/chopenhauer/devin-juega-oso/commit/c24e0db)).
- **Decisiones:** el botón 🎨 va fuera de la carta, arriba a la derecha, con una pista de tamaño que
  solo se repite hasta abrirlo la primera vez ([1f26742](https://github.com/chopenhauer/devin-juega-oso/commit/1f26742)). Las reglas no cambian con el tema.
  Los temas futuros están en el roadmap (varios, ideas de Julia).

## [1.6.0] - 2026-10-09

- Marcador de la sesión al final de cada partida, con Revancha, Otro tablero y Cambiar jugadores
  ([9598ebb](https://github.com/chopenhauer/devin-juega-oso/commit/9598ebb)).
- **Decisión:** el marcador se reinicia al cambiar de jugadores o de modo, pero no al cambiar de
  tablero.

## [1.5.0] - 2026-10-09

- Diseño de escritorio e iPad para 1 y 2 jugadores ([5b1e78b](https://github.com/chopenhauer/devin-juega-oso/commit/5b1e78b)).
- Fichas que se arrastran hasta el tablero ([f3a8d38](https://github.com/chopenhauer/devin-juega-oso/commit/f3a8d38)).
- Menú ☰ en cada panel, girado hacia quien lo abre ([655577b](https://github.com/chopenhauer/devin-juega-oso/commit/655577b), [08840df](https://github.com/chopenhauer/devin-juega-oso/commit/08840df)).
- **Decisiones:** el tablero, lo más grande posible. El modo 4 jugadores queda para una fase 2.

## [1.4.1] - 2026-10-08

- Accesibilidad WCAG 2.2 AA, revisada con axe, y guía de diseño en `docs/DESIGN.md` ([e4fedc4](https://github.com/chopenhauer/devin-juega-oso/commit/e4fedc4)).

## [1.4.0] - 2026-10-08

- Tema marino con olas al pasar de OSO a SOS ([3045764](https://github.com/chopenhauer/devin-juega-oso/commit/3045764), [3b6f0a3](https://github.com/chopenhauer/devin-juega-oso/commit/3b6f0a3)).
- Créditos en el pie: «Hecho por Julia y JoseLuis — Vilarequi — con amor» ([05f6894](https://github.com/chopenhauer/devin-juega-oso/commit/05f6894)).
- **Decisión:** el marcador dice «puntos OSO» o «puntos SOS», nunca «OSOS» ([4e935c2](https://github.com/chopenhauer/devin-juega-oso/commit/4e935c2)).
- **Decisión:** los regalos desbloqueables quedan solo como idea en el roadmap ([7128d7b](https://github.com/chopenhauer/devin-juega-oso/commit/7128d7b)).

## [1.3.0] - 2026-10-08

- Inicio por pasos: bienvenida, cómo se juega, modo, jugadores y tablero ([95ca111](https://github.com/chopenhauer/devin-juega-oso/commit/95ca111)).
- Avatares exclusivos, reglas en carrusel y panel de altura fija ([bfe2d7e](https://github.com/chopenhauer/devin-juega-oso/commit/bfe2d7e)).
- Paso «¿Cómo vais a jugar?»: enfrentados o misma vista ([ae2b460](https://github.com/chopenhauer/devin-juega-oso/commit/ae2b460)).
- Microsoft Clarity como script externo ([ffdcba8](https://github.com/chopenhauer/devin-juega-oso/commit/ffdcba8)).
- **Decisiones:** la bienvenida solo sale la primera vez y las elecciones se recuerdan en el
  dispositivo.

## [1.2.1] - 2026-10-08

- Arquitectura: motor de reglas separado de la interfaz, CSP y cabeceras de seguridad, fuente propia,
  tests y CI ([d5e1934](https://github.com/chopenhauer/devin-juega-oso/commit/d5e1934), [f4d1fe2](https://github.com/chopenhauer/devin-juega-oso/commit/f4d1fe2)).

## [1.2.0] - 2026-10-08

- Corrige los fallos B02–B05: clics durante el turno de la máquina, recálculo SOS, reloj y salida a
  mitad del recálculo ([ef49f20](https://github.com/chopenhauer/devin-juega-oso/commit/ef49f20)).
- Ayuda en partida con pausa, contador de extras y nombres por defecto «Jugador N».

## [1.1.0] - 2026-10-08

- Rediseño visual: tema nocturno, fichas 3D, animaciones y logo OSO ([dec65d3](https://github.com/chopenhauer/devin-juega-oso/commit/dec65d3)).

## [1.0.0] - 2026-10-08

- Primera publicación en Vercel del juego OSO v12 que hicieron Julia y JoseLuis ([ce664f9](https://github.com/chopenhauer/devin-juega-oso/commit/ce664f9)).
- **Decisiones:** repositorio privado en GitHub; cada cambio se prepara en una rama con preview y se
  publica al hacer merge a `main`.
