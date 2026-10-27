# AGENTS.md

Guía rápida para cualquier agente (o persona) que llegue nuevo a OSO: qué hay, dónde está y qué
reglas hay que respetar. El detalle vive en los documentos enlazados; aquí solo el mapa.

## Qué es

- **OSO**: juego web de O y S (y su variante SOS) para 1 jugador contra la máquina, 2 o 4 en el
  mismo dispositivo, o 1 contra 1 en línea. Producción: https://juegaoso.com (y
  https://devin-juega-oso.vercel.app).
- **Proyecto familiar de STEM** de JoseLuis con su hija Julia: ella influye en el roadmap y en las
  decisiones. Es un pet-project web, con licencia MIT; no hay planes de app nativa.
- **Sin build ni framework**: HTML, CSS y JavaScript (módulos ES) servidos tal cual desde
  `public/`, más una Vercel Function para las salas en línea. Cero dependencias en producción.

## Mapa del repo

| Dónde                             | Qué                                                                                            |
| --------------------------------- | ---------------------------------------------------------------------------------------------- |
| `public/index.html`               | La página del juego (`sala.html` se genera al publicar con `scripts/invite-page.js`)           |
| `public/js/engine.js`             | Reglas puras: OSO/SOS, puntuación, pistas, IA. Sin DOM                                         |
| `public/js/match.js`              | Estado de una partida (jugadas, relojes, extras, compras); lo usan el navegador y el servidor  |
| `public/js/app.js`                | Interfaz y flujo de la partida                                                                 |
| `public/js/config.js`             | **Todos los parámetros ajustables** (tiempos, extras, tienda, salas, secretos…)                |
| `public/js/onboarding.js`         | Pasos del inicio: `welcome`, `rules`, `mode`, `where`, `players`, `view`, `board`              |
| `public/js/challenge.js`          | Enlaces de reto contra la máquina (`?reto=5-hard-9-4&tema=…`) y cuándo se supera               |
| `public/js/replay.js`             | «Ver la partida»: cada jugada de la última partida, sus OSO y los que deja a tiro              |
| `public/js/install.js`            | «📲 Instalar» al acabar una partida; `install-early.js` registra `public/sw.js` (sin conexión) |
| `public/js/online.js`             | Cliente de las salas en línea                                                                  |
| `public/js/secrets.js`            | Secretos (easter eggs): 🎨 temas y 🛒 tienda. El n.º 3 está reservado para Julia               |
| `public/js/telemetry.js`          | Eventos anónimos de GA4 (solo con permiso) y cuándo pedir 👍/👎                                |
| `public/js/themes.js`             | Temas y en qué fechas salen                                                                    |
| `public/css/tokens.css`           | Sistema de diseño: única fuente de colores, letra, espacios…                                   |
| `api/sala.js`, `api/_sala.js`     | Salas en línea (`/api/sala`): árbitro con `match.js`, relojes y contadores anónimos            |
| `api/visita.js`, `api/_visita.js` | Contador de visitas sin cookies (`/api/visita`): cargas por consentimiento y clics en el aviso |
| `api/_store.js`                   | Upstash Redis por REST (en memoria en local y en tests)                                        |
| `scripts/`                        | Servidor local, generadores (`CONFIG.md`, tokens, og, `sala.html`) y `online-report.js`        |
| `tests/unit/`                     | `node:test`: motor, partida, servidor, configuración, telemetría…                              |
| `tests/e2e/`                      | Playwright, proyectos `mobile` y `desktop`, con chequeos de accesibilidad                      |
| `old-references/`                 | Versiones históricas (no se publican)                                                          |

## Documentos

| Documento                                | Para qué                                                            |
| ---------------------------------------- | ------------------------------------------------------------------- |
| [`README.md`](README.md)                 | Estructura completa, `localStorage`, desarrollo, seguridad          |
| [`CHANGELOG.md`](CHANGELOG.md)           | Cada versión con sus mejoras **y sus decisiones**, y cómo se numera |
| [`docs/ROADMAP.md`](docs/ROADMAP.md)     | Hilo de evolución: «Ahora», grupos de ideas y su señal de datos     |
| [`docs/ideas/`](docs/ideas/README.md)    | Un documento por idea o funcionalidad, con su detalle y decisiones  |
| [`docs/DESIGN.md`](docs/DESIGN.md)       | Sistema de diseño, accesibilidad y comportamiento visible           |
| [`docs/ONLINE.md`](docs/ONLINE.md)       | Juego en línea: decisión, arquitectura, contadores y umbrales       |
| [`docs/ANALYTICS.md`](docs/ANALYTICS.md) | Qué se mide, para qué y qué no se mide nunca                        |
| [`docs/DATALAYER.md`](docs/DATALAYER.md) | Cómo viajan los datos: consentimiento, `dataLayer`, parámetros      |
| [`docs/CONFIG.md`](docs/CONFIG.md)       | Parámetros del juego (generado desde `config.js`, no editar)        |
| [`SECURITY_MODEL.md`](SECURITY_MODEL.md) | Modelo de amenazas: qué se protege, de quién y con qué              |

