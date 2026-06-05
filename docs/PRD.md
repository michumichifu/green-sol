# PRD — Green Sol

> Proyecto del Solana Vibe Bootcamp (Venezuela). App para **gestionar el ahorro en grupo de forma transparente** (san/bolso/susi por turnos, o pote/vaca por meta) y dividir cuentas, con **reputación de usuarios**. Método tradicional o cripto sobre Solana, sin que la app custodie dinero a la fuerza. **La finalidad es servir de puente al ahorro en cripto** para la comunidad hispana.

- **Versión:** 0.21 (**registro y login con wallet de Solana** —Phantom/Solflare, firma off-chain ed25519, **identidad por wallet** (correo opcional), login alterno **@usuario + PIN**, stack framework-kit `@solana/client`/`@solana/react-hooks`/`@solana/kit` + cliente devnet listo para saldos— + todo lo de 0.20 + **motor de rondas completo (fases 2 y 3)**: cada aporte se **sella a su ronda**, con **fechas de corte** y **puntualidad** —a tiempo / adelantado / con atraso, sin días de gracia—, **mora informativa** (ninguna / monto fijo / porcentaje, elegida al crear), **entrega del bote al cobrador** con sus datos de pago copiables + declaración jurada + PIN, y **cierre/avance de ronda** hasta finalizar el san; **el organizador elige al crear** si aporta y tiene turno o solo administra; **sección "Cuentas por pagar"** con calendario lineal de vencimientos; y **refinamientos de la pestaña Pagos** —notificaciones que llevan a su destino, tarjeta "¿dónde pagar?" colapsable, "lo que te toca pagar" + estado en grid 60/40, donas de ronda/pagos diferenciadas, reporte de pago con declaración jurada—). ✅ **Desplegado el 2026-06-04**: la **beta en vivo en la VPS** (greensol.creceideas.com) con todas las migraciones aplicadas. Local, GitHub y VPS al día. Estado de desarrollo en [CHANGELOG.md](../CHANGELOG.md); diseño en [superpowers/specs/2026-05-29-green-sol-mvp-design.md](superpowers/specs/2026-05-29-green-sol-mvp-design.md), [superpowers/specs/2026-05-31-kyc-verificacion-identidad-design.md](superpowers/specs/2026-05-31-kyc-verificacion-identidad-design.md), [superpowers/specs/2026-06-02-detalle-san-pagos-design.md](superpowers/specs/2026-06-02-detalle-san-pagos-design.md), [superpowers/specs/2026-06-03-invitacion-miembros-pagos-design.md](superpowers/specs/2026-06-03-invitacion-miembros-pagos-design.md) y [superpowers/specs/2026-06-03-motor-rondas-san-design.md](superpowers/specs/2026-06-03-motor-rondas-san-design.md).
- **Fecha:** 2026-06-04
- **Fase:** 1 — MVP en construcción. **Núcleo tradicional construido** (auth con **PIN como credencial de acceso principal** —flujo de registro reordenado, estilo Cashea: correo → OTP → PIN → datos—, OTP de registro, ahorros san/vaca con **asistente de creación por pasos** —incluido el paso de **método de pago elegido del perfil**—, **unirse por enlace/código**, tasas en vivo con planificador rediseñado, calculadora, navegación de 5 pestañas con header de nivel y avisos, dashboard, pagos, **reputación por puntos y niveles**, **métodos de pago rediseñados**, **verificación por clave** y **avisos en app + correo** en acciones sensibles, **verificación de acciones (OTP por correo)**, **contraseña como factor fuerte para cripto**, **sistema de plantillas con editor visual**, **SMTP real**, perfil/configuración, **panel super-admin con gestión de usuarios completa**, onboarding, **detalle del san rediseñado con pestañas Resumen · Miembros · Pagos y conversión Bs↔$**, **invitación temporal con solicitud de unión y portero de verificación**, **inicio del san con sorteo de turnos en tres modos (Manual con arrastre, Aleatorio y Ruleta animada con sonido)**, **motor de rondas completo (fases 2 y 3): fechas de corte, puntualidad, mora informativa, entrega del bote al cobrador con declaración + PIN, y cierre/avance de ronda**, **"Cuentas por pagar" con calendario de vencimientos**, **aprobación de pagos con declaración jurada + PIN**, **congelado del equivalente en $ y fecha real del pago**, **invitar por correo o @usuario con código GS-XXXX + enlace directo**, **página de Términos (maqueta) con el deslinde de responsabilidad P2P** y **confirmación de cierre de sesión**), **más el KYC propio completo** (documento + selfie + video de liveness, almacenamiento MinIO, cola de revisión con confirmación por credencial) y una **beta desplegada y en vivo en la VPS-2** (`greensol.creceideas.com`, Docker + nginx + certbot). Verificado con build + tests unitarios + E2E (Playwright). Pendiente: **términos definitivos** (texto legal real, razón social, comisiones reales) y **motor de gamificación** (mecánicas de puntos reales), **capa cripto** (DevNet), factores de seguridad restantes, referidos. Entrega de primera versión: **1 de junio de 2026, 5:30 p.m.**
- **Nombre:** Green Sol (sol verde). Descartado: Cochino.

Versión visual: [PRD.html](PRD.html). Técnica: [ARQUITECTURA_TECNICA.md](ARQUITECTURA_TECNICA.md), [INTEGRACIONES_API.md](INTEGRACIONES_API.md) y [SEGURIDAD_Y_WALLETS.md](SEGURIDAD_Y_WALLETS.md).

---

## 0. Estado del proyecto (sesión 2026-06-04, sobre v0.0.70–v0.0.137)

Foto rápida de qué funciona, qué falta y qué se decidió en las últimas sesiones.
**Hitos recientes (v0.0.107–v0.0.137):** **invitación temporal con solicitud de unión** (san privado = solicitud que el organizador aprueba/rechaza; san público = directo) con **portero de verificación** (solo `nivelKyc >= 1`) y **confirmación por PIN**; **detalle del san reestructurado a tres pestañas Resumen · Miembros · Pagos**; **inicio del san con sorteo de turnos** en tres modos (Manual con arrastre, Aleatorio rápido y visual, y **Ruleta con animación SVG colorida + sonido Web Audio + desaceleración**); **velo/ojo** que da percepción de bloqueo antes de iniciar; **estatus renombrados** (Por iniciar / En curso / Finalizado); **aprobación de pagos con declaración jurada + PIN**; **congelado del equivalente en $** y **fecha real del pago**; **invitar por correo o @usuario** con **código GS-XXXX + enlace directo**; **página de Términos (maqueta)** con el **deslinde de responsabilidad P2P** y un borrador de niveles/puntos/moras/comisiones; **confirmación de cierre de sesión**; **Miembros** con orden de turnos y fecha de cobro por participante; y "Cerrar recolecta" con **PIN, rojo y separado**.
**Hitos previos (v0.0.70–v0.0.106):** rediseño completo del modelo de autenticación con PIN estilo Cashea, nueva gestión de usuarios en el panel super-admin, planificador de tasas mejorado, etiquetas de monedas actualizadas (USDT → USDC / paralelo → promedio), guía de monedas fiat vs cripto, favicon con el logo de Green Sol, y **rediseño completo del detalle del san** en pestañas Resumen/Pagos con vistas por rol, conversión Bs↔$ y notificaciones completas del san.

### ✅ Implementado (ya funciona)

