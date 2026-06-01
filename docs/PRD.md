# PRD — Green Sol

> Proyecto del Solana Vibe Bootcamp (Venezuela). App para **gestionar el ahorro en grupo de forma transparente** (san/bolso/susi por turnos, o pote/vaca por meta) y dividir cuentas, con **reputación de usuarios**. Método tradicional o cripto sobre Solana, sin que la app custodie dinero a la fuerza. **La finalidad es servir de puente al ahorro en cripto** para la comunidad hispana.

- **Versión:** 0.11 (núcleo del MVP **construido y verificado** + **KYC propio completo**, app v0.0.54). Estado de desarrollo en [CHANGELOG.md](../CHANGELOG.md); diseño en [superpowers/specs/2026-05-29-green-sol-mvp-design.md](superpowers/specs/2026-05-29-green-sol-mvp-design.md) y [superpowers/specs/2026-05-31-kyc-verificacion-identidad-design.md](superpowers/specs/2026-05-31-kyc-verificacion-identidad-design.md).
- **Fecha:** 2026-06-01
- **Fase:** 1 — MVP en construcción. **Núcleo tradicional construido** (auth con OTP, ahorros san/vaca con **asistente de creación por pasos** —incluido el paso de **método de pago elegido del perfil**—, **unirse por enlace/código**, tasas en vivo, calculadora, navegación de 5 pestañas con header de nivel y avisos, dashboard, pagos, **reputación por puntos y niveles**, **métodos de pago rediseñados** (modelo `MetodoPago` fiat/cripto con agregar/editar/eliminar), **verificación por clave** y **avisos en app + correo** en acciones sensibles, perfil/configuración, **panel super-admin con métricas y restricciones**, onboarding), verificado con build + tests unitarios + E2E (Playwright). Pendiente: capa cripto (bloque 7), referidos, calendario de turnos con fechas, despliegue. Entrega de primera versión: **1 de junio de 2026, 5:30 p.m.**
- **Nombre:** Green Sol (sol verde). Descartado: Cochino.

Versión visual: [PRD.html](PRD.html). Técnica: [ARQUITECTURA_TECNICA.md](ARQUITECTURA_TECNICA.md), [INTEGRACIONES_API.md](INTEGRACIONES_API.md) y [SEGURIDAD_Y_WALLETS.md](SEGURIDAD_Y_WALLETS.md).

---

## 0. Estado del proyecto (sesión 2026-06-01, sobre v0.0.54)

Foto rápida de qué funciona, qué falta y qué se decidió en la última conversación.

### ✅ Implementado (ya funciona)

