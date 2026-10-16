# Vídeos promocionales

Reels verticales (1080×1920, 30 fps, 38 s) para Instagram, TikTok y WhatsApp. No se publican en
la web: viven fuera de `public/`.

| Vídeo                                    | Portada                                                  | De qué va                                                                                                        |
| ---------------------------------------- | -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| [`reel-julia.mp4`](reel-julia.mp4)       | [`reel-julia-portada.png`](reel-julia-portada.png)       | Cómo creamos OSO con Julia: de las 20 versiones en HTML hechas en casa al juego de hoy (49 versiones en 9 días). |
| [`reel-familias.mp4`](reel-familias.mp4) | [`reel-familias-portada.png`](reel-familias-portada.png) | Lo que OSO da a los niños y a sus padres: sin anuncios, sin compras, sin registro, partidas cortas, en familia.  |

## Cómo están hechos

- **Imágenes:** partidas reales del juego grabadas en un móvil (390×720) con Playwright, con GA4 y
  Clarity bloqueados; jugadores Paco y Julia. Las versiones antiguas salen de `old-references/`.
- **Animación:** una página HTML con la letra Fredoka del juego, renderizada fotograma a fotograma
  y montada con FFmpeg.
- **Música:** generada por código (sin derechos de terceros); sin voz en off.
- **Textos:** solo ? y ! al final, como los mensajes que se mandan a otras personas. Las cifras y
  promesas (sin anuncios, sin registro, 90 s por jugador en el 5×5…) salen del código, del
  `CHANGELOG.md` y de la página de privacidad de octubre de 2026: si cambian, hay que rehacer el
  vídeo.