- **Autenticación rediseñada (modelo PIN estilo Cashea):** El **PIN numérico de 6 dígitos** es la credencial principal de acceso, no la contraseña. El flujo de registro fue reordenado: `correo → verificar correo con código OTP → crear PIN → datos del perfil → pantalla "¡Tu cuenta está lista!"`. El paso de creación de PIN se titula **"Crea tu PIN (clave)"**. El PIN se enmascara con puntos (•) durante la entrada y el campo de confirmación muestra feedback de coincidencia en tiempo real: "✓ Las claves coinciden" / "✗ No coinciden". El PIN se almacena hasheado con **Argon2**. Tras **5 intentos fallidos** el PIN queda bloqueado durante **15 minutos** (bloqueo temporal automático). Login: el usuario escribe su correo o nombre de usuario y luego su PIN. La **contraseña** ha pasado a ser un factor fuerte **opcional**, reservado para operaciones cripto de alto valor (junto a biometría/WebAuthn, aún no implementada); no se usa para el acceso diario. El OTP por correo es verificación de **acciones sensibles**, no credencial de login. **Se quitó el pop-up de biometría del flujo de registro**; la activación de biometría real irá en el login cuando se construya WebAuthn. El **PIN ya NO se presenta como "2FA"**: es la credencial principal. El checklist de verificación del usuario en la app es: correo verificado + verificación de identidad (KYC). La pantalla de verificación del correo dice **"Verifica tu correo"** (verificación del correo, que es criterio distinto a verificación de cuenta/identidad).
- **Migración suave de cuentas antiguas:** usuarios existentes con contraseña pero sin PIN son redirigidos automáticamente a la pantalla `/migrar-pin` al intentar entrar: confirman su contraseña actual y crean su PIN. Su contraseña no se elimina; queda como factor fuerte.
- **"Empezar otro registro":** enlace en la pantalla de registro que reinicia el progreso guardado: borra el usuario pendiente incompleto y libera el correo para que pueda usarse de nuevo.
- **Gestión del PIN en Configuración → Seguridad:** sección "Acceso a la cuenta" permite cambiar el PIN (6 dígitos; se confirma con el PIN actual). El sistema **no permite quitar el PIN si es la única credencial activa** (salvaguarda anti-lockout): si el usuario no tiene contraseña configurada, la opción de eliminar el PIN está bloqueada.
- **Roles simplificados a 2:** `usuario` (por defecto al registrarse) y `super_admin` (acceso al panel `/admin`). El rol `admin_grupo` fue eliminado del enum en la migración `20260602012525_roles_sin_admin_grupo`. El "organizador de un san" no es un rol del sistema: es una **etiqueta derivada** de las recolectas que ese usuario organiza. El rol se puede cambiar desde el panel super-admin.
- **Onboarding:** carrusel a pantalla completa con infografías y checkbox "no volver a mostrar" (`onboardingCerrado`), pantalla de carga con logo.
- **Navegación:** **5 ítems** (Ahorro · Pagos · **Inicio** · Calculadora · Perfil) + **header** sticky con **etiqueta de nivel** y **campana de avisos** (panel desplegable); **transición de fade** entre pestañas.
- **Dashboard:** hero con saludo + puntos/nivel, accesos rápidos, **tasas de hoy** (BCV/USDC/SOL del caché global) y "Tus ahorros". Las etiquetas en la tarjeta de tasas dicen **"USDC / promedio"** (antes "USDT") y **"SOL / USDC"** (antes "SOL / USD").
- **Calculadora** rediseñada (`components/calculadora.tsx`): origen entre **Bolívares · Dólar BCV · USDT · Solana**, símbolo como prefijo, cotización del día y conversiones a las otras tres (lee del caché global).
- **Planificador de tasas rediseñado:** el servidor tiene un **scheduled job** (cron) que refresca las tasas con frecuencias diferenciadas: **SOL y USDT** cada 30 minutos; **BCV** a las 6:00, 11:00, 14:00 y 19:00 (hora de Venezuela, VET = UTC−4). Fuentes: BCV desde el CDN público del BCV, USDT desde la API privada del proveedor (con API key guardada en variables de entorno), SOL desde DexScreener (API pública). Se cachea en la base de datos y toda la app lee del caché — **una sola consulta a nivel sistema**, visualización global, menos consultas a APIs externas.
- **Sección Ahorro:** landing "Ahorros" (Crear/Unirme/Guía), **asistente de creación por pasos** (tipo → título+descripción → visibilidad → moneda → detalles del san con **meta por turno anclada en dólares**, aporte por persona calculado, **frecuencia con días personalizables** y duración estimada → **método de pago elegido del perfil** → resumen), **unirse por enlace/código** (acepta `?codigo=`), **compartir** (código, copiar enlace, compartir nativo) y **guía visual**.
- **Detalle del san — rediseñado con pestañas Resumen/Pagos:** la página `app/(app)/sanes/[id]/` se reestructuró en dos pestañas visibles para ambos roles (organizador y participante). **Pestaña Resumen:** cabecera con nombre del san, estado (abierto/activo/cerrado) y chip de rol; **dona de progreso SVG** (verde `#14c98a` proporcional a pagados/total de la ronda, sin librería externa); **"Ronda X de Y"**; **lista de participantes compacta** (una línea por persona: foto o ícono dorado para el organizador sin círculo de fondo; **Nombre Apellido @usuario** en una sola línea; turno y check si cobró); sección **"¿Dónde pagar?"** (datos de `DatosPagoRecolecta`); enlace de **invitar/compartir** (`CompartirAhorro`, solo si el san está abierto). **Pestaña Pagos — vista participante:** bloque **"Lo que te toca pagar"** — para sanes en Bs (`bs_bcv`/`bs_usdt`) muestra el monto en **Bs** prominente + "≈ $X · dólar BCV: Bs Y/$" con la tasa/ancla explícita; si no hay tasa en caché muestra el monto en $ con nota; para cripto (usdc/sol) muestra el monto en la cripto y que se paga por la wallet de Solana. Formulario **Reportar pago** con campo de monto (prelleno con el monto calculado) y referencia. **Mi historial** de aportes propios con estado color-coded (ámbar/verde/rojo). **Pestaña Pagos — vista organizador:** sub-pestañas **Pendientes** y **Aprobados**; Pendientes lista los `Aporte` en estado `reportado` con participante, monto (Bs + equivalente $), referencia, fecha y botones **Aprobar/Rechazar**; si no hay, muestra "No hay pagos por revisar."; Aprobados es el historial de `confirmado` (solo lectura). Mini-resumen arriba: "X de Y pagaron esta ronda". **Conversión Bs↔$:** cálculo en `lib/san/montos.ts` (`aportePersona`, `infoMontoParticipante`, `InfoMonto`); usa las tasas del caché (`obtenerTasas()`); el **progreso es por conteo** (cuántos participantes pagaron/confirmaron), no por suma de montos. **Notificaciones del san:** al unirse un participante → organizador recibe aviso **in-app y por correo** con "Nombre Apellido (@usuario)" (evento `san_nuevo_participante`, bugfix — antes no llegaba nada); al reportar un pago → organizador recibe aviso (evento `san_pago_reportado`); al aprobar/rechazar → participante recibe aviso (eventos `san_pago_aprobado` / `san_pago_rechazado`). Todo vía el catálogo de notificaciones (`lib/correo/catalogo.ts`), editable desde el editor visual del super-admin. Sin cambios de esquema. Diseño en `docs/superpowers/specs/2026-06-02-detalle-san-pagos-design.md`.
- **Invitación temporal con solicitud de unión (v0.0.107–v0.0.117):** dos modelos nuevos, `Invitacion` (código corto único, `expiraEn`, `revocada`) y `SolicitudUnion` (`pendiente`/`aprobada`/`rechazada`, único por recolecta+usuario). El organizador genera invitaciones con **vigencia 1/7/30 días** (default 7, con reintento ante colisión de código), las **revoca** y ve las activas. La landing `app/i/[codigo]/page.tsx` muestra el san, manda a login (con `next`) si no hay sesión, o a solicitar unirse si la hay. La lógica común `procesarUnion` decide: **san público = unión directa; san privado = solicitud** que el organizador aprueba/rechaza; la invitación nominal por correo se mantiene directa. Eventos `san_solicitud_union` (al organizador), `san_solicitud_aceptada` / `san_solicitud_rechazada` (al solicitante). Código de 6 caracteres sin ambiguos (`lib/san/codigo-invitacion.ts`).
- **Portero de verificación + confirmación con PIN al unirse (v0.0.111–v0.0.112):** antes de unirse o solicitar, si el perfil **no está verificado** (`perfilVerificado` = `nivelKyc >= 1`, mismo criterio que admin/perfil/dashboard) el botón queda bloqueado con un disclaimer hacia `/configuracion?tab=verificacion` y el servidor también rechaza. Al confirmar la unión se pide el **PIN** (`credencialValida`). Encapsulado en `components/san/confirmar-union.tsx` (portero + PIN), usado en la pantalla de unirse y en la landing del enlace.
- **Detalle del san reestructurado a TRES pestañas Resumen · Miembros · Pagos (v0.0.113–v0.0.115):**
  - **Pestaña Miembros** (`components/san/miembros.tsx`): solicitudes pendientes para el organizador (aprobar/rechazar) y lista de participantes con **turno**, **estado de pago** (pagó/reportó/pendiente) y fecha del último pago. `PanelTabs` muestra un **puntito de aviso** en la pestaña Miembros cuando hay solicitudes pendientes (`avisos?: boolean[]`). Más adelante (v0.0.119, 137) Miembros también muestra el **orden de turnos** y la **fecha en que le toca cobrar** a cada participante (`fechaInicio + (posición − 1) × frecuencia`); el bloque "Administrar" se movió aquí desde Pagos y pasó a llamarse **"Invitar usuario"**.
  - **Pagos simplificada** (`components/san/metodo-pago-tarjeta.tsx`): el método de pago aparece en una **tarjeta visual** arriba de la pestaña Pagos (para ambos roles). El Resumen quedó compacto (sin "¿dónde pagar?" ni la lista de participantes, que pasaron a Pagos y Miembros).