- **Autenticación:** registro/login con **correo + contraseña** (política de clave segura con generador aleatorio), **verificación y 2FA por OTP al correo** vía SMTP propio, sesión por cookie.
- **Onboarding:** carrusel a pantalla completa con infografías y checkbox "no volver a mostrar" (`onboardingCerrado`), pantalla de carga con logo.
- **Navegación:** **5 ítems** (Ahorro · Pagos · **Inicio** · Calculadora · Perfil) + **header** sticky con **etiqueta de nivel** y **campana de avisos** (panel desplegable); **transición de fade** entre pestañas.
- **Dashboard:** hero con saludo + puntos/nivel, accesos rápidos, **tasas de hoy** (BCV/USDT/SOL del caché global) y "Tus ahorros".
- **Calculadora** rediseñada (`components/calculadora.tsx`): origen entre **Bolívares · Dólar BCV · USDT · Solana**, símbolo como prefijo, cotización del día y conversiones a las otras tres (lee del caché global).
- **Sección Ahorro:** landing "Ahorros" (Crear/Unirme/Guía), **asistente de creación por pasos** (tipo → título+descripción → visibilidad → moneda → detalles del san con **meta por turno anclada en dólares**, aporte por persona calculado, **frecuencia con días personalizables** y duración estimada → **método de pago elegido del perfil** → resumen), **unirse por enlace/código** (acepta `?codigo=`), **compartir** (código, copiar enlace, compartir nativo) y **guía visual**.
- **Pagos:** aportes por confirmar / rechazados y ahorros activos con turno/posición.
- **Perfil (hub) y Configuración** por pestañas (Datos · Pagos · Seguridad · Avisos), con **validación de nombre de usuario en vivo**.
- **Métodos de pago rediseñados** (modelo `MetodoPago` fiat/cripto): crear (flujo categoría → moneda → método → datos, con monedas futuras deshabilitadas "Pronto"), **editar** y **eliminar**; enfoque MVP = VES + USD (+ cripto USDC/SOL).
- **Seguridad y avisos:** `lib/seguridad.ts` (`verificarFactores`, hoy con la clave) — agregar/editar/eliminar método de pago **pide confirmar con la clave** y **avisa en app + correo** (`notificarYCorreo`), igual que al **crear un ahorro**.
- **Reputación:** puntos = estrellitas + niveles (Nuevo → Confiable → Destacado → Estrella → Leyenda) en `lib/reputacion.ts`; valoraciones (manito +/−) al cerrar.
- **Restricciones** (lista negra de palabras) en nombre/apellido/usuario; **panel super-admin** con 5 pestañas (Métricas reales · Usuarios · Restricciones · SMTP · App).
- **Datasets:** `lib/bancos-venezuela.ts` (25 bancos), `lib/monedas.ts` (monedas fiat + futuras + métodos por moneda + cripto).
- **Páginas** Recompensa (`/recompensa`) y Centro de ayuda (`/ayuda`).
- **Tasas:** caché global refrescado por cron (`/api/cron/tasas`); toda la app lee del caché.
- **SMTP real funcionando:** el super-admin carga el SMTP (host `mail.proyecciondigital.org` —el del certificado, mismo servidor que `mail.creceideas.com`—, puerto **465** SSL, buzón `no-responder@greensol.creceideas.com`), con **Verificar conexión** y **Enviar correo de prueba**. `lib/mailer.ts` toma la config de la base de datos y, si no, de variables de entorno; soporta correo HTML.
- **Panel super-admin reorganizado:** pestañas principales **Métricas · Usuarios · Configuración**; dentro de Configuración, **subpestañas** General · SMTP · Plantillas · Restricciones. El form SMTP tiene **toggle de conexión segura (SSL/TLS)**, **remitente en dos campos** (nombre + correo) con un "Aparece como…" automático, botón verde de marca y **toast**; la contraseña se conserva si se deja vacía. Responsive corregido (sin scroll horizontal; pestañas scrollables en móvil).
- **Sistema de plantillas de notificaciones** (`lib/correo/`): catálogo de eventos, cada uno con los **canales que aplica** (app y/o correo — p. ej. el OTP es solo correo); plantillas **HTML con la marca** (verde, wordmark, footer) y **override editable en la base de datos** (fallback al default del catálogo). **Editor visual** en super-admin: **grid de tarjetas** por categoría con iconos ver/editar, **modal con pestañas Aplicación / Correo**, **barra de formato** (negrita, cursiva, subrayado, tachado, color, resaltado; y enlace, imagen por URL, lista y línea divisoria en correo), **vista previa** en iframe (correo) o tarjeta (app), **variables clickeables**, guardar / restablecer / enviar prueba, y **borrador en localStorage** (no se pierde al cerrar). El correo de prueba del SMTP usa este sistema.
- **Cimientos de seguridad — 2FA:** campos `pinHash` y `otpCorreoActivo` en `Usuario`; `lib/seguridad.ts → verificarFactores` valida **clave (siempre) + PIN + OTP por correo** (solo los factores activos). Pantalla **Configuración → Seguridad** "Autenticación de dos factores (2FA)" con **tarjetas** (PIN configurar/quitar con clave, código por correo con toggle, **biometría** —Recomendado— y **app de autenticador** como "Pronto"). **Cambio de contraseña** funcional con la regla: **no se permite sin al menos un 2FA activo**.
- **Proceso de verificación inicial:** **notificación in-app** al registrarse ("Completa tu verificación — agrega un método de seguridad"); **banner ámbar** discreto en el dashboard (entre el hero y los accesos rápidos) que desaparece al activar un 2FA; pestaña **Configuración → Verificación** con checklist (correo verificado · agrega 2FA · verificación de identidad), contador a /3.
- **KYC propio (manual, sin terceros) — completo de punta a punta:** almacenamiento privado **MinIO/S3** (`lib/almacenamiento.ts`, URLs firmadas; el navegador sube al servidor y este reenvía, sin exponer MinIO); modelo `VerificacionKyc` (una fila por intento) con **máquina de estados** (`pendiente → en_revision → aprobada / rechazada / reenvio_solicitado / baneada`, transiciones bloqueadas en server actions); **asistente del usuario** (documento cédula V/E o pasaporte con anverso/reverso, selfie, **video de liveness 7-10 s con `MediaRecorder`** y guía en pantalla) que solo muestra los **pasos activos**; **pasos configurables por toggles** (`KYC_REQUIERE_*`) desde el panel; **cola de revisión en super-admin** (pendientes/aprobadas/rechazadas, ver documentos con URL firmada, tomar, **aprobar / pedir reenvío / rechazar / rechazar y banear**, motivo + nota interna); al aprobar sube `nivelKyc` y aparece el **tag "Verificado"** verde en el perfil; **notificaciones app + correo** en cada cambio de estado. QA E2E integral (usuario→admin→aprobado) verde. Diseño y plan en `docs/superpowers/`.

### ⏳ Pendiente (roadmap, de IDEAS_FUTURAS / PLAN_METODOS_PAGO / PLAN_SEGURIDAD / PLAN_NOTIFICACIONES / PLAN_KYC / PLAN_ADMIN)

- **Integración cripto:** wallet embebida no-custodial entregada en el **registro** (mostrar dirección + llave difuminada con ícono de ojo, bajo responsabilidad del usuario), **billetera en el dashboard**, **depósitos/retiros/transferencias**, multifirma/modo espejo; todo primero en **DevNet**. La wallet **principal** como método de pago predefinido sale de aquí.
- **Sistema de referidos:** código por usuario (copiar/compartir), **+40 puntos a ambos** cuando el referido se registra con el código y hace su **primer aporte**, **máximo 5** premiados, **solo cuentas nuevas**, acreditación única; luego **club de canje** de puntos. Toca el esquema (`codigoReferido`, `referidoPorId` en `Usuario`).
- **Calendario de turnos con fechas:** hoy `Turno` solo tiene `posicion` y `cobrado`; añadir `fechaInicio` + frecuencia → fechas por turno para la pestaña Pagos.
- **Código de invitación corto** propio (hoy se usa el `id`/cuid).
- **Despliegue:** Vercel (auto-redeploy con GitHub) + **base de datos en el VPS**.
- **Almacenamiento de comprobantes:** subir captura del pago. La infraestructura **MinIO/S3** ya existe (`lib/almacenamiento.ts`, usada por el KYC); falta engancharla al flujo de aportes (`comprobanteUrl`).
- **Monedas y bancos de otros países** (reactivar `MONEDAS_FIAT_FUTURAS` país por país).
- **Marketplace público**, dividir cuentas, KYC con proveedor, login con Google y con wallet.

### 🆕 Pendientes nuevos de esta conversación (2026-05-31)

