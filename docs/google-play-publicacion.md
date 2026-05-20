# Publicar Casa Smoke y Arte en Google Play

Esta guia te deja la app en linea usando Android App Bundle (.aab).

## 1) Requisitos previos

- Tener cuenta de Google Play Console activa.
- Tener politica de privacidad publicada (URL publica HTTPS).
- Tener icono, capturas y descripcion de la app.

## 2) Crear llave de subida (upload key)

Ejecuta en PowerShell (una sola vez):

```powershell
keytool -genkeypair -v -keystore C:\Users\PC\keys\casa-smoke-upload-key.jks -alias upload -keyalg RSA -keysize 2048 -validity 10000
```

Si no tienes `keytool`, instala JDK 17+ y vuelve a intentar.

## 3) Configurar firma local

1. Copia `android/key.properties.example` como `android/key.properties`.
2. Rellena estos datos:

```properties
storeFile=C:/Users/PC/keys/casa-smoke-upload-key.jks
storePassword=TU_PASSWORD
keyAlias=upload
keyPassword=TU_PASSWORD
```

## 4) Generar el AAB

Desde la raiz del proyecto:

```powershell
npm install
npm run android:bundle
```

Salida esperada del bundle:

- `android/app/build/outputs/bundle/release/app-release.aab`

## 5) Subir a Google Play Console

1. Ve a tu app en Play Console.
2. Entra a `Probar y publicar` > `Prueba interna`.
3. Crea una version nueva.
4. Sube `app-release.aab`.
5. Completa notas de version.
6. Guarda y envia a revision.

## 6) Completar formularios obligatorios

En tu captura faltan secciones de politicas. Completa como minimo:

- Seguridad de los datos.
- Aplicaciones gubernamentales (normalmente: no).
- Funciones financieras (normalmente: no, salvo que aplique).
- Salud (normalmente: no, salvo que aplique).

Ademas revisa:

- Clasificacion de contenido.
- Publico objetivo.
- Acceso a la aplicacion (si requiere login, agrega usuario demo para revision).

## 7) Produccion (ponerla en linea)

Cuando la prueba interna este estable:

1. Ve a `Produccion`.
2. Crea version nueva.
3. Usa el mismo `app-release.aab` o una version nueva.
4. Envia a revision y espera aprobacion.

## 8) Versionado para futuras subidas

Cada nueva subida debe aumentar `versionCode` en `android/app/build.gradle`.

Ejemplo:

- `versionCode 3` -> `versionCode 4`
- `versionName "1.0.2"` -> `versionName "1.0.3"`

## 9) Checklist rapido antes de enviar

- App abre sin crasheos.
- Navegacion principal funciona.
- Politica de privacidad accesible.
- Formularios de Play Console completos.
- AAB firmado y subido.
