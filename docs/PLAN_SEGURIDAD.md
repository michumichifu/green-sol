# Plan — Verificación de seguridad y notificaciones

## Verificación de factores (`lib/seguridad.ts`)
Antes de una **acción sensible**, `verificarFactores(usuarioId, { clave })` valida el/los factores.
- **Hoy:** clave de la cuenta (argon2).
- **A futuro (sumar en el mismo helper, sin tocar las acciones):** OTP por correo, **TOTP (Google Authenticator)**, PIN, biometría (huella/Face ID). La idea es exigir el factor adecuado según la acción y la configuración del usuario.

## Notificaciones de eventos (`lib/notificaciones.ts → notificarYCorreo`)
Todo cambio sensible o hito importante avisa **en la app (campanita) y por correo**:
- Para que el usuario sienta la app "viva" y atendida.
- Para seguridad: si recibe un aviso de algo que no hizo, puede reaccionar rápido.

## Estado actual (implementado)
- **Métodos de pago** (agregar / editar / eliminar): exigen **confirmar con la clave** + avisan en app y correo. Eliminar pide clave (acción destructiva).
- **Crear ahorro:** avisa en app y correo ("¡Creaste tu ahorro!").

## Pendiente (aplicar el mismo patrón)
- Extender `verificarFactores` con OTP por correo y TOTP (cuando el usuario los active).
- Pedir verificación en otras acciones sensibles: cambio de clave, cambio de datos de perfil, retiros (cripto), cierre de san, etc.
- Avisos por correo+app en eventos del san: invitación, sorteo de turnos, pago reportado/confirmado/rechazado, cierre (hoy varios existen solo in-app).
- Sección **Seguridad** del perfil: activar 2FA (TOTP), PIN, cambiar clave.
