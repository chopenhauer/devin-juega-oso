# Sistema de diseño y accesibilidad

Guía viva del aspecto de OSO. Todo el estilo está en `public/css/styles.css`.

## Tokens (`:root`)

| Grupo | Tokens | Uso |
| --- | --- | --- |
| Fondo | `--bg1` `--bg2` `--bg3` | Degradado nocturno de la app |
| Superficies | `--glass` `--glass2` `--line` | Paneles y tarjetas de cristal |
| Texto | `--ink` `--muted` | Texto principal y secundario |
| Acción | `--accent` `--accent2` | Botón principal y foco |
| Jugadores | `--p1*` (azul) · `--p2*` (rosa) | Paneles, letras y OSOs de cada jugador |
| Fichas | `--tile` `--tile-edge` `--tile-ink` | Letras del tablero |
| Radios | `--r-xs` 10 · `--r-sm` 14 · `--r-md` 18 · `--r-lg` 22 · `--r-xl` 28 · `--r-pill` | Esquinas: usa siempre un token, nunca un valor suelto |
| Tipografía | `--font` (Fredoka autoalojada) | Toda la interfaz |

## Componentes

- **Botón principal** (`.primary`): amarillo, una sola acción principal por pantalla.
- **Botón secundario** (`.secondary`): cristal; acciones de volver o alternativas.
- **Selectores** (`.mode-btn`, `.difficulty-btn`, `.view-btn`, `.avatar-btn`, `.letter`): botones con `aria-pressed`; la clase `.selected` y `aria-pressed` se cambian juntos.
- **Extras** (`.power`, `.sos-power`): icono + contador; su nombre accesible es «Pista, quedan 1» o «… (ya usado)».
- **Casillas** (`.cell`): botones con nombre «Fila 2, columna 3: O» o «… vacía».
- **Diálogos**: la ayuda y la pantalla de victoria son `role="dialog"`; al ganar, el foco va a «Revancha».

## Reglas de accesibilidad

- Contraste WCAG AA y foco visible (`outline` amarillo de 3 px) en todo lo interactivo.
- Texto de 12 px como mínimo.
- Objetivos táctiles de 24 px como mínimo (WCAG 2.2 AA); los extras amplían su zona táctil con `::after` hasta unos 44 px.
- Un `h1` (oculto visualmente) por página y títulos en orden.
- Nunca depender solo del color: cada jugador tiene también avatar, nombre y posición.
- Todas las animaciones se paran con `prefers-reduced-motion: reduce`.
- `tests/e2e/a11y.spec.js` pasa axe-core (WCAG 2.2 AA) en el inicio, el tablero y la partida; falla si hay errores graves.

## Auditoría UX/UI (octubre 2026)

Arreglado: falta de `h1`, créditos fuera de una región (`<footer>`), selector de tablero sin etiqueta, 22 casillas sin nombre, selectores sin `aria-pressed`, pantalla de victoria sin rol de diálogo ni foco, títulos desordenados en el menú, textos de 10–11 px, puntos del carrusel de 26 px de alto, extras de 34 px y 20 radios distintos reducidos a 5 tokens.

## Propuestas pendientes de decidir

1. **Escala tipográfica:** hay 26 tamaños distintos; reducirlos a unos 7 tokens (`--fs-xs` … `--fs-display`).
2. **Colores semánticos:** hay 53 colores sueltos; pasarlos a tokens (`--success`, `--danger`, `--sea-*`), lo que también prepararía los temas de temporada.
3. **Tablero con teclado:** moverse con las flechas por el tablero (patrón *grid* con un solo tabulador), como en los juegos de tablero web accesibles.
4. **OSOs sin depender del color:** añadir a los OSOs de cada jugador un borde o patrón distinto, para jugadores daltónicos.
5. **Sonido y vibración opcionales:** un sonido corto al poner una letra y al puntuar, con un interruptor (como Wordle o Duolingo). Va con T4.4.
6. **Menú lateral como diálogo:** encerrar el foco dentro del menú, cerrarlo con Escape y devolver el foco a ☰.
7. **Escritorio:** el panel de configuración deja mucho espacio vacío y el tablero podría ser más grande. Va con T4.2.