- **Inicio del san y sorteo de turnos — motor de rondas, fase 1/3 (v0.0.129–v0.0.137):**
  - **Migración en `Recolecta`:** `organizadorParticipa` (si el organizador aporta y tiene turno, o solo administra), `rondaActual` (ronda en curso) y `fechaInicio` (para las fechas de corte por ronda).
  - **Acción `iniciarSan(recolectaId, orden, pin)`:** crea los `Turno` en el orden dado, pone el san **activo (En curso)**, fija `fechaInicio = now`, `rondaActual = 1` y **avisa a cada participante su turno** (evento nuevo `san_iniciado`).
  - **Componente `components/san/iniciar-san.tsx`:** pop-up para iniciar el san con **tres modos** de asignación de orden, todos confirmados con **PIN**:
    1. **Manual (a dedo):** manija de arrastre (`GripVertical`, reordena en vivo con touch y mouse; el número de turno se actualiza solo) y flechas ↑/↓.
    2. **Aleatorio rápido y visual:** baraja al instante; se puede sortear varias veces hasta que el orden guste.
    3. **Ruleta 🎰** (ver abajo).
  - **Componente `components/san/ruleta-sorteo.tsx` + `lib/san/sonidos-ruleta.ts`:** ruleta SVG **colorida** (8 colores) que gira con **desaceleración** (ease-out), **tic** sincronizado por segmento y **arpegio de ganador**, todo con **audio sintético Web Audio** (sin archivos ni librerías). Revela el orden **turno por turno**; el **penúltimo** giro deja el último **"por descarte"**, que se muestra **sobre la ruleta** unos 3 s antes de cerrar. El resultado de la ruleta es **definitivo** (no se rehace) y se confirma con PIN. Los gajos muestran **Nombre Apellido + @usuario**; los resultados usan **@usuario (Nombre Apellido)**. (Bugfix v0.0.133: ya no duplica participantes — se separaron las actualizaciones de estado que en StrictMode corrían dos veces.)
  - **Velo/ojo (`components/san/velo-revelable.tsx`):** da **percepción de bloqueo sin bloquear** — difumina la información (montos, invitar) con un velo traslúcido y un **ojo** para revelar/ocultar. Se usa en el Resumen mientras el san no ha iniciado, con la tarjeta **"El san aún no ha iniciado"** resaltada en **degradado amarillo→naranja** como foco para iniciar.
