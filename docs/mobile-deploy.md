# Guia de despliegue movil (Android + iOS)

Este proyecto ya esta preparado con Capacitor para empaquetar la app web de Vite como aplicacion nativa.

## 1) Comandos base

- Sincronizar cambios web a nativo:
  - npm run mobile:sync
- Abrir proyecto Android en Android Studio:
  - npm run android:open
- Abrir proyecto iOS en Xcode (solo macOS):
  - npm run ios:open

## 2) Android (Play Store)

Requisitos:
- Android Studio instalado
- JDK 17+
- Cuenta de Google Play Console

Pasos:
1. Ejecuta npm run mobile:sync
2. Ejecuta npm run android:open
3. En Android Studio, espera a que termine Gradle Sync
4. Configura firma release en Build > Generate Signed Bundle / APK
5. Genera Android App Bundle (.aab)
6. Sube el .aab a Play Console (Production o Internal testing)
7. Completa ficha: capturas, descripcion, politica privacidad y clasificacion

Notas:
- El package name actual es com.casasmokeyarte.app
- Si vas a cambiarlo, hazlo antes de publicar en tienda

## 3) iOS (App Store)

Requisitos:
- Mac con Xcode instalado
- CocoaPods instalado (gem install cocoapods)
- Cuenta Apple Developer activa

Pasos:
1. Ejecuta npm run mobile:sync
2. En macOS, entra a ios/App y ejecuta pod install
3. Ejecuta npm run ios:open
4. En Xcode, configura Signing & Capabilities con tu Team
5. Ajusta version y build number
6. Product > Archive
7. Sube a App Store Connect con Organizer
8. Completa metadata y envia a revision

## 4) Flujo recomendado para cada cambio

1. npm run mobile:sync
2. Probar en emulador/dispositivo Android
3. Probar en simulador/dispositivo iOS
4. Generar build release (.aab / archive)

## 5) Checklist antes de publicar

- Icono app 1024x1024 actualizado
- Splash screen personalizado
- Politica de privacidad publicada (URL valida)
- HTTPS en todas las APIs externas
- Version y build number incrementados
- Pruebas de login, pagos/chat y permisos en dispositivo real
