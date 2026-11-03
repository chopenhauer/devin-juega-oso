# App Android (Google Play)

OSO se publica en Google Play como una **Trusted Web Activity (TWA)**: una app Android mínima que
abre `https://juegaoso.com` a pantalla completa con el Chrome del móvil. El juego sigue siendo la web.

## Qué hay

| Dónde                                | Qué                                                                                                                                      |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `android/twa-manifest.json`          | **La configuración de la app** (paquete, nombre, colores, iconos, versión). Se edita aquí                                                |
| `android/app/`, `android/*.gradle`   | Proyecto Android generado por [Bubblewrap](https://github.com/GoogleChromeLabs/bubblewrap) desde `twa-manifest.json`. No se edita a mano |
| `public/.well-known/assetlinks.json` | Digital Asset Links: dice a Android que la app y la web son del mismo dueño                                                              |
| `tests/unit/android.test.js`         | Comprueba que `assetlinks.json` y `twa-manifest.json` cuadran entre sí y con la web                                                      |

- **Paquete:** `com.juegaoso.app`. No se puede cambiar nunca una vez publicado.
- **Entrada:** `/?utm_campaign=play&utm_source=play`, así que las visitas desde la app se cuentan
  como la campaña `play` (`public/js/campaigns.js`), también sin cookies.
- **Avisos:** `enableNotifications` delega las notificaciones web (aviso del reto) en Android, que
  pide el permiso de notificaciones de Android 13+.
- **Sin `assetlinks.json` válido** la app funciona, pero enseña la barra con la URL (como una
  pestaña de Chrome). Si sale la barra, el fallo está ahí.

## Cuándo hay que subir una versión nueva a Play

Casi nunca. Cada versión que publicamos en la web ya la tiene la app. Solo hace falta cuando cambia
algo de `twa-manifest.json` (nombre, icono, colores, orientación, dominio) o cuando Google pide
subir el `targetSdk` (una vez al año, avisa por correo).

## Firma

- **Clave de subida** (`upload`): firma lo que subimos a Play. Vive fuera del repo
  (`../../../oso-privado/android/upload.keystore` desde `android/`) y nunca se sube a GitHub.
  Su contraseña está en el secreto personal de Devin `OSO_UPLOAD_KEYSTORE_PASSWORD` y el archivo,
  en base64, en `OSO_UPLOAD_KEYSTORE_B64`.
- **Clave de la app**: la guarda Google (Play App Signing) y firma lo que se instala desde Play.
- `assetlinks.json` lleva las **dos** huellas SHA-256: la de subida (para probar el APK) y la de
  Play App Signing, que sale en Play Console → Configuración → Integridad de la app → Firma de apps,
  después de subir la primera versión.
- Si se pierde la clave de subida, se pide a Google que la cambie desde Play Console. La de la app
  no se pierde.

## Generar la app

Hace falta JDK 17 y el Android SDK (build-tools 36.1.0, platform 36), y
`npm i -g @bubblewrap/cli`. En `~/.bubblewrap/config.json` van `jdkPath` y `androidSdkPath`
(Bubblewrap exige una carpeta `bin` en el SDK: `ln -s cmdline-tools/latest/bin <sdk>/bin`).

```bash
cd android
# 1. Si has cambiado twa-manifest.json, sube appVersionCode (+1) y appVersionName, y regenera:
bubblewrap update --skipVersionUpgrade
# 2. Compila
./gradlew assembleRelease bundleRelease
# 3. Firma (P = contraseña de la clave de subida)
export P="$OSO_UPLOAD_KEYSTORE_PASSWORD" KS=../../../oso-privado/android/upload.keystore
zipalign -f -p 4 app/build/outputs/apk/release/app-release-unsigned.apk aligned.apk
apksigner sign --ks $KS --ks-key-alias upload --ks-pass env:P --key-pass env:P \
  --out app-release-signed.apk aligned.apk
cp app/build/outputs/bundle/release/app-release.aab app-release-bundle.aab
jarsigner -keystore $KS -storepass:env P -sigalg SHA256withRSA -digestalg SHA-256 \
  app-release-bundle.aab upload
```

- `app-release-bundle.aab` es lo que se sube a Play Console.
- `app-release-signed.apk` sirve para probar en un móvil o emulador (`adb install`).
- `bubblewrap build` hace los pasos 2 y 3 de una vez, pero se cae con «stderr maxBuffer length
  exceeded» la primera vez que Gradle descarga dependencias.

## Ficha de Play Store (borrador)

- **Nombre** (30): OSO · El juego de la O y la S
- **Descripción breve** (80): El juego de papel y lápiz de formar OSO, gratis, sin anuncios y sin
  conexión.
- **Descripción completa:**

  > OSO es el juego de toda la vida de papel y lápiz, ahora en el móvil. Por turnos, cada jugador
  > escribe una O o una S en el tablero. Si formas O-S-O en línea, en horizontal, vertical o
  > diagonal, sumas un punto y vuelves a jugar. Cuando se llena el tablero, gana quien tenga más
  > OSO.
  >
  > - Contra la máquina, en tres niveles: Fácil, Difícil y Extremo.
  > - De 2 a 4 jugadores en el mismo móvil o tableta, también sentados frente a frente.
  > - En línea contra un amigo, con un enlace.
  > - El reto del día: el mismo tablero para todos, cada día.
  > - Extras, temas de colores y secretos por descubrir.
  > - Funciona sin conexión.
  >
  > Lo hicimos en familia: María José enseñó el juego a Julia y Martina mientras esperaban a que
  > terminara natación, y como muchas veces no teníamos papel y boli, Julia y su padre lo
  > convirtieron en una app para jugar en cualquier sitio. Es gratis, sin anuncios y sin compras.

- **Categoría:** Juegos › Tablero. **Etiquetas:** palabras, familia, papel y lápiz.
- **Contacto:** hola@juegaoso.com · https://juegaoso.com · privacidad: https://juegaoso.com/privacidad
- **Recursos gráficos:** icono 512 × 512 (`android/store_icon.png`), imagen destacada 1024 × 500 y
  de 2 a 8 capturas de móvil.

## Pendiente de decidir antes de enviar

- **Público objetivo:** si se marca que incluye menores de 13 años, la app entra en la política de
  Familias, que solo admite SDK de analítica certificados para niños. GA4 y Clarity no lo están.
- **Seguridad de los datos:** declarar la analítica de GA4 y Clarity (interacciones con la app,
  diagnósticos), solo con consentimiento, sin publicidad y sin venderlos.
- **Prueba cerrada:** las cuentas personales nuevas necesitan 12 personas durante 14 días seguidos
  antes de poder publicar en producción.