- **Aprobación de pagos con declaración jurada + PIN (v0.0.122):** `components/san/confirmar-resolucion-pago.tsx`, un pop-up enfocado con los datos del pago (participante, monto Bs≈$, referencia), una **declaración de recepción de fondos** (al aprobar) y el **PIN**; el botón se desbloquea con los 6 dígitos. La acción `resolverAporte` exige PIN (`credencialValida`).
- **Congelar el equivalente en $ + fecha del pago (v0.0.127):** migración en `Aporte` — `montoAncla` (equivalente $/USDC/SOL **congelado** con la tasa del momento de reportar) y `fechaPago` (fecha real del pago indicada por quien reporta, que puede diferir de la fecha de creación del reporte). El formulario de reportar pago tiene un campo **"Fecha del pago"** (default hoy, máx hoy). Pagos y Miembros muestran el **$ congelado** (ya no fluctúa con la tasa de hoy) y la **fecha real del pago**.
- **Invitar por correo o @usuario (v0.0.131):** acción `invitarUsuario` que resuelve por **correo o `@usuario`** con feedback ok/error; componente `components/san/invitar-usuario.tsx`. El bloque "Administrar" de Miembros pasó a llamarse **"Invitar usuario"**.
- **Código de invitación GS-XXXX + enlace directo (v0.0.119, 126):** la tarjeta Invitar (`components/san/invitar.tsx`) muestra el **código** (`GS-XXXXXX`) etiquetado y el **enlace directo** copiable por separado; `buscarRecolecta`/`unirseARecolecta` también resuelven el código de invitación, no solo el id del san. La tarjeta Invitar/Compartir es visible mientras el san no esté cerrado (no solo cuando está "abierta"). El Resumen muestra **"Organiza: …"** (nombre + @usuario del organizador) y separa la visibilidad del monto: **"Aporta cada persona"** vs **"Recibe quien cobra"**; la dona y el texto de ronda quedan alineados ("Ya cobró X de N turnos").
- **Página de Términos y Condiciones — maqueta (v0.0.123, 125):** ruta `app/(app)/terminos/page.tsx`, enlazada desde el menú del Perfil. Incluye el **deslinde de responsabilidad** (modelo **P2P**: **Green Sol NO custodia los fondos**; el **organizador recoge y reparte**; la participación es bajo responsabilidad exclusiva de los usuarios), adaptado a Green Sol del modelo legal de Tu-Turno; y un **borrador detallado** del sistema de **niveles/puntos** (niveles con etiqueta y monto máximo, cómo se ganan puntos, **moras/penalizaciones**, vigencia y **comisiones**) con **cifras de ejemplo (ficticias)** marcadas como borrador. Todos los datos legales por definir van entre `[corchetes]`.
- **Confirmación de cierre de sesión (v0.0.124):** `components/boton-cerrar-sesion.tsx`, pop-up centrado "¿Cerrar sesión?" (sin PIN) que avisa que deberá reingresar con correo/usuario + PIN; evita salidas por clic accidental.
- **Estatus del san renombrados (v0.0.130):** en toda la UI, "Abierta" → **"Por iniciar"**, "Activa" → **"En curso"**, "Cerrada" → **"Finalizado"**.
- **"Cerrar recolecta" con PIN, rojo y separado (v0.0.120, 131):** el cierre del san (`CerrarSan`) ahora pide **confirmación con PIN**, es **rojo sólido** (no fondo blanco) y está **separado** de las demás tarjetas para evitar clics por error. El bloque Administrar se movió de **Pagos** a **Miembros**. Aviso visual: los pagos pendientes del organizador usan un **degradado amarillo** de arriba hacia abajo para diferenciar el contenedor de pendientes (v0.0.121).
- **Identidad en notificaciones — formato `@usuario (Nombre Apellido)`** (usuario primero) vía `lib/usuario-etiqueta.ts`, aplicado a los avisos de unión y de pagos; en la fila de participante se mantiene el orden inverso (nombre primero).
- **Monedas de ahorro — etiquetas actualizadas:** las cuatro opciones de moneda en el asistente de creación se etiquetan ahora: **"Bolívares — dólar BCV (pagas en Bs)"**, **"Bolívares — promedio (USDC) (pagas en Bs)"**, **"USDC (Solana) · Cripto"** y **"SOL (Solana) · Cripto"**. La palabra **"paralelo" fue reemplazada por "promedio"** en toda la UI de creación de ahorros.
- **Guía de monedas fiat vs cripto:** explica la diferencia entre **Fiat** (dinero tradicional emitido por gobiernos — billetes y monedas físicos, ej. bolívar o dólar físico — que circula por bancos, efectivo y pago móvil) y **Cripto** (monedas digitales que viven en la red Solana, guardadas en una wallet que Green Sol entrega al registrarse; se compran en un exchange como Binance y se retiran a la dirección que da la app). Detalla las 4 opciones de moneda disponibles al crear un ahorro. Se muestra en la ruta `/sanes/guia` y se puede abrir directamente desde el asistente de creación mediante el botón **"¿Cuál elijo? Ver guía"** (abre un modal con la guía sin salir del flujo).
- **Pagos:** aportes por confirmar / rechazados y ahorros activos con turno/posición.
- **Perfil (hub) y Configuración** por pestañas (Datos · Pagos · Seguridad · Avisos), con **validación de nombre de usuario en vivo**.
- **Métodos de pago rediseñados** (modelo `MetodoPago` fiat/cripto): crear (flujo categoría → moneda → método → datos, con monedas futuras deshabilitadas "Pronto"), **editar** y **eliminar**; enfoque MVP = VES + USD (+ cripto USDC/SOL).
- **Seguridad y avisos:** `lib/seguridad.ts` (`verificarFactores`, hoy con la clave) — agregar/editar/eliminar método de pago **pide confirmar con la clave** y **avisa en app + correo** (`notificarYCorreo`), igual que al **crear un ahorro**.
- **Gestión de usuarios en el panel super-admin — módulo completo:** buscador por correo, @usuario, teléfono o número de cédula (del KYC); chips de filtro rápido (Todos / Verificados / Sin verificar / Suspendidos); lista paginada (20 por página) con avatar, correo, @usuario, insignia de estado y chip de rol. **Acciones por íconos** en cada fila (no por texto): **Ver ficha** (`Eye`), **Restablecer verificación** (`RotateCcw`), **Suspender/Reactivar** (`Ban`/`CircleCheck`), **Eliminar** (`Trash2`). Todas piden confirmación en modal antes de ejecutarse. **Ficha de usuario en modal** completa: identidad (foto/avatar, nombre completo, @usuario, correo, teléfono verificado, país, rol, fecha de registro, ingresos declarados), sección Seguridad (tiene PIN / tiene contraseña / OTP activo / bloqueo de PIN), sección KYC con estado e imágenes de documentos (vía proxy autenticado), lista de métodos de pago, y las mismas acciones de gestión más selector de rol detallado. **Confirmación con credencial** (PIN o contraseña del super-admin) antes de ejecutar acciones destructivas (suspender, eliminar, revocar verificación). **Salvaguardas:** el super-admin no puede auto-eliminarse ni auto-degradar su propio rol a `usuario`; no se puede dejar el sistema sin ningún super-admin. **Login bloqueado para suspendidos:** `baneado = true` impide el inicio de sesión (verificado en `iniciarSesion`). El listado es **responsive en móvil** (sin scroll horizontal).
- **Reputación:** puntos = estrellitas + niveles (Nuevo → Confiable → Destacado → Estrella → Leyenda) en `lib/reputacion.ts`; valoraciones (manito +/−) al cerrar.
- **Restricciones** (lista negra de palabras) en nombre/apellido/usuario; **panel super-admin** con pestañas (Métricas · Usuarios · Verificaciones · Configuración).
- **Datasets:** `lib/bancos-venezuela.ts` (25 bancos), `lib/monedas.ts` (monedas fiat + futuras + métodos por moneda + cripto).
- **Páginas** Recompensa (`/recompensa`) y Centro de ayuda (`/ayuda`).
- **Favicon de marca:** el favicon de la app ahora muestra el logo de Green Sol (badge verde con el sol). Antes salía el triángulo por defecto de Next.js.
- **SMTP real funcionando:** el super-admin carga el SMTP (host `mail.proyecciondigital.org` —el del certificado, mismo servidor que `mail.creceideas.com`—, puerto **465** SSL, buzón `no-responder@greensol.creceideas.com`), con **Verificar conexión** y **Enviar correo de prueba**. `lib/mailer.ts` toma la config de la base de datos y, si no, de variables de entorno; soporta correo HTML.
- **Panel super-admin reorganizado:** pestañas principales **Métricas · Usuarios · Configuración**; dentro de Configuración, **subpestañas** General · SMTP · Plantillas · Restricciones. El form SMTP tiene **toggle de conexión segura (SSL/TLS)**, **remitente en dos campos** (nombre + correo) con un "Aparece como…" automático, botón verde de marca y **toast**; la contraseña se conserva si se deja vacía. Responsive corregido (sin scroll horizontal; pestañas scrollables en móvil).
- **Sistema de plantillas de notificaciones** (`lib/correo/`): catálogo de eventos, cada uno con los **canales que aplica** (app y/o correo — p. ej. el OTP es solo correo); plantillas **HTML con la marca** (verde, wordmark, footer) y **override editable en la base de datos** (fallback al default del catálogo). **Editor visual** en super-admin: **grid de tarjetas** por categoría con iconos ver/editar, **modal con pestañas Aplicación / Correo**, **barra de formato** (negrita, cursiva, subrayado, tachado, color, resaltado; y enlace, imagen por URL, lista y línea divisoria en correo), **vista previa** en iframe (correo) o tarjeta (app), **variables clickeables**, guardar / restablecer / enviar prueba, y **borrador en localStorage** (no se pierde al cerrar). El correo de prueba del SMTP usa este sistema.
- **Modelo de seguridad:** campos `pinHash`, `otpCorreoActivo` y `hashContrasena` en `Usuario`. El **PIN** es la credencial de acceso (se crea en el registro y se puede cambiar desde Configuración → Seguridad). La **contraseña** es el factor fuerte reservado para operaciones cripto (cambiarla solo requiere la contraseña actual). El **OTP por correo** es verificación de acciones sensibles, no credencial de login. `lib/seguridad.ts → verificarFactores` valida **clave + PIN/OTP activos** para acciones sensibles (base para el futuro modal de verificación con jerarquía, ver PLAN_SEGURIDAD.md). Pantalla **Configuración → Seguridad** con tres secciones: "Acceso a la cuenta" (PIN), "Verificación de acciones" (OTP correo, biometría Pronto, TOTP Pronto) y "Factor fuerte" (contraseña para cripto).
- **Proceso de verificación inicial:** **notificación in-app** al completar el registro ("¡Bienvenido! — completa tu verificación de identidad para acceder a todas las funciones"); **banner ámbar** discreto en el dashboard que desaparece cuando el KYC está aprobado (`nivelKyc≥1`); pestaña **Configuración → Verificación** con checklist de **2 pasos** (correo verificado · verificación de identidad KYC), contador a /2. (El PIN ya se establece durante el registro, por lo que no aparece como paso pendiente.)
- **KYC propio (manual, sin terceros) — completo de punta a punta:**
  - **Almacenamiento privado**: **MinIO** (S3-compatible) en contenedor — local con **podman**, producción en la VPS (`lib/almacenamiento.ts`). El navegador **sube al servidor** (Server Action, `bodySizeLimit` 25 MB) y este reenvía a MinIO; **MinIO nunca se expone**. La lectura de documentos por el super-admin pasa por un **route handler proxy autenticado** (`/api/almacen/[...key]`) que lee del MinIO interno y solo entrega al super-admin (las URLs firmadas directas no eran accesibles desde el navegador en producción).
  - **Modelo `VerificacionKyc`** (una fila por intento, con historial) + máquina de estados (`lib/kyc/estados.ts`): `pendiente → en_revision → aprobada / rechazada / reenvio_solicitado / baneada`, y desde **aprobada** se puede **revertir** (desverificar). Transiciones inválidas bloqueadas en Server Actions.
  - **Asistente del usuario en pop-up modal** (`components/kyc/`): flujo **progresivo** (primero el tipo de documento → nacionalidad V/E + número con ejemplo → recién entonces las fotos), con CTA claros y animaciones suaves. Documento cédula V/E o pasaporte (anverso/reverso), selfie, y **video de liveness 7-10 s** (`MediaRecorder`) con **3 pasos en tarjetas de color** (pestañea / boca / 3 dedos) y guía "Paso N de 3" con color por paso durante la grabación. Al terminar, **no usa reproductor** (el webm de MediaRecorder no reproduce por su falta de duración): muestra un **fotograma capturado + "Video grabado correctamente"** como confirmación. Solo aparecen los **pasos activos** (`KYC_REQUIERE_*`). Disclaimer "**la revisión tarda 24-48 h**" al enviar y en la notificación.
  - **Cola de revisión en super-admin** (pestaña Verificaciones): sub-listas **Pendientes / Aprobadas / Rechazadas** (última por usuario), **buscador** por nombre/usuario/correo, **toggles** de pasos requeridos, **métricas** por tarjeta (fecha/hora de recepción o de resolución y **quién** la revisó). Ver documentos por el proxy. Acciones: **tomar**, **aprobar / pedir reenvío / rechazar / rechazar y banear**, con **motivo** y **nota interna**; los botones se **resaltan al seleccionarlos** y exigen **confirmación con PIN o contraseña** del super-admin (anti clic accidental). Desde Aprobadas se puede **gestionar/revertir** (desverificar). Al aprobar sube `nivelKyc=1`; al rechazar/reenvío/banear baja a 0; banear marca `baneado`.
  - **Indicadores**: tag **"Verificado"** verde junto al nombre en el perfil cuando `nivelKyc≥1`, y tag **"Sin verificar"** ámbar (enlazado a la verificación) cuando no. Contador `/2` en la sección Verificación.
  - **Notificaciones app + correo** en cada cambio de estado (recibida, aprobada, reenvío, rechazada, baneada). QA E2E integral (usuario sube a MinIO → admin ve por proxy, toma, aprueba con credencial → usuario verificado) verde. Diseño en `docs/superpowers/specs/2026-05-31-kyc-verificacion-identidad-design.md` y plan por fases en `docs/superpowers/plans/`.
