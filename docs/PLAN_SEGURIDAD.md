# Plan — Verificación de seguridad y notificaciones

## Verificación de factores (`lib/seguridad.ts`)
Antes de una **acción sensible**, `verificarFactores(usuarioId, { clave })` valida el/los factores.
- **Hoy:** clave de la cuenta (argon2).
- **A futuro (sumar en el mismo helper, sin tocar las acciones):** OTP por correo, **TOTP (Google Authenticator)**, PIN, biometría (huella/Face ID). La idea es exigir el factor adecuado según la acción y la configuración del usuario.

## Política de verificación (MVP retail-friendly)
Decidido con Luis (2026-05-31). El público es retail; pocos usan 2FA, así que:

- **Indispensable siempre:** la **contraseña de la cuenta** para toda acción sensible.
- **Segundos factores OPCIONALES** que el usuario activa en **Configuración → Seguridad → métodos adicionales**:
  - **PIN**
  - **Biometría** (huella / Face ID)
  - **OTP** (por correo o **Google Authenticator/TOTP**; WhatsApp a futuro)
- **Regla:** la acción **siempre** pide la contraseña; el **segundo factor solo se exige —y solo aparece la opción de usarlo— si el usuario lo tiene activo**. Si no activó ninguno, basta la contraseña. No se le exige un 2FA que no configuró.
- **Notificaciones de OTP** (catálogo de plantillas) **solo se disparan para quienes tienen OTP activo**.
- **Acciones sensibles** (donde aplica `verificarFactores`): **publicar/crear un san**, **agregar/editar/eliminar métodos de pago** (ya con clave), **cambio de clave**, **retiros cripto** (futuro), **cierre de san**.

### Pantalla 2FA y jerarquía (estilo Binance — funcionalidad, estética nuestra)
Referencia: capturas de Binance (2026-05-31). Tomar la **lógica**, no la estética.

- Título **"Autenticación de dos factores (2FA)"** + "activa al menos 2 métodos".
- Métodos en **tarjetas** con **✓ verde** si activos: **biometría/llave de acceso**
  (badge "Recomendado", WebAuthn/passkeys), **app de autenticador** (TOTP),
  **email/OTP**, **PIN**, **contraseña**.
- **Jerarquía de fuerza** (fuerte → débil): **biometría > authenticator (TOTP) >
  email (OTP) > PIN**. Para una acción sensible se pide **solo el factor más fuerte
  que el usuario tenga activo** (no todos). Si no tiene ninguno: no se pide 2FA,
  pero igual se muestra la advertencia.
- **Cambio de contraseña** (flujo Binance):
  1. Alerta **"Restricciones de cuenta"** (Cancelar / Continuar): "es posible que
     se desactiven 24 h los retiros, P2P y servicios de pago si cambiaste tu
     contraseña". Es un freno anti-robo: tras cambiar la clave, **bloquear 24 h**
     retiros/transferencias de la wallet y unirse/crear ahorros.
  2. Al continuar, pedir el **factor más fuerte** activo.
  3. Recién entonces, formulario de nueva contraseña.

### Estado de implementación (2026-05-31)
- ✅ `verificarFactores` valida clave + PIN + OTP correo.
- ✅ Pantalla 2FA con tarjetas (PIN y email funcionales; biometría y authenticator
  como "Pronto").
- ⏳ Pendiente: jerarquía (pedir solo el más fuerte) en un **modal de verificación**
  reutilizable; TOTP (otplib + QR); biometría (WebAuthn); flujo de cambio de
  contraseña con advertencia + bloqueo 24 h; enganchar a crear san.

## Avisos de seguridad de la cuenta (nuevo inicio de sesión / IP nueva)
Idea pedida por Luis (2026-05-31). Cuando se detecta un **inicio de sesión desde
una IP o dispositivo nuevo** (no visto en cierto periodo), enviar aviso
**in-app + correo** con los detalles de la conexión: **IP**, **dispositivo /
user-agent**, **país** y **fecha y hora**, más la recomendación de **cambiar la
contraseña** y contactar soporte si no se reconoce la actividad.
- Requiere **registrar IP/dispositivo por sesión** (`Sesion`) y comparar con el
  histórico para decidir si es "nuevo".
- Es una plantilla más del catálogo de notificaciones
  ([PLAN_NOTIFICACIONES.md](PLAN_NOTIFICACIONES.md)).

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