- **Modal de verificación con jerarquía** (estilo Binance — funcionalidad, estética nuestra): al confirmar una acción sensible, pedir **solo el factor más fuerte** que el usuario tenga activo (**biometría > authenticator > email > PIN**); si no tiene ninguno, no se pide pero igual se avisa. Enganchar a **crear/publicar san** y **métodos de pago**. Ver [PLAN_SEGURIDAD.md](PLAN_SEGURIDAD.md).
- **Más factores 2FA:** **TOTP** (Google Authenticator: otplib + QR), **biometría** (WebAuthn/passkeys) y **teléfono** (SMS / WhatsApp vía Evolution API) como dato y como 2FA.
- **Flujo de cambio de contraseña** completo: alerta **"Restricciones de cuenta"** (Cancelar/Continuar) + **bloqueo de 24 h** de retiros/P2P/pagos y de unirse/crear ahorros, y pedir el factor más fuerte antes de cambiar.
- ~~**KYC manual propio**~~ → **✅ Implementado** (ver sección Hecho). Pendientes derivados: **conectar las plantillas del editor** a las notificaciones KYC (hoy usan la plantilla de marca de `notificarYCorreo`), **verificación de teléfono** por WhatsApp/SMS, **niveles con límites por monto**, **foto de perfil** del usuario, y a futuro un **proveedor externo** (Sumsub/Veriff) + detección automática de liveness.
- **Gestión de usuarios super-admin** rediseñada: **tarjetas** con datos básicos (nombre, @usuario, correo, teléfono), **detalle en pop-up** (participaciones, intentos de cambio de clave/correo/nombre, documentos KYC), **editar/sancionar**, **nombre de usuario cambiable solo cada 30–60 días**. Y **notificaciones personalizadas** del super-admin (global / un usuario / un grupo, in-app y/o correo). Ver [PLAN_ADMIN.md](PLAN_ADMIN.md).
- **Conectar las plantillas a los eventos reales** (OTP del registro, métodos de pago, san creado / unión): hoy el catálogo y el editor existen, pero los disparos siguen con textos viejos. Y **renderizar el formato (HTML)** en la campanita in-app.
- **Avisos por correo + app en todos los eventos del san:** invitación, sorteo de turnos, pago reportado/confirmado/rechazado, cierre (hoy varios solo in-app).

> **Pendiente de prueba / QA manual por el usuario:** verificar visualmente lo de esta sesión — el **editor de plantillas** (barra de formato, vista previa, borrador, enviar prueba), la pantalla **2FA** (activar PIN/OTP, cambio de contraseña con la regla de 2FA), el **banner del dashboard** y la **sección Verificación**, y el panel **SMTP** (verificar conexión y envío de prueba con la plantilla de marca). Más el **flujo completo de crear y finalizar un san** y el **registro + verificación OTP**.

---

## 1. Resumen ejecutivo

Green Sol digitaliza y hace **transparente** una práctica que en Venezuela y Latinoamérica todos conocen: juntar dinero en grupo. Tres formas con el mismo motor:

1. **San / bolso** — recolecta **rotativa** por turnos.
2. **Pote / vaca** — recolecta hacia una **meta común**.
3. **Dividir una cuenta** — repartir un **gasto a pagar**.

Cada recolecta puede ser **tradicional** (la app organiza y cada quien reporta pagos; el dinero va por fuera, en Bs o efectivo) o con **cripto** (USDC/SOL sobre Solana). Y como aquí se maneja dinero entre personas, el corazón de la confianza es un **sistema de reputación**: cada quien construye un historial visible (puntuación, estrellitas) que se gana o se pierde según su responsabilidad.

**Posicionamiento (finalidad cripto-first).** Green Sol no es "una app que de paso funciona sin cripto". Su **finalidad es el ahorro en cripto sobre Solana** para la comunidad cripto hispana, y a la vez ser la **puerta de entrada** para que quien aún no usa cripto empiece con dinero fiat tradicional (lo que ya conoce) y **migre** a un ahorro en cripto ordenado, profesional y con control. El modo sin-cripto es el **puente que reduce la fricción**, no el destino.

Técnicamente, Green Sol es una **app híbrida con componente dApp**, no una dApp pura: la mayor parte funciona como una web tradicional (sin tocar una wallet), y la capa **dApp** sobre Solana (botes en USDC, multifirma, firmas) se activa cuando una recolecta elige cripto. Es una decisión de diseño para reducir fricción y facilitar el onboarding.

> **Sobre el "MVP":** los tres tipos se desarrollan (por fases). El **san/bolso** y el **pote/vaca** son el gancho de promoción; dividir cuentas llega después. La **reputación se implementa desde el inicio** (no es opcional: con dinero no se juega).

## 2. Problema que resuelve

- **Los sanes y vacas se manejan a ciegas:** alguien guarda el dinero y el resto confía; no hay transparencia ni forma de saber con quién te estás metiendo.
- **Ahorrar en bolívares no protege el valor** (inflación, tasa BCV irreal). La gente quiere dólares pero no sabe usar USDT/USDC.
- **Las apps que dicen "mete tu dinero aquí" generan rechazo.** Green Sol organiza y da transparencia, no custodia a la fuerza.
- **El san tiene muchos morosos e irresponsables.** Sin reputación, no hay forma de prever quién cumplirá.
- **Entrar a cripto da miedo o parece complicado.** Falta un puente amable desde lo que la gente ya hace (san, vaca en Bs) hacia el ahorro en cripto.

## 3. Principio rector de UX

¿Reduce la fricción y la desconfianza de alguien que nunca ha usado cripto?

1. La app **vale sin cripto**: registro transparente de la recolecta (puente de entrada).
2. **Cripto sobre Solana** como destino: respaldar/recibir en USDC/SOL, nunca custodiar a la fuerza.
3. **Registro rápido**; cédula/KYC solo para funciones de dinero.
4. **Transparencia pública** dentro del grupo: turnos, aportes, mora y **reputación**.
5. **Lenguaje humano**, tooltips y guías claras.

## 4. Los tres tipos de recolecta