- **Beta desplegada y EN VIVO en la VPS-2** (`https://greensol.creceideas.com`): contenedores Docker **web (Next standalone) + db (Postgres 16) + minio** en red interna, solo `web` publicado en `127.0.0.1:3100`; **nginx del host + certbot** (HTTPS) como única fachada, **sin tocar** los servicios existentes (n8n, chatwoot, evolution). `Dockerfile` multi-stage, `entrypoint.sh` (`prisma migrate deploy` + arranque), `docker-compose.prod.yml`. La **base de datos local fue migrada** a la beta. El re-despliegue es `git pull + up --build` y **limpia el build cache** (`docker image prune -f` + `docker builder prune -f`; nunca `-a` en host compartido). Acceso SSH por llave. Guía en `docs/DESPLIEGUE_VPS.md`.
- **Login afinado:** el campo correo/usuario **no se borra** al fallar la clave (React 19 reseteaba el form); el identificador se **recorta** (un espacio del autocompletado impedía entrar con el correo); y el **nombre de usuario es case-insensitive** al entrar/registrarse/validar disponibilidad (`mode: "insensitive"`), pero se **guarda y muestra tal cual** lo escribió el usuario.

### ⏳ Pendiente (roadmap, de IDEAS_FUTURAS / PLAN_METODOS_PAGO / PLAN_SEGURIDAD / PLAN_NOTIFICACIONES / PLAN_KYC / PLAN_ADMIN)

- **Integración cripto:** wallet embebida no-custodial entregada en el **registro** (mostrar dirección + llave difuminada con ícono de ojo, bajo responsabilidad del usuario), **billetera en el dashboard**, **depósitos/retiros/transferencias**, multifirma/modo espejo; todo primero en **DevNet**. La wallet **principal** como método de pago predefinido sale de aquí. El flujo de pagos cripto en el detalle del san (pestaña Pagos) hoy solo muestra el monto y que va por la wallet; el pago real va en esta fase.
- **Sistema de referidos:** código por usuario (copiar/compartir), **+40 puntos a ambos** cuando el referido se registra con el código y hace su **primer aporte**, **máximo 5** premiados, **solo cuentas nuevas**, acreditación única; luego **club de canje** de puntos. Toca el esquema (`codigoReferido`, `referidoPorId` en `Usuario`).
- **Calendario de turnos con fechas:** ✅ **base hecha** — `Recolecta.fechaInicio` + frecuencia ya derivan la **fecha de cobro por participante** en Miembros. Falta el **calendario completo de la pestaña Pagos** con las fechas de corte por ronda (motor de rondas fase 2).
- **Código de invitación corto** propio: ✅ **hecho** — código `GS-XXXXXX` con vigencia y enlace directo (modelo `Invitacion`), además del `id`/cuid.
- **Despliegue:** ✅ **hecho** — beta en vivo en la VPS-2 (Docker). Pendiente: **CI/CD** (auto-redeploy desde GitHub en vez de `git pull` manual) y, a futuro, VPS dedicado para producción seria.
- **Almacenamiento de comprobantes:** subir captura del pago. La infraestructura **MinIO/S3** ya existe y está en producción (`lib/almacenamiento.ts`, usada por el KYC); falta engancharla al flujo de aportes (`comprobanteUrl`).
- **Monedas y bancos de otros países** (reactivar `MONEDAS_FIAT_FUTURAS` país por país).
- **Marketplace público**, dividir cuentas, login con Google y con wallet.

### 🆕 Pendientes nuevos de esta sesión (2026-06-02)

- **Modal de verificación con jerarquía** (estilo Binance — funcionalidad, estética nuestra): al confirmar una acción sensible, pedir **solo el factor más fuerte** que el usuario tenga activo (**biometría > authenticator > email > PIN**); si no tiene ninguno, no se pide pero igual se avisa. Enganchar a **crear/publicar san** y **métodos de pago**. Ver [PLAN_SEGURIDAD.md](PLAN_SEGURIDAD.md).
- **Más factores 2FA:** **TOTP** (Google Authenticator: otplib + QR), **biometría** (WebAuthn/passkeys) y **teléfono** (SMS / WhatsApp vía Evolution API) como dato y como 2FA. La activación de biometría real irá en el login (WebAuthn), no en el registro.
- **Flujo de cambio de contraseña** completo: alerta **"Restricciones de cuenta"** (Cancelar/Continuar) + **bloqueo de 24 h** de retiros/P2P/pagos y de unirse/crear ahorros, y pedir el factor más fuerte antes de cambiar.
- **Conectar las plantillas a los eventos reales** (OTP del registro, métodos de pago, san creado / unión): hoy el catálogo y el editor existen, pero los disparos siguen con textos viejos. Y **renderizar el formato (HTML)** en la campanita in-app.
- **Avisos por correo + app en todos los eventos del san:** invitación, sorteo de turnos, pago reportado/confirmado/rechazado, cierre (hoy varios solo in-app).
- **Barra de progreso de nivel en el dashboard**: debajo del nombre del usuario en el hero, una **barra visual** con el **% hacia el siguiente nivel** y cuántos **puntos faltan**. Hoy el progreso solo está en `/recompensa`; llevarlo al dashboard.
- **Índice único case-insensitive** del `nombreUsuario` a nivel de base de datos (hoy la unicidad sin-mayúsculas se valida en la app; blindaje contra una colisión exacta simultánea).
- **Limpieza de archivos huérfanos** en MinIO cuando se borran verificaciones (proceso de mantenimiento).
- **Conectar las notificaciones KYC al editor visual** de plantillas (hoy usan la plantilla de marca de `notificarYCorreo`).
- **Verificación de teléfono** (WhatsApp/SMS vía Evolution API), **niveles de KYC con límites por monto**, **foto de perfil** del usuario (poblar `fotoUrl`), **verificación de residencia** con comprobante.
- **Capa cripto / wallets de Solana** (DevNet): construir la conexión de wallets, wallet embebida, transacciones en devnet, firma/confirmación y bote multifirma desde cero en nuestro stack.

### 🆕 Pendientes (actualizado 2026-06-04)

- **Términos y Condiciones definitivos:** reemplazar la maqueta por el **texto legal real** (con la **razón social**, las **comisiones reales** y los datos que hoy van entre `[corchetes]`), revisado por la parte legal.
- **Motor de gamificación (mecánicas de puntos reales):** convertir el borrador de niveles/puntos/moras/comisiones de la página de Términos en lógica funcional (cómo se ganan y caducan los puntos, penalizaciones por mora, comisiones), conectado a la reputación existente.
- **Mora: avisos y reputación:** la mora ya se **calcula y muestra** (informativa); falta **notificar** al moroso/grupo/administrador y que el atraso **baje la reputación**.
- **Integración cripto (Solana devnet):** wallet embebida no-custodial, depósitos/retiros/transferencias y bote multifirma; el flujo de pago cripto en la pestaña Pagos hoy solo muestra el monto y que va por la wallet — el pago real va en esta fase.
- **Comprobantes de pago** (subir captura vía MinIO/S3 ya existente) y **referidos**.

> **Próximo foco acordado:** ✅ **flujo del san mejorado de punta a punta** (completado — v0.0.99–v0.0.106) + ✅ **invitación con solicitud de unión, portero de verificación, pestaña Miembros y Pagos simplificada** (completado — v0.0.107–v0.0.117) + ✅ **inicio del san con sorteo de turnos (motor de rondas fase 1/3), pagos con declaración/PIN, congelar $, invitar por @usuario, términos y pulidos** (completado — v0.0.118–v0.0.137) + ✅ **motor de rondas completo —fases 2 y 3—, mora informativa, entrega del bote, Cuentas por pagar y refinamientos de Pagos** (completado — v0.2.0–v0.2.6). Siguiente: **términos definitivos**, **motor de gamificación**, **integración cripto** (DevNet) y factores de **seguridad** restantes.

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

Cada monto muestra un **tag con el equivalente en Bs** a la tasa elegida: **BCV**, **USDC** (mercado/cripto, aproximada; antes se mostraba como "USDT") o **personalizada**. En preferencias: moneda por defecto (Bs/USDC) y tasa. Las tasas son **solo informativas**, nunca mueven fondos.

