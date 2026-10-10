# Sistema de diseño y accesibilidad

Guía del aspecto de OSO. **Todo valor de diseño vive en `public/css/tokens.css`**; `styles.css`
solo usa tokens. Si cambias un token, cambian el juego, la guía viva y `docs/tokens.json`.

## Sistema de diseño (desde la 2.6.1)

### Capas de tokens

| Capa        | Dónde                    | Qué contiene                                                                                                    | Ejemplos                                                             |
| ----------- | ------------------------ | --------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| Primitivos  | `:root` (bloque 1)       | Paleta en bruto (familia-tono 50…950, `-aNN` = opacidad), tamaños de letra, espacios, radios, animación y capas | `--sol-400` `--fs-2xl` `--space-3` `--r-md` `--ease-pop` `--z-modal` |
| Semánticos  | `:root, body` (bloque 2) | Qué significa cada color. **Es lo único que cambian los temas.** Solo apuntan a primitivos                      | `--color-accent` `--color-text-muted` `--color-p1` `--color-board-1` |
| Componentes | `:root, body` (bloque 3) | Decisiones de cada pieza, hechas con semánticos                                                                 | `--btn-primary-bg` `--board-shell-bg` `--relief-tile` `--shadow-lg`  |
| Alias       | `:root, body` (bloque 4) | Nombres anteriores, para no romper nada                                                                         | `--accent` → `--color-accent`, `--p1b` → `--color-p1-strong`         |

Semánticos, componentes y alias se declaran también en `body`: así, si un tema cambia un semántico
en `body`, todo lo que depende de él se recalcula solo.

**Escalas:** letra `--fs-3xs` (10) … `--fs-hero-xl` (100); peso `--fw-semibold` `--fw-bold`;
espacios de 4 en 4 px (`--space-1` = 4 px, `--space-2-5` = 10 px…); radios `--r-4xs` … `--r-pill`;
duraciones `--dur-fast` `--dur-quick` `--dur-base`; curvas `--ease-soft` `--ease-pop`
`--ease-bounce` `--ease-spring`; capas `--z-toolbar` (10) … `--z-modal` (100). Los tamaños que no
encajan en la escala (letras del tablero, título de victoria…) son tokens de componente
(`--fs-letter-md`, `--fs-title-xl`…) para unificarlos más adelante sin buscar por el CSS.

### Temas

- Un tema **solo cambia tokens semánticos**. Halloween y Navidad lo hacen en `tokens.css` con
  `body[data-theme='…']`; el resto, en `public/js/themes.js`:
  - `bg` y `board` son atajos para `--color-bg-glow-1/2`, `--color-bg-1/2/3` y `--color-board-1/2`;
  - `tokens: { '--color-accent': '#…' }` cambia cualquier otro token;
  - `confetti` es opcional; si no lo trae, se usa `--confetti`.
- `app.js` aplica esos tokens en `body` (`themeTokens()` en `themes.js`).

### Reglas (las comprueba `tests/unit/design-system.test.js`)

1. Fuera de `tokens.css` no hay colores, tamaños o pesos de letra, capas (z-index ≥ 10) ni curvas
   sueltas. En JS solo hay colores en los datos de `themes.js`.
2. Todo token que se usa existe.
3. Los semánticos solo apuntan a primitivos.
4. Los temas solo tocan tokens que existen.
5. `docs/tokens.json` está al día (`npm run tokens`).

Un test en navegador cambia tokens con el juego abierto y comprueba que los botones y el tablero
cambian al momento.

### Guía viva `/design`

