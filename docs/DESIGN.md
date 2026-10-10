# Sistema de diseño y accesibilidad

Guía viva del aspecto de OSO. Todo el estilo está en `public/css/styles.css`.

## Tokens (`:root`)

| Grupo       | Tokens                                                                           | Uso                                                      |
| ----------- | -------------------------------------------------------------------------------- | -------------------------------------------------------- |
| Fondo       | `--bg1` `--bg2` `--bg3`                                                          | Degradado nocturno de la app                             |
| Superficies | `--glass` `--glass2` `--line`                                                    | Paneles y tarjetas de cristal                            |
| Texto       | `--ink` `--muted`                                                                | Texto principal y secundario                             |
| Acción      | `--accent` `--accent2`                                                           | Botón principal y foco                                   |
| Jugadores   | `--p1*` (azul) · `--p2*` (rosa) · `--p3*` (verde) · `--p4*` (lila)               | Paneles, letras y OSOs de cada jugador                   |
| Selección   | `--ring` `--ring-glow`                                                           | Anillo de la ficha O/S elegida, con el color del jugador |
| Fichas      | `--tile` `--tile-edge` `--tile-ink`                                              | Letras del tablero                                       |
| Radios      | `--r-xs` 10 · `--r-sm` 14 · `--r-md` 18 · `--r-lg` 22 · `--r-xl` 28 · `--r-pill` | Esquinas: usa siempre un token, nunca un valor suelto    |
| Tipografía  | `--font` (Fredoka autoalojada)                                                   | Toda la interfaz                                         |
| Disposición | `--side-w` `--avatar-cols`                                                       | Ancho de las tarjetas laterales y columnas de avatares   |

Cada tema cambia estos tokens con `body[data-theme='…']`; los componentes no llevan colores propios
de un tema.

## Componentes

- **Botón principal** (`.primary`): amarillo, una sola acción principal por pantalla.
- **Botón secundario** (`.secondary`): cristal; acciones de volver o alternativas.
- **Selectores** (`.mode-btn`, `.difficulty-btn`, `.view-btn`, `.avatar-btn`, `.letter`): botones con `aria-pressed`; la clase `.selected` y `aria-pressed` se cambian juntos. En `.mode-btn` el emoji va arriba y el texto debajo.
- **Opción no disponible:** si un botón tiene que explicar por qué no se puede usar (4 jugadores en el móvil), no lleva `disabled`: se marca con `data-locked` y `.soon` (atenuado) y al pulsarlo abre un diálogo con el motivo.
- **Navegación de los pasos:** siempre 3 huecos repartidos por igual (← ❓ →) con botones del mismo ancho (76 px); si un paso no tiene →, el hueco se mantiene con `.invisible` para que ❓ siga en el centro. En «Cómo se juega» los tres son simples (→ sin amarillo); en la configuración → es `.primary`; en el paso de modo «👀 Cómo se juega» y «Siguiente →» ocupan cada uno su mitad, con textos de longitud parecida (en móviles ≤400 px ❓ se estrecha a 46 px para que quepan en una línea).
- **Desplegable** (`.select-wrap`): flecha propia con margen respecto al borde y la etiqueta separada 18 px, para que el foco no la toque.
- **Ficha O/S elegida** (`.letter.selected`): el relieve va dentro de la ficha (`inset`) y el anillo del jugador por fuera con `outline-offset`, para que no se mezclen.
- **Extras** (`.power`, `.sos-power`): icono + contador; su nombre accesible es «Pista, quedan 1» o «… (ya usado)».
- **Casillas** (`.cell`): botones con nombre «Fila 2, columna 3: O» o «… vacía».
- **Diálogos**: la ayuda y la pantalla de victoria son `role="dialog"`; al ganar, el foco va a «Revancha». Los avisos cortos (`.info-dialog`) usan `<dialog>` nativo con `showModal()`, fuera de `.app` para que el fondo cubra toda la pantalla, y se cierran con su botón o con Escape.
- **Celebraciones:** confeti al ganar y lluvia de huevos con el fondo oscurecido en el easter egg de temas; con «reducir movimiento» solo queda el mensaje.

## Reglas de accesibilidad

- Contraste WCAG AA y foco visible (`outline` amarillo de 3 px) en todo lo interactivo.
- Texto de 12 px como mínimo.
- Objetivos táctiles de 24 px como mínimo (WCAG 2.2 AA); los extras amplían su zona táctil con `::after` hasta unos 44 px.
- Un `h1` (oculto visualmente) por página y títulos en orden.
- Nunca depender solo del color: cada jugador tiene también avatar, nombre y posición.
- Todas las animaciones se paran con `prefers-reduced-motion: reduce`.
- Todo sonido tiene su aviso visual y se puede silenciar (🔊 / 🔇), y el silencio se recuerda.
- `tests/e2e/a11y.spec.js` pasa axe-core (WCAG 2.2 AA) en el inicio, el tablero y la partida; falla si hay errores graves.

## Auditoría UX/UI (octubre 2026)

Arreglado: falta de `h1`, créditos fuera de una región (`<footer>`), selector de tablero sin etiqueta, 22 casillas sin nombre, selectores sin `aria-pressed`, pantalla de victoria sin rol de diálogo ni foco, títulos desordenados en el menú, textos de 10–11 px, puntos del carrusel de 26 px de alto, extras de 34 px y 20 radios distintos reducidos a 5 tokens.

## Propuestas pendientes de decidir

1. **Escala tipográfica:** hay 26 tamaños distintos; reducirlos a unos 7 tokens (`--fs-xs` … `--fs-display`).
2. **Colores semánticos:** hay 53 colores sueltos; pasarlos a tokens (`--success`, `--danger`, `--sea-*`), lo que también prepararía los temas de temporada.
3. **Tablero con teclado:** moverse con las flechas por el tablero (patrón _grid_ con un solo tabulador), como en los juegos de tablero web accesibles.
4. **OSOs sin depender del color:** añadir a los OSOs de cada jugador un borde o patrón distinto, para jugadores daltónicos.
5. ~~**Sonido opcional**~~ hecho en 2.2.0 con el botón 🔊 / 🔇. Queda la vibración (T4.4).
6. ~~**Menú lateral como diálogo**~~ hecho: cada panel de jugador tiene su ☰; el menú se abre girado hacia quien lo pulsa, encierra el foco, se cierra con Escape o tocando fuera y devuelve el foco a ☰.
7. **Escritorio:** hecho en la partida con T4.2 (tablero grande y paneles a los lados); el panel de configuración sigue dejando espacio vacío.
8. ~~**Reglas animadas (FigJam)**~~ hecho en 2.3.0: animaciones solo CSS en los pasos de las reglas (arrastrar una letra, completar OSO, cuenta atrás de 5 s). Solo se anima la tarjeta visible (`.rule-slide.playing`) y el estado sin animación es el final de la jugada, que es lo que se ve con «reducir movimiento».