## Comandos

```bash
npm install
npm start              # http://localhost:4173 (mismas cabeceras que vercel.json)
npm run lint           # ESLint + Prettier
npm test               # tests unitarios
npm run test:e2e       # Playwright (npx playwright install chromium la primera vez)
npm run check          # todo lo anterior
npm run config         # regenera docs/CONFIG.md tras tocar config.js
npm run tokens         # regenera docs/tokens.json tras tocar tokens.css
npm run icons          # regenera public/icons/ tras tocar scripts/icon-card.html
npm run online:report  # embudo y extras del juego en línea del mes (necesita Upstash)
```

Si Playwright reutiliza un `scripts/serve.js` que se quedó abierto de antes, sirve el servidor de
salas antiguo: ciérralo antes de lanzar los tests.

**Pruebas en navegador estables.** El runner del CI es unas tres veces más lento que un portátil,
así que allí cada prueba tiene 60 s y cada `expect` 10 s (`playwright.config.js`). Para que no
fallen solo en el CI:

- Los secretos (easter egg del 🎨, tienda secreta) se activan manteniendo pulsado: usa `hold()` de
  `tests/e2e/helpers.js`, que suelta cuando sale el resultado, nunca una espera fija.
- Una prueba que juega varias partidas enteras lleva `test.slow()`.
- Contra la máquina, se juega solo en el turno de la persona y se para cuando sale el final.
- En línea, cada jugador lleva su `x-real-ip` (límite de salas) y se espera a que el invitado
  reciba la partida por polling antes de medir su pantalla.

## Cómo se trabaja

1. Rama `devin/<timestamp>-<tema>` con su preview de Vercel, capturas en móvil, iPad y escritorio,
   y tests nuevos.
2. Se publica cuando JoseLuis dice «publica» (o lo ha autorizado antes): se sube la versión en
   `package.json`, `package-lock.json` y `public/js/version.js` (un test comprueba que coinciden
   con el `CHANGELOG.md`) según las reglas de numeración de la cabecera del CHANGELOG, se apunta la entrada en el CHANGELOG con sus decisiones y se enlaza el
   commit.
3. `main` está protegida: sin force-push, y solo acepta commits cuyo job `check` del CI ya ha
   pasado. Cada push a `main` se publica en Vercel. Al acabar se borra la rama.
   - **CI** (`.github/workflows/ci.yml`): en cada push a una rama corren a la vez lint y unitarios,
     y los E2E repartidos en 4 máquinas (`--shard`). El job `check` lo resume. Si la rama solo
     cambia documentos (`*.md`, `docs/`) respecto a `main`, se saltan los E2E. El push a `main`
     no repite el CI. Si un E2E falla, sus trazas quedan 7 días como artefacto del run.
4. Commits con el email noreply de GitHub de chopenhauer
   (`13889217+chopenhauer@users.noreply.github.com`), nunca con el del trabajo.

## Reglas del proyecto

- **Mobile first** y responsive: primero el móvil; iPad y escritorio tienen que funcionar bien.
- **Lenguaje inclusivo** en los textos: «tu rival», «amig@», nada que suponga el género.
- **Español** en textos, documentación y commits; código y comentarios en inglés.
- **Textos solo en `public/locales/es.json`** (clave → texto): en el HTML con `data-i18n`,
  `data-i18n-html` o `data-i18n-attr`, y en el código con `t('clave', { variables })`. Unos tests
  fallan si queda un texto fuera, falta una clave o sobra alguna. Los mensajes que se mandan a otras
  personas (compartir, invitar) llevan solo ? y ! al final; los del juego, ¿¡.
- **Parámetros en `config.js`**, nunca números sueltos en el código; después `npm run config`.
- **Colores y medidas solo desde `tokens.css`** (un test prohíbe colores sueltos).
- **Sin conexión**: `public/sw.js` guarda en caché lo que lista `SHELL`. Un archivo nuevo en
  `public/js`, `css`, `img`, `icons` o `locales` va también a `SHELL` (un test lo comprueba).
- **CSP estricta**: nada de scripts ni estilos inline; los textos de los jugadores con
  `textContent`.
- **Privacidad**: juegan niños. Sin datos personales en la analítica, todo con consentimiento; ver
  [`docs/ANALYTICS.md`](docs/ANALYTICS.md) antes de medir algo nuevo.
- **Decisiones documentadas**: lo que se decide va al CHANGELOG y al documento que toque.
- **El secreto n.º 3 lo inventa Julia**: no lo propongas como hecho ni lo implementes sin ella.

## Fuera de este repo

- `chopenhauer/oso-privado` (privado): paneles de GA4 y la configuración de GA4 como código
  (`ga4/config.json`, `sync.py plan|apply`, `check.py`). Aquí no van IDs privados ni claves.
- Secretos (nunca en el repo): la cuenta de servicio de GA4 y las credenciales de Upstash viven en
  los secretos del entorno y en Vercel.