`public/design.html` lee los tokens de `tokens.css` en el navegador y muestra colores, tipografía,
espacios, radios, sombras, componentes y jugadores, con un selector de tema. Se ve en local
(`npm start` → http://localhost:4173/design) y en las previews de Vercel. **No se publica en
producción:** el `buildCommand` de `vercel.json` la borra salvo si `VERCEL_ENV` es `preview`.

### Exportar a Figma

`npm run tokens` genera `docs/tokens.json` en el formato estándar de W3C (Design Tokens), con las
capas, los alias como referencias (`{primitive.sol-400}`) y los temas de CSS.

### Preparado para el futuro

- **Alto contraste:** con `prefers-contrast: more`, superficies y líneas más marcadas y texto
  secundario más claro.
- **Densidad compacta:** `<html data-density="compact">` reduce los espacios (reservado).
- **Sin depender del color:** `--p1-mark` … `--p4-mark` (● ▲ ■ ◆) reservados para marcar jugadores.
- **Componentes nuevos:** crea primero sus tokens de componente con semánticos; nunca valores sueltos.

### Disposición

`--side-w` y `--avatar-cols` siguen en `styles.css`: dependen del tamaño de la pantalla, no del tema.

## Componentes

- **Botón principal** (`.primary`): amarillo, una sola acción principal por pantalla.
- **Botón secundario** (`.secondary`): cristal; acciones de volver o alternativas.
- **Selectores** (`.mode-btn`, `.difficulty-btn`, `.view-btn`, `.avatar-btn`, `.letter`): botones con `aria-pressed`; la clase `.selected` y `aria-pressed` se cambian juntos. En `.mode-btn` el emoji va arriba y el texto debajo.
- **Opción no disponible:** si un botón tiene que explicar por qué no se puede usar (4 jugadores en el móvil), no lleva `disabled`: se marca con `data-locked` y `.soon` (atenuado) y al pulsarlo abre un diálogo con el motivo.
- **Navegación de los pasos:** siempre 3 huecos repartidos por igual (← ❓ →): ❓ es un círculo de 46 px y ← → tienen el mismo ancho (76 px); si un paso no tiene →, el hueco se mantiene con `.invisible` para que ❓ siga en el centro. En «Cómo se juega» los tres son simples (→ sin amarillo); en la configuración → es `.primary`; en el paso de modo «👀 Cómo se juega» y «Siguiente →» ocupan cada uno su mitad, con textos de longitud parecida.
- **Desplegable** (`.select-wrap`): flecha propia con margen respecto al borde y la etiqueta separada 18 px, para que el foco no la toque.
- **Ficha O/S elegida** (`.letter.selected`): el relieve va dentro de la ficha (`inset`) y el anillo del jugador por fuera con `outline-offset`, para que no se mezclen.
- **Extras** (`.power`, `.sos-power`): icono + contador; su nombre accesible es «Pista, quedan 1» o «… (ya usado)».
- **Casillas** (`.cell`): botones con nombre «Fila 2, columna 3: O» o «… vacía».
- **Diálogos**: la ayuda y la pantalla de victoria son `role="dialog"`; al ganar, el foco va a «Revancha». Los avisos cortos (`.info-dialog`) usan `<dialog>` nativo con `showModal()`, fuera de `.app` para que el fondo cubra toda la pantalla, y se cierran con su botón o con Escape.
- **Opinión al final** (`.feedback-ask`): debajo de los botones de la pantalla final, pequeña y atenuada, porque no sale siempre y el sitio principal es para el marcador y las acciones. Al contestar se abre `#thanksDialog` (`.info-dialog`, fondo más oscuro) con «💡 Cuéntanos más» y «Cerrar»; al cerrar, el foco vuelve a «Revancha».
- **Compartir** (`#shareToggle`, `#shareMenu`, `#shareResult`): 📣 redondo junto a 🔊 y 🎨 en el inicio (se oculta en la partida), «📣 Invitar a jugar» en el menú ☰ y «📣 Compartir resultado» a todo el ancho bajo las acciones finales. Abre el menú nativo (`navigator.share`); si no hay, `#shareDialog` (`.info-dialog`) con el texto, WhatsApp (principal), Email, «Copiar enlace», un estado `role="status"` y «Cerrar». Los textos nunca llevan nombres.
- **Pie** (`.credits`): una sola línea, «made by Vilarequi with ❤️ · versión · Cookies · Privacidad».
- **Celebraciones:** confeti al ganar y lluvia de huevos con el fondo oscurecido en el easter egg de temas; con «reducir movimiento» solo queda el mensaje.

## Reglas de accesibilidad

- Contraste WCAG AA y foco visible (`outline` amarillo de 3 px) en todo lo interactivo.
- Texto de 12 px como mínimo.
- Objetivos táctiles de 24 px como mínimo (WCAG 2.2 AA); los extras amplían su zona táctil con `::after` hasta unos 44 px.
- Un `h1` (oculto visualmente) por página y títulos en orden.
- Nunca depender solo del color: cada jugador tiene también avatar, nombre y posición.
- Todas las animaciones se paran con `prefers-reduced-motion: reduce`.
- Todo sonido tiene su aviso visual y se puede silenciar (🔊 / 🔇), y el silencio se recuerda.
- `tests/e2e/a11y.spec.js` pasa axe-core (WCAG 2.2 AA) en el inicio, el tablero, la partida y la política de privacidad; falla si hay errores graves.

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