**Fuentes de datos (detalle en [INTEGRACIONES_API.md](INTEGRACIONES_API.md)):**
- **BCV oficial:** CDN público del BCV. Tasa oficial del Banco Central de Venezuela.
- **USDT P2P (Binance):** API privada de un proveedor venezolano, con API key en variables de entorno. No va en el repo.
- **Precio de SOL / USDC:** **DexScreener** (API pública, sin key).

**Estrategia de consulta y caché (clave — no saturar las APIs):** nunca se llama por usuario ni por acción. Se hace **una consulta global** de la app, se **cachea** con su timestamp, y todos los usuarios, sanes y la calculadora **leen del caché**. Frecuencias (hora de Venezuela, VET = UTC−4):

| Fuente | Refresco |
| --- | --- |
| BCV | **4× al día** (06:00 · 11:00 · 14:00 · 19:00 VET) |
| USDT (Binance) | cada **30 min** |
| SOL/USDC (DexScreener) | cada **30 min** |

Implementado con un **planificador en el servidor** (cron job del servidor / route `/api/cron/tasas`). La etiqueta de la tasa de USDT en el dashboard y la calculadora dice **"USDC / promedio"** (la palabra "paralelo" fue reemplazada). La tasa de SOL en el dashboard dice **"SOL / USDC"** (antes "SOL / USD").

