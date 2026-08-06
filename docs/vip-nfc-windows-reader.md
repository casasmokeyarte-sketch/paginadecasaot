# Casa VIP - lector NFC USB en Windows

Esta integracion usa el lector detectado como `Generic Contactless Card Reader 0`
mediante PC/SC/CCID y tarjetas NTAG215.

## Antes del primer uso

1. Ejecuta `docs/vip-nfc-pcsc-uid-setup.sql` en Supabase SQL Editor.
2. Conecta el lector USB al PC de recepcion.
3. Abre `tools/Iniciar-Lector-NFC.cmd` y deja esa ventana abierta.
4. Abre `https://casasmokeyarte.com` en Chrome e inicia sesion administrativa.
5. En **Admin -> VIP**, pulsa **Comprobar lector**.

El conector escucha unicamente en `127.0.0.1:8765`. No queda disponible para
otros computadores de la red.

## Vincular una NTAG215

1. La membresia debe estar activa y tener completa la verificacion administrativa.
2. Busca el cliente en **Miembros y solicitudes**.
3. Pulsa **Vincular tarjeta USB**.
4. Cuando el panel lo indique, coloca la NTAG215 sobre el lector.
5. Espera el mensaje **Tarjeta NFC vinculada**.

El UID queda asociado a la credencial VIP en Supabase. Los datos personales no se
escriben dentro de la tarjeta.

## Control de acceso

1. Pulsa **Leer tarjeta para acceso**.
2. Coloca la tarjeta sobre el lector.
3. El panel muestra nombre, numero de miembro, vigencia y visitas disponibles.
4. Si el acceso esta habilitado, usa **Registrar entrada** o **Registrar salida**.

Las reglas existentes de estado, vigencia y verificacion administrativa siguen
aplicandose en el servidor.

## Android y NFC movil

La opcion **Grabar NFC movil** conserva el flujo NDEF existente para navegadores
compatibles. La vinculacion por UID del lector USB es un mecanismo adicional y no
graba datos personales en la NTAG215.

## Si el panel dice que el conector esta apagado

- Confirma que `Iniciar-Lector-NFC.cmd` siga abierto.
- Confirma que Windows muestre `Generic Contactless Card Reader 0`.
- Si Chrome solicita permiso para acceder a dispositivos o servicios locales,
  concedelo solamente al dominio oficial de Casa Smoke.
- Vuelve al panel y pulsa **Comprobar lector**.