- **Susi · San · Bolso (por turnos) — gancho principal.** Los tres nombres son **lo mismo**: aporte periódico y reparto rotativo por turnos. Ej.: 5 personas, cada una recibe $100; dura 5 semanas; cada semana todos aportan $20 y a uno le toca cobrar los $100. Quien cobra primero sigue aportando. Ahorro disciplinado y muy popular. (En el modelo de datos es `tipo = san`.)
- **Vaca · Pote (meta común).** Todos aportan (igual o distinto) hasta llegar a una meta, sin fechas fijas, y luego se gasta o reparte. (En el modelo de datos es `tipo = vaca`.)
- **Dividir una cuenta (fase posterior).** Repartir un **gasto a pagar** entre varios; cada quien ve cuánto le toca. **No es ahorro**; aparece en la guía como método aparte y aún no está implementado como recolecta.

> **Terminología (importante, ya aplicada en la app):** **San · Susi · Bolso = por turnos** (los tres son lo mismo); **Vaca · Pote = meta común**; **Dividir una cuenta = repartir un gasto** (no es ahorro).

## 5. Público o privado, y marketplace

Al crear una recolecta se elige su visibilidad:

- **Privado:** solo las personas que invites (amigos, familia, conocidos).
- **Público:** aparece en un **marketplace** donde otros usuarios pueden verlo y solicitar unirse.

El **marketplace público** es una meta **a futuro y ambiciosa**, pero se diseña desde ya porque depende de la reputación (sección 10): unirse a un bolso de desconocidos solo tiene sentido si puedes ver su historial y el del organizador.

## 6. Método por recolecta: tradicional o cripto

No es un modo global: cada recolecta elige su método.

**Tradicional (la app organiza, el dinero va por fuera):**
- Referencia en USDT y/o Bs, a la tasa que elijan.
- Métodos: efectivo (más para bolsos en dólares físicos), transferencia bancaria o pago móvil.
- Al crear: **datos de la cuenta destino** (tipo, banco con su código, titular, número, tipo de cuenta).
- Cada participante **reporta su pago**: comprobante (captura), referencia, fecha, monto, banco origen/destino.

**Cripto (sobre Solana):**
- Referencia y movimiento en USDC (o SOL).
- **Wallet embebida no-custodial:** al registrarse con correo, la app crea automáticamente una wallet de Solana **sin custodiar las llaves** (MPC/TEE o llave cifrada con un secreto del usuario; ni la app ni el proveedor tienen la llave completa). En el **onboarding** se muestra primero la **dirección** de la wallet y luego la **llave secreta** (difuminada, con ícono para revelarla, copiarla y guardarla **bajo responsabilidad del usuario**), con instrucciones claras del respaldo.
- **Movimientos del usuario:** depósitos, retiros y transferencias desde su panel; o **autocustodia / wallet externa** (Phantom/Solflare) que la app refleja (modo espejo).
- El **bote de grupo** seguro usa **multifirma**.
- Toda la capa cripto se prueba **primero en devnet**; dinero real solo tras validación. Es no-custodial y de alto estándar de seguridad web3.

## 7. Moneda, tasas y equivalencia en bolívares

Cada monto muestra un **tag con el equivalente en Bs** a la tasa elegida: **BCV**, **USDT** (mercado/cripto, aproximada) o **personalizada**. En preferencias: moneda por defecto (Bs/USDC) y tasa. Las tasas son **solo informativas**, nunca mueven fondos.

**Fuentes de datos (detalle en [INTEGRACIONES_API.md](INTEGRACIONES_API.md)):**
- **BCV oficial** y **USDT P2P (Binance):** API externa de tasas de un proveedor venezolano. Es una **API privada de uso propio**: sus endpoints y la API key **no van en el repo** (Green Sol es open source); viven en `_privado/` y en variables de entorno.
- **Precio de SOL / USDC:** **DexScreener** (API pública, sin key).

**Estrategia de consulta y caché (clave — no saturar las APIs):** nunca se llama por usuario ni por acción. Se hace **una consulta global** de la app, se **cachea** con su timestamp, y todos los usuarios, sanes y la calculadora **leen del caché**. Frecuencias (hora de Venezuela, VET = UTC−4):

| Fuente | Refresco |
| --- | --- |
| BCV | **2× al día** (09:00 y 16:00) |
| USDT (Binance) | cada **1–2 h** |
| SOL/USDC (DexScreener) | cada **1–2 h** |

Implementado con un **cron / scheduled job** (Vercel Cron). El WebSocket de USDT del proveedor es opcional para una vista "en vivo" sin sumar llamadas REST.