> **Aviso legal** (mostrar donde se vean tasas): los datos provienen de [bcv.org.ve](https://www.bcv.org.ve); Green Sol no se responsabiliza por su veracidad ni actualización; el **BCV es el único ente autorizado** para modificar la tasa oficial en Venezuela.

## 8. Calculadora de cotizaciones

Herramienta clave accesible desde la **barra de navegación** (sección 12). **Implementada** (`components/calculadora.tsx`): primero **eliges la moneda de origen** entre cuatro —**Bolívares**, **Dólar BCV**, **USDT** y **Solana** (la etiqueta "Dólar BCV" es explícita; **no hay euro**)— y escribes el monto con el **símbolo de la moneda como prefijo** (Bs, $, USDT, SOL). Debajo se muestra la **cotización del día** de esa moneda y, en tarjetas, las **conversiones a las otras tres**.

Convierte en ambos sentidos:

- **Bolívares** ↔ dólar a tasa **BCV** y **USDC** (promedio, antes llamado "paralelo").
- **Dólar BCV** (≈ dólar oficial / digital).
- **SOL** (a su precio del día vía DexScreener; valorado en Bs vía USDC, con caída a BCV si no hay USDC).

Es más completa que las calculadoras de tasas venezolanas habituales (que solo hacen Bs↔USD): aquí se suma SOL, leyendo del **caché global** (sección 7) para no consultar las APIs en cada cálculo. Ejemplos: "¿cuántos Bs son 20 USDT?", "¿cuántos Bs equivale 1 SOL?", "¿cuánto SOL son 50 dólares BCV?".

## 9. Turnos del san y mora

- **Turnos — sorteo implementado (v0.0.129–v0.0.137):** al **iniciar el san**, el organizador asigna el orden con **tres modos**, todos confirmados con **PIN**: **Manual (a dedo)** con manija de arrastre y flechas ↑/↓; **Aleatorio rápido y visual** (baraja al instante, se puede repetir hasta que guste); y **Ruleta 🎰** con **animación SVG colorida (8 colores), desaceleración (ease-out), tic por segmento y arpegio de ganador** en **Web Audio** (sin archivos ni librerías). La ruleta revela el orden **turno por turno**; el penúltimo giro deja el último **"por descarte"**, que se muestra sobre la ruleta ~3 s antes de cerrar; su resultado es **definitivo**. Al iniciar, se crean los `Turno`, el san pasa a **En curso**, se fija `fechaInicio` y `rondaActual = 1`, y se **avisa a cada participante su turno** (evento `san_iniciado`). Siempre **público**: todos ven el orden resultante. Antes de iniciar, un **velo/ojo** difumina la info para dar percepción de bloqueo y resaltar el inicio.
- **Mora — pendiente (motor de rondas fase 2):** la app **notificará al grupo, al moroso y al administrador** (sección 13) clasificando cada pago como **a tiempo / mora / adelantado** según las **fechas de corte** por ronda. **Multa por mora opcional** (porcentaje o monto fijo, en USDC/SOL/Bs). La mora también **baja la reputación** (sección 10). Spec en `docs/superpowers/specs/2026-06-03-motor-rondas-san-design.md`.

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
- **Tarjeta de tasas de hoy:** BCV, **USDC / promedio** y **SOL / USDC** del caché global (sección 7), con enlace a la calculadora. Las etiquetas reflejan el cambio de nomenclatura: "USDC / promedio" reemplaza a "USDT" y "SOL / USDC" reemplaza a "SOL / USD".
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
  4. **Moneda:** selector con cuatro opciones, cada una con etiqueta completa: **"Bolívares — dólar BCV (pagas en Bs)"** (clave `bs_bcv`), **"Bolívares — promedio (USDC) (pagas en Bs)"** (clave `bs_usdt`; la palabra "paralelo" fue reemplazada por "promedio"), **"USDC (Solana) · Cripto"** (clave `usdc`) y **"SOL (Solana) · Cripto"** (clave `sol`). El monto se escribe con el **símbolo de la moneda como prefijo**. Hay un botón **"¿Cuál elijo? Ver guía"** que abre el modal de guía de monedas (ver abajo) sin salir del paso.
  5. **Detalles según tipo:** el **san** pide, en orden, **nº de participantes (manos, 2–50)** → **meta por turno anclada en dólares** (se paga en Bs a la tasa del día) → **aporte por persona calculado** (= meta ÷ participantes) → **frecuencia** (semanal/quincenal/mensual o **"Personalizar"** con días a medida, campo `frecuenciaDias`) → **duración estimada** (en días y su equivalente en semanas, p. ej. "~75 días (≈11 semanas) · 5 turnos"); la **vaca** pide la **meta**.
  6. **Método de pago:** el organizador **elige uno de sus métodos de pago del perfil**, **filtrado por la moneda** del san (Bs → fiat VES; USDC/SOL → cripto). Si **no tiene** un método compatible, el paso se **bloquea** con un mensaje y enlace a **Perfil → Pagos**. Los datos de pago se **copian** del método elegido (vía endpoint `/api/metodos-pago`) hacia `DatosPagoRecolecta`.
  7. **Resumen y crear.** Al crear, el usuario recibe un **aviso en app y por correo** ("¡Creaste tu ahorro!").

- **Guía de monedas fiat vs cripto** (`sanes/guia/page.tsx` + modal accesible desde el paso 4 del asistente mediante el botón "¿Cuál elijo? Ver guía"):
  - Explica que **Fiat** es el dinero tradicional emitido por gobiernos (billetes y monedas, ej. bolívar o dólar físico), que circula por bancos, efectivo y pago móvil. Al crear un ahorro fiat en Green Sol, cada participante paga directamente al organizador por su método habitual (transferencia, Zelle, pago móvil…) y reporta el pago en la app.
  - Explica que **Cripto** son monedas digitales que viven en la red Solana, guardadas en una wallet que Green Sol entrega automáticamente al registrarse. Para aportar cripto, el usuario debe comprarlas en un exchange (ej. Binance) y retirarlas a la dirección de wallet que da la app.
  - Detalla las cuatro opciones: "Bolívares — dólar BCV (pagas en Bs)", "Bolívares — promedio (USDC) (pagas en Bs)", "USDC (Solana) · Cripto", "SOL (Solana) · Cripto".
  - El modal se puede abrir sin salir del flujo de creación.

- **Unirse a un ahorro** (`sanes/unirse/page.tsx` + componente `unirse-ahorro.tsx`; acciones `buscarRecolecta` / `unirseARecolecta` en `sanes/actions.ts`): por **enlace o código**. El **código es el id de la recolecta** (cuid); la página acepta `?codigo=` para precargarlo. Al unirse se **notifica al organizador**.

- **Compartir** (`components/compartir-ahorro.tsx`): en el detalle de la recolecta, muestra el **código**, botón de **copiar enlace** y **compartir nativo**.

- **Guía visual** (`sanes/guia/page.tsx`): tarjetas con infografía por método —**San · Susi · Bolso** (por turnos), **Vaca · Pote** (meta común) y **Dividir una cuenta** (repartir un gasto)— cada una con "cómo aprovecharlo". Esta misma página aloja la guía de monedas fiat vs cripto descrita arriba.

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

**Registro y login:**
- **Registro — flujo reordenado (estilo Cashea):** `correo → verificar correo con código OTP → crear PIN (6 dígitos) → datos del perfil → pantalla "¡Tu cuenta está lista!"`. El paso de creación del PIN se titula **"Crea tu PIN (clave)"**. El campo de PIN se enmascara con puntos (•). Al confirmar el PIN, aparece feedback en tiempo real: **"✓ Las claves coinciden"** o **"✗ No coinciden"**. La pantalla de verificación del correo dice **"Verifica tu correo"** (verificación del correo — criterio distinto a la verificación de identidad/KYC). El enlace **"Empezar otro registro"** reinicia el progreso: borra el usuario pendiente incompleto y libera el correo.
- **El PIN** es la credencial principal de acceso desde el primer inicio de sesión. Se almacena con **Argon2**. Bloqueo automático tras **5 intentos fallidos** durante **15 minutos**.
- **Login:** correo o nombre de usuario → PIN.
- **La contraseña** es un factor fuerte **opcional**, reservado para operaciones cripto de alto valor (retiros, etc.) junto a biometría/WebAuthn (aún no implementada). No se usa en el login diario. No fue eliminada del sistema; queda como campo `hashContrasena` en `Usuario` para los usuarios que la tengan.
- **Migración suave:** cuentas existentes con contraseña pero sin PIN son redirigidas automáticamente a `/migrar-pin` al intentar entrar: confirman su contraseña actual, crean su PIN, y su contraseña se conserva como factor fuerte.
- **El PIN NO se presenta como "2FA"**: es la credencial principal. El checklist de verificación del usuario es: correo verificado + verificación de identidad (KYC).
- **Pop-up de biometría eliminado del registro:** la activación de biometría real (WebAuthn/passkeys) irá en el login cuando se construya, no en el registro.
- **OTP por correo:** código de un solo uso que confirma el correo al registrarse y que, opcionalmente, puede activarse como verificación de acciones sensibles. Sale por el **servidor SMTP propio**.
- **Login con wallet** (Phantom/Solflare): se entra por la **firma** de la wallet, **sin OTP** (la propia wallet autentica).
- **Métodos combinables:** quien entró por wallet puede **vincular** luego correo + contraseña + OTP si lo desea; quien se registró por correo recibe su **wallet embebida no-custodial** (sección 6).
- Sin cédula al inicio, para no poner barrera.
- **A futuro (no MVP):** Google (OAuth) y TOTP/Google Authenticator.

**Onboarding** (`app/onboarding/`): tras el registro, un **carrusel a pantalla completa** con infografías explica los métodos de ahorro (incluye "San, susi o bolso — por turnos", correcto con la terminología actual), con **checkbox "no volver a mostrar más"** (persistido en `Usuario.onboardingCerrado`) y una **pantalla de carga con el logo**.

**Perfil — hub** (`app/(app)/perfil/page.tsx`, ruta `/perfil`). Implementado como **centro de cuenta**:
- **Tarjeta de identidad:** inicial/avatar, nombre, **@usuario**, **nivel** (Nivel N · Nombre) y **puntos**, con desglose de positivos/negativos.
- **Menú:** **Tu recompensa** (`/recompensa`), **Tus datos** (`/configuracion?tab=datos`), **Métodos de pago** (`/configuracion?tab=pagos`), **Centro de ayuda** (`/ayuda`), **Términos y Condiciones** (`/terminos`, maqueta con el deslinde P2P y el borrador de niveles/puntos/moras/comisiones), **Configuración** (`/configuracion`), **Panel super-admin** (`/admin`, solo si el rol es `super_admin`) y **Cerrar sesión** (con **pop-up de confirmación** "¿Cerrar sesión?" antes de salir).

**Configuración — sección propia** (`app/(app)/configuracion/page.tsx`, ruta `/configuracion`). Dejó de ser un drawer; ahora es una página con **pestañas**:
- **Datos:** correo, nombre, apellido y **nombre de usuario** (3–15 caracteres), con **validación de disponibilidad del nombre de usuario en vivo** (endpoint `app/api/usuario-disponible/route.ts`).
- **Pagos (métodos) — rediseñado** (modelo `MetodoPago`, `components/form-metodo-pago.tsx` + `components/metodo-pago-item.tsx`): el usuario **crea, edita y elimina** sus métodos para **recibir** en los ahorros que organice. Flujo de creación: **categoría Fiat o Cripto** → **moneda** (selector buscable; el MVP habilita **VES** y **USD**, y las demás monedas de LatAm aparecen **deshabilitadas con la etiqueta "Pronto"** desde `MONEDAS_FIAT_FUTURAS`) → **método** → **datos**:
  - **Fiat VES:** Transferencia (banco buscable de `lib/bancos-venezuela.ts`, tipo de cuenta, número, titular, cédula) o Pago móvil (banco, teléfono, titular, cédula).
  - **Fiat USD:** Efectivo, Zelle, Zinli, WalyTech o Banco (USD).
  - **Cripto (red Solana):** USDC o SOL → dirección de **wallet externa** + alias. (La wallet **principal** la entregará la integración cripto, predefinida y no editable; campo `principal`.)
  - **Prohibición** clara: los datos deben ser del **titular, persona natural** (no terceros ni empresas).
  - **Seguridad:** agregar, editar y eliminar un método **piden confirmar con la clave** (`lib/seguridad.ts`) y **avisan en app y por correo** (`notificarYCorreo`).
- **Seguridad:** tres secciones — **"Acceso a la cuenta"** (PIN, funcional: cambiar PIN — confirmando con el PIN actual — y sin posibilidad de eliminarlo si es la única credencial, para evitar lockout), **"Verificación de acciones"** (OTP por correo con toggle, biometría y TOTP como "Pronto"), **"Factor fuerte"** (contraseña para cripto, funcional: cambiar). Ver §0 Estado del proyecto para el modelo completo.
- **Avisos:** preferencias de correos/marketing (**próximamente** — placeholder).
- Para el super-admin, un **toggle a super-admin** (`components/toggle-admin.tsx`) lleva al panel.

A futuro (fase cripto): la **wallet embebida principal** (USDC/SOL) que la app entrega al registrarse aparecerá como método de pago predefinido y no editable.

**Restricciones / lista negra de palabras** (`lib/restricciones.ts`): bloquea palabras de **falsa autoridad** (admin, organizador, soporte, moderador, root, oficial, "green sol", etc.) en **nombre, apellido y nombre de usuario**, tanto en el **registro** como al **editar el perfil**. El **super-admin queda exento** y puede **editar las listas** desde su panel (claves `BLACKLIST_NOMBRE`, `BLACKLIST_APELLIDO`, `BLACKLIST_USUARIO`).

**Centro de ayuda** (`/ayuda`) y **Recompensa** (`/recompensa`) son páginas nuevas ya creadas.

**KYC:** no para registrarse, pero **sí para funciones de dinero**, implementado con flujo propio y manual (ver §0, sección "KYC propio completo").

**Roles:** **2 roles activos** — `usuario` (por defecto al registrarse) y `super_admin` (acceso al panel `/admin`). El rol `admin_grupo` fue eliminado del enum en la migración `20260602012525_roles_sin_admin_grupo`. **El "organizador de un san" no es un rol del sistema**: es una etiqueta derivada de las recolectas que ese usuario organiza (cualquier usuario puede crear un san). El rol se puede cambiar desde el panel super-admin (tabla de usuarios o ficha). El login de un usuario **baneado** (`baneado = true`) es bloqueado por el sistema.

**Favicon de marca:** el favicon de la app fue actualizado para mostrar el logo de Green Sol (badge verde con el ícono del sol). Antes mostraba el triángulo por defecto de Next.js. El logo se compone manualmente (en Canva), no se genera con IA.

## 15. Panel super-admin

Acceso interno separado (`app/admin/page.tsx`, ruta `/admin`), **responsive**, protegido por `app/admin/layout.tsx` (solo `super_admin`), organizado en **4 pestañas** (`components/panel-tabs.tsx`):

- **Métricas (reales, desde la base de datos):** usuarios **totales**, **verificados** y **nuevos** (hoy, ayer, 7 días, 30 días); recolectas totales, **sanes y vacas activos**, abiertas y cerradas; **aportes confirmados** y monto sumado; y **rankings** por **moneda**, por **método de recolecta** (tradicional/cripto) y por **método de pago**.
- **Usuarios — módulo de gestión completo** (`components/admin/tabla-usuarios.tsx` + `components/admin/ficha-usuario.tsx`, lógica en `lib/admin/usuarios.ts`, acciones en `app/admin/usuarios-actions.ts`):
  - **Buscador** por correo, @usuario, teléfono o número de cédula (campo `id="buscar-usuarios"`, `aria-label="Buscar usuarios"`).
  - **Chips de filtro** rápido: Todos · Verificados · Sin verificar · Suspendidos.
  - **Lista paginada** (20 por página) con avatar, correo, @usuario, insignia de estado (Verificado/Sin verificar/Suspendido), chip de rol.
  - **Acciones por fila con íconos** (botones con `aria-label`, no texto): **Ver ficha** (`Eye`), **Restablecer verificación** (`RotateCcw`), **Suspender/Reactivar** (`Ban`/`CircleCheck`), **Eliminar** (`Trash2`). Todas piden **confirmación** en un modal inline antes de ejecutarse.
  - **Ficha de usuario en modal** (`role="dialog"`, `aria-labelledby="ficha-titulo"`): identidad completa (nombre, @usuario, correo, país, teléfono verificado, fecha de registro, ingresos declarados), sección Seguridad (tiene PIN / tiene contraseña / OTP activo / bloqueo de PIN), sección KYC con estado e imágenes de documentos (vía proxy autenticado `/api/almacen/[...key]`), lista de métodos de pago, y las mismas acciones de la fila más un selector de rol detallado.
  - **Confirmación con credencial** (PIN o contraseña del super-admin) antes de acciones destructivas (suspender, eliminar, revocar verificación), para evitar clics accidentales.
  - **Salvaguardas:** el super-admin no puede auto-eliminarse ni auto-degradar su rol a `usuario`; el sistema garantiza que siempre quede al menos un super-admin activo.
  - **Login bloqueado para suspendidos:** `baneado = true` impide el inicio de sesión (verificado en `iniciarSesion`).
  - **Responsive en móvil:** el listado adapta sus columnas en pantallas pequeñas, sin scroll horizontal.
- **Verificaciones (KYC):** cola de verificación en sub-listas Pendientes / Aprobadas / Rechazadas (ver sección KYC en §0).
- **Configuración** con subpestañas General · SMTP · Plantillas · Restricciones. SMTP con toggle SSL, remitente en dos campos, verificar conexión y enviar prueba; Plantillas con editor visual; Restricciones con listas negras de palabras.

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
- **Fase 1 — MVP gancho (tradicional). Núcleo construido y verificado (app v0.0.94).** Hecho (build + tests unitarios + E2E con Playwright): bienvenida y **onboarding** con carrusel, registro/login (correo → OTP → **PIN 6 dígitos como credencial principal** → datos; **migración automática** de cuentas antiguas a PIN; **contraseña como factor fuerte** para cripto; **OTP como verificación** de acciones), **navegación de 5 pestañas** con header de nivel y avisos, **dashboard** con **tasas en vivo** (etiquetas "USDC / promedio" y "SOL / USDC"), **calculadora** rediseñada (Bs · Dólar BCV · USDT · Solana), sección **Ahorro** con **asistente de creación por pasos** —incluido el paso de **método de pago elegido del perfil** y el botón "¿Cuál elijo? Ver guía" con la guía de monedas fiat vs cripto— y **unirse por enlace/código** + compartir + guía, **pagos** (por confirmar/rechazados/activos), turnos, **notificaciones (toasts + campanita)** más **avisos en app + correo** en acciones sensibles, **métodos de pago rediseñados** (modelo `MetodoPago` fiat/cripto con agregar/editar/eliminar y **confirmación por clave**), **reputación por puntos y niveles** (Nuevo → Leyenda), **perfil/configuración** (con validación de usuario en vivo y restricciones de palabras) y **panel super-admin** con **métricas, gestión de usuarios completa** (buscador/filtros/ficha/acciones por íconos/paginación/confirmación por credencial/salvaguardas de roles/login bloqueado para suspendidos), **roles simplificados a 2** (usuario/super_admin), restricciones, SMTP y configuración de app. Más: plantillas con editor visual, SMTP real, **KYC propio completo** (documento + selfie + video de liveness, MinIO, cola de revisión con confirmación por credencial), **planificador de tasas** (SOL/USDC cada 30 min; BCV a las 6/11/14/19 VET), **favicon con el logo de Green Sol**, **beta desplegada y en vivo en la VPS-2** (Docker + nginx + certbot) y **suite E2E aislada** (global setup/teardown limpia @test.local; 15/15 verde). Entrega de primera versión: **1 de junio de 2026, 5:30 p.m.** Pendiente de esta fase: **mejorar el flujo del san**, **sistema de referidos** (ver [IDEAS_FUTURAS.md](IDEAS_FUTURAS.md)), **calendario de pagos con fechas**, **almacenamiento de comprobantes** (MinIO/S3 en VPS).
- **Fase 2 — Capa cripto (enseguida tras el núcleo, en devnet):** wallet embebida **no-custodial** + onboarding de respaldo, login con wallet (Phantom/Solflare), USDC/SOL, depósitos/retiros/transferencias, multifirma o modo espejo, multas por mora. Alto estándar de seguridad web3; devnet antes de dinero real.
- **Fase 3 — Confianza y escala:** dividir cuentas, KYC con proveedor, panel super-admin completo, **marketplace público**, login con Google, despliegue en VPS.
- **Fase 4 — Móvil:** Android/iOS.

> **Nota de alcance MVP (1-jun):** priorizar lo **mostrable** para el screenshot/video. Mayor impacto con menor esfuerzo: **dashboard con tasas reales + calculadora** (APIs ya disponibles), **bottom nav**, y el **flujo de crear un san** (UI). Registro con verificación de correo y notificaciones completas pueden ir parciales si el tiempo aprieta.

## 20. Identidad de marca y diseño

- **Green Sol — doble sentido de "Sol":** por un lado **SOL**, el símbolo de **Solana**; por otro, el **Sol**, la estrella radiante. Un sol **verde** (las estrellas pueden ser azules, blancas, amarillas… o verdes), elegido porque el verde vende y representa **dinero, organización y calma**. Estética de **espacio y galaxias**; ícono de sol que contrasta en claro y oscuro.
- **Logo:** badge circular verde (degradado radial `#14C98A → #0E9F6E`) con el **ícono `sun` de Lucide en blanco** (círculo hueco + 8 rayos de puntas redondeadas) y un halo verde claro. Funciona en claro y oscuro. Asset: `assets/green-sol-logo.svg`. El **logo se compone manualmente** (en Canva) — no se genera con IA. El favicon de la app usa este mismo logo.
- **Modo light por defecto** — tanto en el PRD como en la app. La primera impresión transmite más confianza y seriedad en claro. El **modo dark es opcional**, con un botón de cambio fácil en el dashboard principal.
- **Paleta:** verde de marca como base (`#0E9F6E` light / `#1DCB8E` dark), con **acentos** donde aporten (no todo verde). Las **estrellitas de reputación van en dorado**: `#C8881A` en light y `#F5C84B` en dark. Para imágenes de redes, paleta de fondo con el degradado de Solana (morado `#9D4EEE` → azul `#5882D1` → verde `#0BC595`).

## 21. Despliegue

- **Pruebas / MVP:** Vercel (cuenta y proyecto vinculados con GitHub; auto-redeploy en cada push) + Postgres gestionada + object storage.
- **Producción:** VPS propio en contenedor cerrado cuando madure. Detalle en [ARQUITECTURA_TECNICA.md](ARQUITECTURA_TECNICA.md).

## 22. Fuera de alcance / decisiones abiertas

- **Sistema de referidos (pendiente, no implementado — roadmap).** Código de referido por usuario (copiar/compartir), **+40 puntos a ambos** (quien invita y referido) cuando el referido **se registra con el código y hace su primer aporte**, **máximo 5 referidos** premiados, **solo cuentas nuevas**, acreditación única. Más adelante, **club de canje de puntos**. Toca el esquema (campos `codigoReferido`/`referidoPorId` en `Usuario`) y la lógica del evento "primer aporte". Detalle en [IDEAS_FUTURAS.md](IDEAS_FUTURAS.md).
- Proveedor de wallet embebida y de KYC externo.
- Set final y orden de íconos del bottom nav (pendiente revisar referencias visuales).
- Detalle del algoritmo de reputación (estudiar Cashea).
- ¿Notificaciones por correo/push además de in-app? (fase posterior).
- Modelo de negocio.
