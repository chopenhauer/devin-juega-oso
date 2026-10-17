# Compartir, boca-oreja y enlace de reto (20)

- **Estado:** Hecho en 2.6.0, 3.12.0 (imagen del marcador) y 3.13.0 (enlace de reto)
- **Grupo:** [Llegar, volver y compartir](../ROADMAP.md#4-llegar-volver-y-compartir)
- **Valor / esfuerzo** (estimados por Devin): Alto / Bajo-medio

**Hecho en 2.6.0** (Boca-oreja): 📣 en el inicio, «📣 Invitar a jugar» en el menú ☰ y «📣 Compartir
resultado» en la pantalla final; tarjeta Open Graph (`public/og.png`, se regenera con
`npm run og`), evento `share` con `channel` y `place`, y `utm_campaign=boca_oreja`. Sin nombres.
Queda lo de «Más adelante».

**Acciones realizadas:**

- 2026-10-11 · Enlace a juegaoso.com en «Enlaces externos» del artículo
  [Oso (juego)](<https://es.wikipedia.org/wiki/Oso_(juego)>) de Wikipedia en español, con el conflicto
  de intereses declarado en el resumen de la edición (ver CHANGELOG 3.1.0). Si lo retiran, se
  propone en la página de discusión en vez de volver a añadirlo.

Que corra la voz: que quien juega lo comparta fácilmente con familia y amigos.

- **Dónde:**
  - en la pantalla final, por ejemplo «¡He ganado 7 a 5 en OSO 🐻! ¿Me ganas? juegaoso.com»;
  - en la pantalla de inicio o en el pie, «Invita a alguien a jugar».
- **Cómo:**
  - en el móvil, el menú nativo de compartir (Web Share API), que ya incluye WhatsApp, Telegram,
    email…;
  - si no está disponible: botones de **WhatsApp** (`https://wa.me/?text=…`), **email**
    (`mailto:?subject=…&body=…`) y «Copiar enlace»;
  - sin SDKs ni botones de redes sociales, por la CSP y la privacidad de los niños.
- **Que el enlace se vea bonito:** hoy la web no tiene descripción ni metadatos Open Graph. Hay
  que añadir título, descripción e imagen (`og:image`) para que WhatsApp muestre una tarjeta con
  el oso.
- **Medir:** evento de GA `share` con el canal y enlaces con `utm_source` (`whatsapp`, `email`…)
  para saber cuántas visitas llegan por boca a boca.
- **Siguiente:** un enlace de reto («juega este tablero y este tema»), ver la idea 20 en la
  priorización. Más adelante, un código QR para enseñarlo en la tablet.
- **Decisiones abiertas:** si el texto incluye los nombres de los jugadores (por defecto no) y
  dónde sale el botón.

## Enlace de reto (20)

**Enlace de reto (20):** «Te reto: 5×5 contra la máquina en Difícil, bate mi 9–4». El enlace abre
la partida ya preparada (tablero, modo, dificultad y tema). Aprovecha lo que mejor funciona, que
es compartir: 43 de 112 sesiones llegan por enlaces compartidos.

**Hecho en 3.13.0** (ver el [CHANGELOG](../../CHANGELOG.md)).