> **Aviso legal** (mostrar donde se vean tasas): los datos provienen de [bcv.org.ve](https://www.bcv.org.ve); Green Sol no se responsabiliza por su veracidad ni actualización; el **BCV es el único ente autorizado** para modificar la tasa oficial en Venezuela.

## 8. Calculadora de cotizaciones

Herramienta clave accesible desde la **barra de navegación** (sección 12). **Implementada** (`components/calculadora.tsx`): primero **eliges la moneda de origen** entre cuatro —**Bolívares**, **Dólar BCV**, **USDT** y **Solana** (la etiqueta "Dólar BCV" es explícita; **no hay euro**)— y escribes el monto con el **símbolo de la moneda como prefijo** (Bs, $, USDT, SOL). Debajo se muestra la **cotización del día** de esa moneda y, en tarjetas, las **conversiones a las otras tres**.

Convierte en ambos sentidos:

- **Bolívares** ↔ dólar a tasa **BCV** y **USDT** (paralelo).
- **Dólar BCV** (≈ dólar oficial / digital).
- **SOL** (a su precio del día vía DexScreener; valorado en Bs vía USDT, con caída a BCV si no hay USDT).

Es más completa que las calculadoras de tasas venezolanas habituales (que solo hacen Bs↔USD): aquí se suma SOL, leyendo del **caché global** (sección 7) para no consultar las APIs en cada cálculo. Ejemplos: "¿cuántos Bs son 20 USDT?", "¿cuántos Bs equivale 1 SOL?", "¿cuánto SOL son 50 dólares BCV?".

## 9. Turnos del san y mora

- **Turnos:** orden **al azar** (animación: dado, ruleta, carrusel) o **manual**. Siempre **público**: todos ven quién giró y a quién le tocó.
- **Mora:** la app **notifica al grupo, al moroso y al administrador** (sección 13). **Multa por mora opcional** (porcentaje o monto fijo, en USDC/SOL/Bs). La mora también **baja la reputación** (sección 10).

## 10. Reputación y confianza (clave, desde el inicio)

Con dinero no se juega; saber con quién te metes es esencial.

- Al **cerrar un bolso**, cada participante puede **valorar a los demás**: **manito arriba (+1)** o **manito abajo (−1)** y un **comentario** sobre la experiencia. Todo se almacena.
- El perfil muestra la **puntuación** (positivos vs negativos) y su equivalente visual en **estrellitas**.
- La reputación **baja por retrasos y mora**.

**Puntos y niveles (estilo Cashea) — implementado.** Los **puntos = estrellitas** son un **acumulado** (las valoraciones positivas recibidas), **ya no un ratio de 5 estrellas**. Según los puntos, el usuario sube de **nivel** (lógica en `lib/reputacion.ts`, función `nivelPorReputacion`):

| Nivel | Nombre | Puntos mínimos |
| --- | --- | --- |
| 1 | Nuevo | 0 |
| 2 | Confiable | 5 |
| 3 | Destacado | 15 |
| 4 | Estrella | 30 |
| 5 | Leyenda | 60 |

El nivel se muestra como **"Nivel N · Nombre"** en el **header** (etiqueta enlazada a `/recompensa`), en el **hero del dashboard** y en la **tarjeta de identidad del perfil** (puntos + positivos/negativos). La página **`/recompensa`** detalla el progreso al siguiente nivel.
- **Al unirse a un san**, se ve a el/los **organizador(es)** (pueden ser varios) y su historial: cuántos sanes han hecho, montos, cuántos **completados** vs **no concretados**, y de qué tipo (público/privado, tradicional/cripto, Bs/USDC/SOL). También se ve quién más se unió, su nombre/usuario y su reputación.
- Aplica **incluso en planes privados**: ver quién entró y su puntuación.
- Responsabilidad: la plataforma presta la herramienta y la transparencia; **organizar y cumplir es responsabilidad de los usuarios**.

> Referencia a investigar: **Cashea** (app venezolana de cuotas) tiene un sistema de puntuación muy logrado; hay info pública. El modelo base de Green Sol es simple (manito +/−, estilo P2P de Binance), pero conviene estudiar Cashea para evolucionarlo.

## 11. Dashboard del usuario

Pantalla principal (`app/(app)/dashboard/page.tsx`, ruta `/dashboard`), con lo esencial de un vistazo. **Implementada así:**

- **Hero de bienvenida:** saludo por nombre ("¡Hola, …!") y, a la derecha, **puntos y nivel** (estrellita + número de puntos + "Nivel N · Nombre", enlazado al perfil).
- **Accesos rápidos:** dos tarjetas — **Nuevo ahorro** (`/sanes/crear`) y **Calculadora** (`/calculadora`).
- **Tarjeta de tasas de hoy:** BCV, USDT y SOL/USDC del caché global (sección 7), con enlace a la calculadora.
- **"Tus ahorros":** lista de las recolectas en las que participa (san por turnos / vaca meta común), con su estado; estado vacío que invita a crear el primero.
- **Saldo de wallet:** pendiente de la capa cripto (fase 2); aún no se muestra.

> El bloque de saldo en wallet con equivalente en Bs queda para la fase cripto.

## 12. Navegación (barra inferior)

La app usa un **menú de navegación inferior** (bottom nav, estilo app móvil). **Implementado** (`components/bottom-nav.tsx`) con **5 ítems**, "Inicio" al centro:

| Orden | Ítem | Ruta | Ícono (Lucide) |
| --- | --- | --- | --- |
| 1 | Ahorro | `/sanes` | `Wallet` |
| 2 | Pagos | `/pagos` | `CalendarClock` |
| 3 | **Inicio** (centro) | `/dashboard` | `Home` |
| 4 | Calculadora | `/calculadora` | `Calculator` |
| 5 | Perfil | `/perfil` | `User` |

**Header superior** (`components/app-header.tsx`, sticky): logo de Green Sol (a `/dashboard`), **etiqueta de nivel** ("Nivel N · Nombre", enlazada a `/recompensa`) y **campana de avisos** con contador de no leídos que abre un **panel desplegable** de notificaciones (últimas 8, "Marcar leídas", enlace a `/notificaciones`). Entre pestañas hay una **transición de fade** (`app/(app)/template.tsx`). Diseño responsive: la barra inferior en móvil; en escritorio puede pasar a lateral o superior.

## 12b. Sección Ahorro: crear, unirse, compartir y guía (implementado)

La pestaña **Ahorro** (`app/(app)/sanes/`, ruta `/sanes`) es el corazón funcional ya construido:

- **Landing "Ahorros"** (`sanes/page.tsx`): título "Ahorros" (ya **no** se titula "Sanes & Vacas") con tres acciones — **Crear ahorro** (`/sanes/crear`), **Unirme** (`/sanes/unirse`) y **¿Cómo funciona el ahorro?** (`/sanes/guia`) — y la lista de "Tus ahorros" con estado vacío que invita a crear o unirse.

- **Asistente de creación por pasos** (`sanes/crear/page.tsx`, con **barra de progreso**):
  1. **Tipo:** Susi·San·Bolso (por turnos) o Vaca·Pote (meta común), con etiqueta colorida ("Por turnos" / "Meta en común").
  2. **Título y descripción:** "¿Qué título le quieres poner a tu san/vaca?" + un campo de **descripción** con ejemplo (campos `nombre` y `descripcion`).
  3. **Visibilidad:** privado (solo invitación; nota de que luego se invita por correo, usuario o enlace) o público (cualquiera puede unirse).
  4. **Moneda:** Bs (tasa BCV), Bs (paralelo/USDT), USDC (Solana) o Solana — claves `bs_bcv`, `bs_usdt`, `usdc`, `sol` (`lib/validations/recolecta.ts`); con **tooltip** explicativo. El monto se escribe con el **símbolo de la moneda como prefijo**.
  5. **Detalles según tipo:** el **san** pide, en orden, **nº de participantes (manos, 2–50)** → **meta por turno anclada en dólares** (se paga en Bs a la tasa del día) → **aporte por persona calculado** (= meta ÷ participantes) → **frecuencia** (semanal/quincenal/mensual o **"Personalizar"** con días a medida, campo `frecuenciaDias`) → **duración estimada** (en días y su equivalente en semanas, p. ej. "~75 días (≈11 semanas) · 5 turnos"); la **vaca** pide la **meta**.
  6. **Método de pago:** el organizador **elige uno de sus métodos de pago del perfil**, **filtrado por la moneda** del san (Bs → fiat VES; USDC/SOL → cripto). Si **no tiene** un método compatible, el paso se **bloquea** con un mensaje y enlace a **Perfil → Pagos**. Los datos de pago se **copian** del método elegido (vía endpoint `/api/metodos-pago`) hacia `DatosPagoRecolecta`.
  7. **Resumen y crear.** Al crear, el usuario recibe un **aviso en app y por correo** ("¡Creaste tu ahorro!").

- **Unirse a un ahorro** (`sanes/unirse/page.tsx` + componente `unirse-ahorro.tsx`; acciones `buscarRecolecta` / `unirseARecolecta` en `sanes/actions.ts`): por **enlace o código**. El **código es el id de la recolecta** (cuid); la página acepta `?codigo=` para precargarlo. Al unirse se **notifica al organizador**.

- **Compartir** (`components/compartir-ahorro.tsx`): en el detalle de la recolecta, muestra el **código**, botón de **copiar enlace** y **compartir nativo**.

- **Guía visual** (`sanes/guia/page.tsx`): tarjetas con infografía por método —**San · Susi · Bolso** (por turnos), **Vaca · Pote** (meta común) y **Dividir una cuenta** (repartir un gasto)— cada una con "cómo aprovecharlo".

## 13. Notificaciones y avisos

Dos planos complementarios:

**13a. Campanita — notificaciones persistentes (por usuario).** Cada usuario tiene una bandeja (campanita) con estado leído/no leído, fecha, tipo y enlace al recurso. Orígenes:
- **Sistema / super-admin:** el panel super-admin (sección 15) puede enviar notificaciones a **un usuario concreto** o **globales a todos** (broadcast).
- **Eventos de san/vaca:** "tal persona entró al san", "tal persona pagó — está al día", algo **completado** (turno, meta, cierre); y para el **administrador** del grupo: aviso de **moroso** o **pago pendiente**.

**13b. Toasts — avisos efímeros en pantalla (por acción).** Para procesos de la app (ej. "san creado"). Aparecen y desaparecen. Código de color:

| Color | Significado |
| --- | --- |
| Verde | Éxito / positivo (san creado, pago registrado) |
| Rojo | Error / negativo |
| Naranja | Advertencia / probable error |
| Azul | Información neutra |

> Para el MVP, notificaciones **in-app** son suficientes. **Ya implementado** un helper `notificarYCorreo` (`lib/notificaciones.ts`) que avisa **en la app (campanita) y por correo** a la vez; hoy se usa en acciones sensibles de **métodos de pago** (agregar/editar/eliminar) y al **crear un ahorro**. Pendiente: extender el mismo patrón a todos los eventos del san (invitación, sorteo de turnos, pago reportado/confirmado/rechazado, cierre) y push.

## 14. Cuenta, registro, verificación, perfil y roles

**Registro y login (métodos combinables):**
- **Correo + contraseña.** Política de contraseña segura: al menos **una mayúscula, un número y un símbolo** (además de letras). Con **generador de contraseña aleatoria** opcional.
- **Verificación y 2FA por OTP al correo:** **código aleatorio único autogenerado** enviado al correo asociado, para confirmar la cuenta y como **segundo factor de seguridad básico**. Sale por el **servidor SMTP propio** (dominio de prueba). TOTP/Google Authenticator queda para más adelante.
- **Login con wallet** (Phantom/Solflare): se entra por la **firma** de la wallet, **sin OTP** (la propia wallet autentica).
- **Métodos combinables:** quien entró por wallet puede **vincular** luego correo + contraseña + OTP si lo desea; quien se registró por correo recibe su **wallet embebida no-custodial** (sección 6).
- Sin cédula al inicio, para no poner barrera.
- **A futuro (no MVP):** Google (OAuth) y TOTP/Google Authenticator.

**Onboarding** (`app/onboarding/`): tras el registro, un **carrusel a pantalla completa** con infografías explica los métodos de ahorro (incluye "San, susi o bolso — por turnos", correcto con la terminología actual), con **checkbox "no volver a mostrar más"** (persistido en `Usuario.onboardingCerrado`) y una **pantalla de carga con el logo**.

**Perfil — hub** (`app/(app)/perfil/page.tsx`, ruta `/perfil`). Implementado como **centro de cuenta**:
- **Tarjeta de identidad:** inicial/avatar, nombre, **@usuario**, **nivel** (Nivel N · Nombre) y **puntos**, con desglose de positivos/negativos.
- **Menú:** **Tu recompensa** (`/recompensa`), **Tus datos** (`/configuracion?tab=datos`), **Métodos de pago** (`/configuracion?tab=pagos`), **Centro de ayuda** (`/ayuda`), **Configuración** (`/configuracion`), **Panel super-admin** (`/admin`, solo si el rol es `super_admin`) y **Cerrar sesión**.

**Configuración — sección propia** (`app/(app)/configuracion/page.tsx`, ruta `/configuracion`). Dejó de ser un drawer; ahora es una página con **pestañas**:
- **Datos:** correo, nombre, apellido y **nombre de usuario** (3–15 caracteres), con **validación de disponibilidad del nombre de usuario en vivo** (endpoint `app/api/usuario-disponible/route.ts`).
- **Pagos (métodos) — rediseñado** (modelo `MetodoPago`, `components/form-metodo-pago.tsx` + `components/metodo-pago-item.tsx`): el usuario **crea, edita y elimina** sus métodos para **recibir** en los ahorros que organice. Flujo de creación: **categoría Fiat o Cripto** → **moneda** (selector buscable; el MVP habilita **VES** y **USD**, y las demás monedas de LatAm aparecen **deshabilitadas con la etiqueta "Pronto"** desde `MONEDAS_FIAT_FUTURAS`) → **método** → **datos**:
  - **Fiat VES:** Transferencia (banco buscable de `lib/bancos-venezuela.ts`, tipo de cuenta, número, titular, cédula) o Pago móvil (banco, teléfono, titular, cédula).
  - **Fiat USD:** Efectivo, Zelle, Zinli, WalyTech o Banco (USD).
  - **Cripto (red Solana):** USDC o SOL → dirección de **wallet externa** + alias. (La wallet **principal** la entregará la integración cripto, predefinida y no editable; campo `principal`.)
  - **Prohibición** clara: los datos deben ser del **titular, persona natural** (no terceros ni empresas).
  - **Seguridad:** agregar, editar y eliminar un método **piden confirmar con la clave** (`lib/seguridad.ts`) y **avisan en app y por correo** (`notificarYCorreo`).
- **Seguridad:** cambio de contraseña y verificación en dos pasos (**próximamente** — hoy es un placeholder en la UI; ver la sección de Estado).
- **Avisos:** preferencias de correos/marketing (**próximamente** — placeholder).
- Para el super-admin, un **toggle a super-admin** (`components/toggle-admin.tsx`) lleva al panel.

A futuro (fase cripto): la **wallet embebida principal** (USDC/SOL) que la app entrega al registrarse aparecerá como método de pago predefinido y no editable.

**Restricciones / lista negra de palabras** (`lib/restricciones.ts`): bloquea palabras de **falsa autoridad** (admin, organizador, soporte, moderador, root, oficial, "green sol", etc.) en **nombre, apellido y nombre de usuario**, tanto en el **registro** como al **editar el perfil**. El **super-admin queda exento** y puede **editar las listas** desde su panel (claves `BLACKLIST_NOMBRE`, `BLACKLIST_APELLIDO`, `BLACKLIST_USUARIO`).

**Centro de ayuda** (`/ayuda`) y **Recompensa** (`/recompensa`) son páginas nuevas ya creadas.

**KYC:** no para registrarse, pero **sí para funciones de dinero**, vía proveedor tercero (documento + selfie/video), no manual.

**Roles:** usuario, administrador de grupo, y **super-admin** (sección 15).

## 15. Panel super-admin

Acceso interno separado (`app/admin/page.tsx`, ruta `/admin`), **responsive**, organizado en **5 pestañas** (`components/panel-tabs.tsx`):

- **Métricas (reales, desde la base de datos):** usuarios **totales**, **verificados** y **nuevos** (hoy, ayer, 7 días, 30 días); recolectas totales, **sanes y vacas activos**, abiertas y cerradas; **aportes confirmados** y monto sumado; y **rankings** por **moneda**, por **método de recolecta** (tradicional/cripto) y por **método de pago**.
- **Usuarios:** listado (hasta 100, más recientes primero) para ver y gestionar; base para editar/invitar (incluido otro super-admin).
- **Restricciones:** editar la **lista negra de palabras** de nombre, apellido y nombre de usuario (sección 14).
- **SMTP:** cargar los datos del **servidor SMTP** (host, puerto, usuario, contraseña, remitente, seguro), de donde salen verificación de cuenta, OTP, reseteo de contraseña y avisos. Claves `SMTP_*`.
- **App:** configuración general de la aplicación — **nombre, descripción, correo de contacto, URL de logo y URL de favicon**. Claves `APP_*`.

Toda la configuración se persiste en la tabla `ConfiguracionApp` (`clave`/`valor`; ver [ARQUITECTURA_TECNICA.md](ARQUITECTURA_TECNICA.md)). **Notificaciones** (enviar a un usuario o globales) y comprobaciones anti-estafa de documentos quedan dentro del alcance del panel (sección 13), parcial/pendiente.

> **Configuración de integraciones (futuro, no MVP):** desde el panel, el super-admin podrá almacenar y gestionar **API keys** —de tasas y de **IA** (Claude, Gemini, DeepSeek)— en variables de entorno/secretos cifrados, asignar su **uso** (solo super-admin o global para usuarios) y **elegir el modelo** por sección, de cara a integraciones de IA futuras. Es una idea concreta para más adelante; no se construye ahora.

## 16. Qué usa Solana y qué no

| Capa | ¿On-chain? | Ejemplos |
| --- | --- | --- |
| Cuentas, recolectas, turnos, reportes, reputación, notificaciones, UTM | No (web tradicional) | Login, grupos, progreso, valoraciones, campanita |
| Archivos pesados (comprobantes, audio, fotos) | No (object storage) | Capturas, notas de voz |
| Tasas, equivalencia en Bs y calculadora | No (APIs externas + caché) | BCV, USDT, SOL/USDC |
| Recolecta con cripto (saldo del bote) | Sí (Solana) | USDC/SOL verificable |
| Mover fondos del bote cripto | Sí (multifirma) | Retiros aprobados |
| Reflejar wallet externa | Sí (lectura RPC) | Modo espejo |

## 17. Datos y analítica (control interno)

- **UTM** de cada usuario (registro, ingreso, campañas) para medir adquisición y para marketing.
- Métricas de uso (sanes creados, completados, no concretados, montos, tipos) — útiles para el negocio **y** para mostrar parte al usuario como reputación/historial.
- Todo respetando privacidad y con datos sensibles protegidos.

## 18. Requisitos no funcionales

- **Confianza por diseño:** no-custodial por defecto.
- **Seguridad:** datos personales y comprobantes cifrados y con acceso restringido. **Secretos, API keys, webhooks y detalles de APIs privadas nunca en el repo** (open source): van en variables de entorno y en `_privado/` (ver [INTEGRACIONES_API.md](INTEGRACIONES_API.md)).
- **Responsive** escritorio→móvil; **accesibilidad**; **i18n** (español por defecto).

## 19. Roadmap por fases

- **Fase 0 — Documentación. Completada.**
- **Fase 1 — MVP gancho (tradicional). Núcleo construido y verificado (app v0.0.41).** Hecho (build + tests unitarios + E2E con Playwright): bienvenida y **onboarding** con carrusel, registro/login (correo + clave segura + **OTP por correo**), **navegación de 5 pestañas** con header de nivel y avisos, **dashboard** con **tasas en vivo**, **calculadora** rediseñada (Bs · Dólar BCV · USDT · Solana), sección **Ahorro** con **asistente de creación por pasos** —incluido el paso de **método de pago elegido del perfil**— y **unirse por enlace/código** + compartir + guía, **pagos** (por confirmar/rechazados/activos), turnos, **notificaciones (toasts + campanita)** más **avisos en app + correo** en acciones sensibles, **métodos de pago rediseñados** (modelo `MetodoPago` fiat/cripto con agregar/editar/eliminar y **confirmación por clave**), **reputación por puntos y niveles** (Nuevo → Leyenda), **perfil/configuración** (con validación de usuario en vivo y restricciones de palabras) y **panel super-admin** con **métricas, usuarios, restricciones, SMTP y configuración de app**. Entrega de primera versión: **1 de junio de 2026, 5:30 p.m.** Pendiente de esta fase: **sistema de referidos** (ver [IDEAS_FUTURAS.md](IDEAS_FUTURAS.md)), **calendario de pagos con fechas**, **almacenamiento de comprobantes** (MinIO/S3 en VPS), y **despliegue** (Vercel + base de datos en el VPS).
- **Fase 2 — Capa cripto (enseguida tras el núcleo, en devnet):** wallet embebida **no-custodial** + onboarding de respaldo, login con wallet (Phantom/Solflare), USDC/SOL, depósitos/retiros/transferencias, multifirma o modo espejo, multas por mora. Alto estándar de seguridad web3; devnet antes de dinero real.
- **Fase 3 — Confianza y escala:** dividir cuentas, KYC con proveedor, panel super-admin completo, **marketplace público**, login con Google, despliegue en VPS.
- **Fase 4 — Móvil:** Android/iOS.

> **Nota de alcance MVP (1-jun):** priorizar lo **mostrable** para el screenshot/video. Mayor impacto con menor esfuerzo: **dashboard con tasas reales + calculadora** (APIs ya disponibles), **bottom nav**, y el **flujo de crear un san** (UI). Registro con verificación de correo y notificaciones completas pueden ir parciales si el tiempo aprieta.

## 20. Identidad de marca y diseño

- **Green Sol — doble sentido de "Sol":** por un lado **SOL**, el símbolo de **Solana**; por otro, el **Sol**, la estrella radiante. Un sol **verde** (las estrellas pueden ser azules, blancas, amarillas… o verdes), elegido porque el verde vende y representa **dinero, organización y calma**. Estética de **espacio y galaxias**; ícono de sol que contrasta en claro y oscuro.
- **Logo:** badge circular verde (degradado radial `#14C98A → #0E9F6E`) con el **ícono `sun` de Lucide en blanco** (círculo hueco + 8 rayos de puntas redondeadas) y un halo verde claro. Funciona en claro y oscuro. Asset: `assets/green-sol-logo.svg`.
- **Modo light por defecto** — tanto en el PRD como en la app. La primera impresión transmite más confianza y seriedad en claro. El **modo dark es opcional**, con un botón de cambio fácil en el dashboard principal.
- **Paleta:** verde de marca como base (`#0E9F6E` light / `#1DCB8E` dark), con **acentos** donde aporten (no todo verde). Las **estrellitas de reputación van en dorado**: `#C8881A` en light y `#F5C84B` en dark. Para imágenes de redes, paleta de fondo con el degradado de Solana (morado `#9D4EEE` → azul `#5882D1` → verde `#0BC595`).

## 21. Despliegue

- **Pruebas / MVP:** Vercel (cuenta y proyecto vinculados con GitHub; auto-redeploy en cada push) + Postgres gestionada + object storage.
- **Producción:** VPS propio en contenedor cerrado cuando madure. Detalle en [ARQUITECTURA_TECNICA.md](ARQUITECTURA_TECNICA.md).

## 22. Fuera de alcance / decisiones abiertas

- **Sistema de referidos (pendiente, no implementado — roadmap).** Código de referido por usuario (copiar/compartir), **+40 puntos a ambos** (quien invita y referido) cuando el referido **se registra con el código y hace su primer aporte**, **máximo 5 referidos** premiados, **solo cuentas nuevas**, acreditación única. Más adelante, **club de canje de puntos**. Toca el esquema (campos `codigoReferido`/`referidoPorId` en `Usuario`) y la lógica del evento "primer aporte". Detalle en [IDEAS_FUTURAS.md](IDEAS_FUTURAS.md).
- Proveedor de wallet embebida y de KYC.
- Set final y orden de íconos del bottom nav (pendiente revisar referencias visuales).
- Detalle del algoritmo de reputación (estudiar Cashea).
- ¿Notificaciones por correo/push además de in-app? (fase posterior).
- Modelo de negocio.
