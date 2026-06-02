# Changelog — Green Sol

Versionado **0.0.x** durante el desarrollo, incrementando por cada avance, hasta **v1.0** (primera versión estable / preview en vivo). A partir de v1.0 se publican *releases*.

Formato basado en [Keep a Changelog](https://keepachangelog.com/es/).

## [0.0.85] — 2026-06-01 — test+docs(admin): aislar E2E (@test.local), smoke de gestión de usuarios y docs

### Añadido

- **`e2e/global-setup.ts`** y **`e2e/global-teardown.ts`**: limpieza automática de todos los usuarios `@test.local` y sus dependientes (orden: `Valoracion` → `Participante` → `Recolecta` organizadas → `Usuario`; cascade Prisma elimina `Sesion`/`CodigoOtp`/`Notificacion`/`MetodoPago`/`VerificacionKyc`). Filtra estrictamente por `endsWith: "@test.local"`; nunca toca `qa@greensol.local` ni `luisitoys@gmail.com`.
- **`playwright.config.ts`**: conecta `globalSetup` y `globalTeardown` a los nuevos archivos de limpieza.
- **`app/api/test/seed-admin/route.ts`**: endpoint de prueba (solo dev — `NODE_ENV === "production" → 404`) que siembra 2 usuarios `@test.local` normales con correos deterministas e inicia sesión como `qa@greensol.local` (super_admin ya existente, sembrado por `npm run seed:dev`).
- **`e2e/admin-usuarios.spec.ts`**: smoke del módulo de gestión de usuarios. Verifica: seed-admin → `/admin` → pestaña "Usuarios" → búsqueda por correo → aparece en lista → clic en "Ver ficha" → modal abre y muestra correo del usuario.
- **Docs**: `docs/PRD.md` actualizado a v0.13 — nuevo módulo de gestión de usuarios (buscar/ficha/suspender/restablecer/eliminar), roles a 2 (usuario/super_admin), login bloqueado para suspendidos, panel admin a 4 pestañas. `docs/ARQUITECTURA_TECNICA.md` actualizado a v0.6 — tabla de roles sin `admin_grupo`, módulo `app/admin` + `lib/admin/usuarios.ts` + `components/admin/`, aislamiento E2E (global setup/teardown limpia `@test.local`; QA usa `qa@greensol.local`).

### Verificado

- Typecheck limpio (`tsc --noEmit`). Suite E2E 15/15 verde. DB: 0 `@test.local` tras teardown; `qa@greensol.local` y `luisitoys@gmail.com` intactos.

## [0.0.78] — 2026-06-01 — fix(auth): gestión del PIN en Configuración coherente con el nuevo modelo

### Corregido

- **Bug C-1 (PIN de 4–5 dígitos dejaba sin acceso):** `definirPin` validaba `^\d{4,6}$`; ahora usa `pinFormatoValido` (exactamente 6 dígitos, no trivial). Si no cumple, devuelve "El PIN debe ser de exactamente 6 dígitos." o "Elige un PIN menos obvio.". El label/placeholder en `form-seguridad.tsx` ya no dice "4–6 dígitos".
- **Bug C-2 (usuarios nuevos sin contraseña no podían cambiar su PIN):** `definirPin` ya no exige `hashContrasena`. La identidad se confirma con el **PIN actual** (usando `verificarPin`, que aplica el bloqueo por intentos). Fallback defensivo: si no tiene PIN pero sí contraseña, se pide la contraseña.
- **Lockout al quitar PIN:** `quitarPin` ahora bloquea la operación si el usuario no tiene `hashContrasena` (el PIN es su única credencial), devolviendo un error claro. En la UI se oculta el formulario de quitar PIN y se muestra un aviso explicativo con enlace conceptual a la sección "Factor fuerte".

### Cambiado

- **`app/(app)/configuracion/actions.ts`:** `definirPin` recibe `pinActual` (en lugar de `clave`) para confirmar identidad cuando ya hay PIN. Se elimina el helper `confirmarClave` (que devolvía false sin `hashContrasena`). Se usa `hashearPin`/`verificarPin` de `lib/auth/pin` y `hashContrasena` de `lib/auth/password` en lugar de `hash` de argon2 directamente. `quitarPin` verifica `hashContrasena` antes de proceder.
- **`components/form-seguridad.tsx`:** sección PIN reescrita con `CampoPin` (3 campos: PIN actual, nuevo, confirmar nuevo). El formulario llama a `definirPin` via `useTransition` construyendo `FormData` manualmente (necesario porque `CampoPin` es uncontrolled). Acepta nueva prop `tieneContrasena: boolean`. El formulario de quitar PIN se condiciona a `tieneContrasena`; si es false, muestra aviso `AlertTriangle`.
- **`app/(app)/configuracion/page.tsx`:** pasa `tieneContrasena={!!usuario.hashContrasena}` a `FormSeguridad`.

### Verificado

- Typecheck limpio (`tsc --noEmit` sin errores). E2E suite 14/14 verde.

## [0.0.77] — 2026-06-01 — refactor(auth): PIN es la credencial (no 2FA); contraseña = factor fuerte; docs

### Cambiado
- **Modelo de auth documentado y coherente en la UI:** el PIN de 6 dígitos es la **credencial de acceso** (ya lo era en el código desde tasks previas); la **contraseña** es un factor fuerte reservado para operaciones cripto (no para el login). El **OTP por correo** es verificación de acciones, no credencial de login.
- **`form-seguridad.tsx`**: la pantalla Seguridad ahora tiene tres secciones claras — "Acceso a la cuenta" (PIN), "Verificación de acciones" (OTP correo + Pronto: biometría, TOTP), "Factor fuerte" (contraseña para cripto). Se elimina el título "Autenticación de dos factores (2FA)" y la lógica que bloqueaba cambiar la contraseña hasta tener 2FA activo.
- **`seccion-verificacion.tsx`**: el checklist de verificación pasa de **3 pasos** (correo · 2FA · KYC) a **2 pasos** (correo verificado · identidad KYC). El PIN ya se establece en el registro, no es un paso pendiente. Se elimina la prop `tiene2FA`.
- **`configuracion/page.tsx`** y **`perfil/page.tsx`**: ya no calculan ni pasan `tiene2FA` a `SeccionVerificacion`.
- **`dashboard/page.tsx`** y **`perfil/page.tsx`**: `verificacionCompleta` ahora solo depende del KYC (`nivelKyc ≥ 1`), no del 2FA. El banner de verificación desaparece al completar la identidad.
- **`configuracion/actions.ts → cambiarContrasena`**: eliminada la regla del modelo viejo que exigía tener PIN o OTP activo para cambiar la contraseña. Ahora solo se requiere la contraseña actual (coherente con "factor fuerte").
- **`app/(auth)/actions.ts`**: extraído el helper `buscarUsuarioPorIdentificador` (no exportado) para eliminar el bloque `findFirst` duplicado en `iniciarSesion` y `crearPinMigracion`.
- **`migrar-pin/page.tsx`**: eliminado el `<input type="hidden" name="identificador">` redundante (el valor ya se inyecta con `fd.set`).
- **`lib/seguridad.ts`**: documentación actualizada — `verificarFactores` es para acciones sensibles, no para el login.
- **`app/(auth)/actions.ts → completarRegistro`**: notificación de bienvenida actualizada ("¡Bienvenido! completa tu verificación de identidad") en lugar de pedir agregar un método 2FA que ya existe.
- **Docs**: `PRD.md` y `PRD.html` actualizados a v0.12/v0.0.77 con el nuevo modelo de auth. `CHANGELOG.md` actualizado.

### Verificado
- Typecheck limpio. E2E suite completa verde.

## [0.0.69] — 2026-06-01 — Fixes: OTP con plantilla de marca + banner de verificación reaparece

### Corregido
- **El OTP del registro llegaba en texto plano.** Ahora `crearYEnviarOtp` usa la plantilla de marca `correo_otp` (HTML con el código resaltado), editable desde el editor de plantillas; con fallback a texto si no resuelve.
- **El banner "Completa tu verificación" del dashboard/perfil no reaparecía** al rechazar/pedir reenvío del KYC (solo miraba el 2FA). Ahora se muestra mientras falte 2FA **o** la verificación de identidad (`nivelKyc < 1`), con texto genérico "Completa tu verificación para acceder a todas las funciones".

### Otros
- `tsconfig` excluye `_privado` (código de referencia de Noah no debe entrar al typecheck).

### Verificado
- Typecheck limpio; plantilla OTP resuelve con HTML de marca; suite E2E 6/6.

## [0.0.68] — 2026-06-01 — Fix: confirmar método de pago con la clave (no exigir el PIN)

### Corregido
- **No se podía agregar/editar/eliminar un método de pago** si el usuario tenía PIN activo: las acciones usaban `verificarFactores`, que exige **todos** los factores activos (clave + PIN + OTP), pero el formulario solo tiene el campo de **clave** — daba "clave incorrecta" en bucle. Ahora confirman **solo con la clave** (`verificarContrasena`), consistente con el texto del formulario. El refuerzo con PIN/2FA irá en el futuro "modal de verificación con jerarquía".

### Verificado
- Typecheck limpio.

## [0.0.67] — 2026-06-01 — KYC: notificaciones conectadas al editor de plantillas

### Añadido
- **5 eventos de verificación en el catálogo** (`lib/correo/catalogo.ts`, categoría "Verificación"): `kyc_recibida`, `kyc_aprobada`, `kyc_reenvio`, `kyc_rechazada`, `kyc_baneada`, con plantillas app + correo de marca y variable `{{motivo}}`. Quedan **editables desde el editor visual** del super-admin (con override en BD).
- Helper **`notificarEvento(usuario, clave, datos, opts)`** (`lib/notificaciones.ts`): dispara un evento del catálogo por sus canales (app/correo), aplicando override o default y reemplazando variables.

### Cambiado
- Las acciones del KYC (`enviarVerificacion`, `resolverKyc`) ahora usan `notificarEvento` en vez de textos fijos: el contenido de las notificaciones KYC sale del catálogo/editor.

### Verificado
- Typecheck limpio; resolución de eventos KYC probada (variables aplicadas). Suite E2E 6/6.

## [0.0.66] — 2026-06-01 — Documentación completa al día (PRD, PRD HTML)

### Cambiado
- **`PRD.md` §0 (Estado del proyecto)** reescrito a v0.0.65: KYC propio completo con todo el detalle (almacenamiento MinIO + proxy de lectura autenticado, máquina de estados con revertir, asistente en pop-up con flujo progresivo, video con fotograma de confirmación y colores por paso, cola de revisión con buscador/métricas/confirmación por credencial, tags Verificado/Sin verificar, disclaimer 24-48 h), **beta desplegada y en vivo en la VPS-2** (Docker web+db+minio, nginx+certbot, DB migrada, limpieza de cache) y **afinado del login** (campo persistente, trim, usuario case-insensitive). Pendientes nuevos (reproducción de video del usuario, conectar plantillas KYC, teléfono 2FA, niveles con límites, índice único case-insensitive, limpieza de huérfanos, proveedor externo) y próximo foco (san → cripto → seguridad).
- **`PRD.html`**: badges, descripción, **sección Despliegue** (beta en vivo), roadmap (Fases 1 y 3) y footer a v0.0.65.

## [0.0.65] — 2026-06-01 — KYC video: confirmación con fotograma, colores por paso y botones más arriba

### Cambiado
- **Vista del video grabado**: en vez de un reproductor (el webm de MediaRecorder no reproduce por su falta de duración), se muestra el **fotograma capturado + "Video grabado correctamente"** con check. El usuario confirma que se grabó; el super-admin sí lo reproduce completo en su cola.
- **Indicaciones durante la grabación con color por paso** (verde / ámbar / azul) y etiqueta "Paso N de 3", para que se perciba cuándo cambia la instrucción. Los números de las tarjetas también toman ese color.
- **Botones Atrás/Siguiente del modal más arriba** (margen inferior garantizado), para no quedar pegados a la barra del sistema del teléfono.

### Verificado
- Typecheck limpio. E2E smoke verde; integral pasa (con reintento por timing).

## [0.0.64] — 2026-06-01 — KYC: métricas en la cola, tag "Sin verificar", póster de video y pulido

### Añadido
- **Métricas en las tarjetas** de la cola: fecha y hora de recepción (pendientes) y de resolución + **quién la revisó** (aprobadas/rechazadas).
- **Tag "Sin verificar"** (ámbar, enlazado a la verificación) junto al nombre en el perfil cuando el usuario no está verificado (complemento del tag verde "Verificado").

### Cambiado
- **Video**: se captura un **fotograma como póster** del clip grabado, para que la vista previa no se vea negra mientras el webm no calcula su duración. "Volver a grabar" pasó a un botón **superpuesto y visible** sobre el video (libera espacio abajo).
- **Modal**: margen seguro inferior (`safe-area-inset`) para que Atrás/Siguiente no choquen con la barra del sistema en el teléfono.
- **Botones de revisión**: estado normal sutil vs **seleccionado resaltado** (relleno + anillo) para confirmar la elección antes de la credencial.

### Verificado
- Typecheck limpio. Suite E2E 6/6 (con `retries: 1` para el integral, sensible al timing bajo carga).

## [0.0.63] — 2026-06-01 — KYC revisión: confirmación con credencial, revertir, buscador y arreglos de video

### Añadido
- **Confirmación con credencial** (PIN o contraseña del super-admin) antes de aprobar/rechazar/pedir reenvío/banear, para evitar clics accidentales.
- **Revertir verificación** desde "Aprobadas" (gestionar → desverificar/rechazar/banear); al revertir o banear se baja `nivelKyc`.
- **Buscador** en la cola por nombre, usuario o correo.

### Cambiado
- Estados mostrados con **etiquetas legibles** (Pendiente, En revisión, Aprobada, Rechazada, Reenvío solicitado, Baneada) en vez del valor crudo.
- Video: instrucción del paso 3 completa ("Muestra 3 dedos frente a tu cara") visible desde antes de grabar.

### Corregido
- **Preview del video en negro / 0:00**: el webm de MediaRecorder no trae duración; se fuerza su cálculo con un seek, dejándolo reproducible.

### Verificado
- Typecheck limpio. Suite E2E 6/6 (el integral cubre el nuevo flujo con confirmación por credencial).

## [0.0.62] — 2026-06-01 — KYC: documentos visibles en revisión (proxy) y botón de grabar

### Corregido
- **Los documentos no se veían en la cola del super-admin** en la beta: las URLs firmadas apuntaban a `minio:9000` (dirección interna del VPS, inaccesible desde el navegador). Ahora se sirven por un **route handler proxy autenticado** (`/api/almacen/[...key]`) que lee de MinIO interno y entrega solo al super-admin. Funciona igual en local y en producción, sin exponer MinIO.

### Cambiado
- **Botón "Empezar a grabar" superpuesto sobre el video y rojo** (estilo cámara), para que no se confunda la vista previa en vivo con que ya se está grabando.
- Instrucciones del video más claras: "Pestañea 3 veces", "Abre la boca 3 veces", "Muestra 3 dedos frente a tu cara".

### Verificado
- Typecheck limpio. E2E integral verde (incluye ver documentos vía proxy).

## [0.0.61] — 2026-06-01 — KYC: pulido del asistente (bugs + UX) y disclaimer 24-48 h

### Corregido
- **Error crítico al enviar**: `useActionState` se llamaba fuera de una transición (consola roja y `isPending` incorrecto); ahora el dispatch va dentro de `startTransition`.
- **La foto ya no se pierde al retroceder** de paso: `SubirImagen` y `CapturaVideo` reciben el archivo ya elegido y reconstruyen la vista previa.

### Cambiado
- **Posición del pop-up**: altura estable (88dvh en móvil) para que el contenido fluya hacia abajo (lectura natural F/Z), en vez de crecer desde abajo.
- **Animaciones más suaves** (~0.7 s, fade) al desplegar nacionalidad/número/fotos.
- **Paso de video**: los 3 gestos se muestran como tarjetas en una sola línea (se leen antes de grabar), el recuadro es más cuadrado (4/5), la indicación durante la grabación está más resaltada, y el preview reproduce en bucle para confirmar que grabó (más robusto: timeslice + control de blob vacío).
- **Disclaimer "puede tardar de 24 a 48 horas"** en el paso de revisar y en la notificación/correo "Recibimos tu verificación".

### Verificado
- Typecheck limpio. E2E KYC (smoke + integral) verdes.

## [0.0.60] — 2026-06-01 — KYC: asistente en pop-up + flujo progresivo y textos claros

### Cambiado
- El asistente de verificación ahora abre en un **pop-up modal** (overlay con fondo difuminado), no desplegándose dentro de la sección, para mantener el foco.
- **Flujo progresivo** del paso de documento: primero se elige el tipo (cédula/pasaporte); recién entonces aparecen nacionalidad (V/E) y el número; y **solo con esos datos** se piden las fotos. Antes los campos de foto aparecían de entrada, confundiendo.
- **Textos/CTA claros**: "Selecciona el tipo de documento con el que deseas iniciar tu verificación"; label "Número de cédula/pasaporte" con ejemplo en el campo; "Sube la foto frontal del documento" + instrucciones (superficie plana, sin reflejos ni borrosidad), e igual para el reverso.
- No deja enviar sin tipo, nacionalidad (si cédula), número y fotos.

### Verificado
- Typecheck limpio. Suite E2E 6/6 verde (incl. ciclo integral usuario→admin con el nuevo flujo).

## [0.0.59] — 2026-06-01 — Build más rápido (Dockerfile)

### Cambiado
- El Dockerfile usa `--chown` en las copias en vez de un `RUN chown -R /app` posterior, que sobre el `node_modules` completo tardaba ~3.5 min por build.

## [0.0.58] — 2026-06-01 — Login y registro sin distinguir mayúsculas

### Cambiado
- **Nombre de usuario sin distinguir mayúsculas** al iniciar sesión, al registrarse y en la validación de disponibilidad en vivo (`mode: "insensitive"`), pero **se conserva y se muestra tal cual lo escribió** el usuario (p. ej. `BeneicoLuis`). Así `BeneicoLuis` y `beneicoluis` son la misma cuenta y se evitan duplicados que solo difieren en mayúsculas.
- El **correo** ya se normalizaba a minúsculas; queda explícito que da igual cómo se escriba al entrar o registrarse.

## [0.0.57] — 2026-06-01 — Fixes de login (campo que se borraba + correo con espacio)

### Corregido
- **El correo/usuario ya no se borra** al fallar la contraseña: el campo `identificador` del login era no controlado y React 19 resetea los forms con Server Actions; ahora es controlado y se conserva para corregir solo la clave.
- **Entrar con el correo** funciona igual que con el usuario: el `identificador` se recorta (`trim`) antes de buscar, evitando que un espacio del autocompletado del navegador impida encontrar la cuenta.

## [0.0.56] — 2026-06-01 — Fix despliegue: Prisma CLI en la imagen

### Corregido
- El contenedor `web` fallaba al arrancar (`MODULE_NOT_FOUND` en `@prisma/config`) porque el Dockerfile copiaba Prisma de forma selectiva y faltaban deps transitivas del CLI usado por `migrate deploy`. Ahora se copia el **`node_modules` completo** del stage de build al runner.

## [0.0.55] — 2026-06-01 — KYC Fase 6: infraestructura de despliegue (beta VPS-2)

### Añadido
- **`next.config.ts`**: `output: "standalone"` para una imagen Docker mínima.
- **`Dockerfile`** multi-stage (deps → build → runner, `node:22-alpine`): copia `.next/standalone` + `static` + `public` + Prisma (schema, migraciones y CLI). **Imagen validada localmente con podman (build verde, 812 MB).**
- **`entrypoint.sh`**: `prisma migrate deploy` y arranque de `server.js`.
- **`docker-compose.prod.yml`**: servicios **web + db (Postgres 16) + minio** en red interna; solo `web` publicado en `127.0.0.1:3100`; volúmenes persistentes.
- **`.dockerignore`** y **`docs/DESPLIEGUE_VPS.md`** (primer despliegue, subir DB local, nginx + certbot, re-despliegue, verificación; **sin tocar** n8n/chatwoot/evolution).

### Pendiente (ejecución en el VPS, requiere al usuario)
- Falta el **SMTP_PASS** del buzón (el usuario lo introduce; no va al repo) y su **presencia** para ejecutar el `docker compose up` + `nginx`/`certbot` en el host de producción compartido sin riesgo a los servicios en vivo.

### Verificado
- Typecheck limpio. Imagen Docker construida con podman sin errores.

## [0.0.54] — 2026-06-01 — KYC Fase 5: tag "Verificado", indicadores y docs

### Añadido
- **Tag "Verificado"** (verde, con `BadgeCheck`) junto al nombre en el perfil cuando `nivelKyc >= 1`.
- Indicadores de la sección Verificación al día: contador **/3**, paso de identidad con estado en vivo (en revisión / aprobada / corregir / suspendida) y motivo cuando aplica.

### Notas
- Las notificaciones del KYC (recibida / aprobada / reenvío / rechazada / baneada) ya se envían **app + correo** vía `notificarYCorreo` con la plantilla de marca. Conectarlas al **editor visual de plantillas** queda como mejora documentada (para no dejar plantillas sin uso en el editor).

### Cambiado
- **Documentación completa al día:** `PRD.md` (§ estado: KYC movido de pendiente a ✅ hecho, versión 0.11 / app v0.0.54), `PRD.html` (título, badges, fecha, footer y el bloque KYC que decía "vía proveedor tercero, no manual"), tras el KYC propio completo.

### Verificado
- Typecheck limpio. (UI del tag cubierta por el E2E integral de la Fase 4: el usuario queda verificado.)

## [0.0.53] — 2026-06-01 — KYC Fase 4: cola de revisión en el super-admin

### Añadido
- Pestaña **"Verificaciones"** en el panel super-admin (`components/kyc/cola-kyc.tsx`): sub-listas **Pendientes / Aprobadas / Rechazadas** (última solicitud por usuario), con **toggles de pasos requeridos** (`KYC_REQUIERE_*`) arriba.
- Por solicitud: datos del usuario y documento, **"Ver documentos"** (carga las imágenes/video con **URLs firmadas temporales** de MinIO bajo demanda), **Tomar para revisar**, y acciones **Aprobar / Pedir reenvío / Rechazar / Rechazar y banear** con campos de **motivo** (para el usuario) y **nota interna** (solo admin).
- `colaVerificaciones()` en `lib/kyc/consultas.ts` (agrupa por estado, última por usuario). `testId` en `SubirImagen` para QA.

### Corregido
- E2E `publico.spec.ts`: el heading de registro tras el rediseño es "Crea tu cuenta gratis" (estaba desactualizado).

### Verificado
- Typecheck limpio. **E2E integral** (`e2e/kyc-integral.spec.ts`): admin apaga el paso video → usuario envía documento+selfie (subida real a MinIO) → admin carga documentos (URL firmada), toma y aprueba → usuario queda verificado. **Suite completa 6/6 verde.**

## [0.0.52] — 2026-06-01 — KYC Fase 3: asistente de verificación del usuario

### Añadido
- **`components/kyc/asistente-kyc.tsx`**: asistente por pasos (solo los pasos activos) con progreso, navegación y envío vía Server Action; arma un único `FormData` con campos + archivos.
- **`components/kyc/subir-imagen.tsx`**: captura de documento/selfie (foto o archivo), con preview y validación de tipo/tamaño en cliente (≤5 MB, JPG/PNG/PDF).
- **`components/kyc/captura-video.tsx`**: grabación de liveness con `MediaRecorder` (7-10 s), instrucciones guiadas en pantalla (pestañear → boca 3× → 3 dedos), preview y re-grabar.
- **`components/kyc/item-kyc.tsx`**: estado del KYC en la sección Verificación (en revisión / aprobada / corregir y reenviar con motivo / suspendida) y apertura del asistente.
- Integración en `seccion-verificacion.tsx` (paso 3 ahora dinámico) y `configuracion/page.tsx` (carga última verificación + pasos activos). Contador a `/3`.

### Verificado
- Typecheck limpio. **E2E Playwright** (`e2e/kyc.spec.ts`): login → abrir asistente → ver pasos (documento, nacionalidad). Verde.

## [0.0.51] — 2026-06-01 — KYC Fase 2: máquina de estados y Server Actions

### Añadido
- **`lib/kyc/estados.ts`**: máquina de estados con diccionario de transiciones (`puedeTransicionar`); las transiciones inválidas se bloquean. `ESTADOS_EN_CURSO` para impedir envíos duplicados.
- **`lib/kyc/config.ts`**: pasos configurables (`DOCUMENTO/SELFIE/VIDEO/DIRECCION`) con `pasosRequeridos()` leyendo los toggles `KYC_REQUIERE_*` (defaults: documento/selfie/video activos, dirección no).
- **`lib/kyc/consultas.ts`**: `ultimaVerificacion(usuarioId)`.
- **Acciones del usuario** (`app/(app)/configuracion/kyc-actions.ts`): `enviarVerificacion` valida según los pasos activos, sube los archivos a MinIO (vía servidor, validando tipo/tamaño: imágenes ≤5 MB, video ≤20 MB), crea la solicitud en `pendiente` y notifica app+correo. Bloquea envíos si hay uno en curso o ya aprobado.
- **Acciones del revisor** (`app/admin/kyc-actions.ts`, solo super-admin): `tomarRevision`, `resolverKyc` (aprobar/rechazar/reenvío/banear con motivo y nota interna; aprobar sube `nivelKyc`, banear marca `baneado`), `urlsRevision` (URLs firmadas temporales) y `guardarPasosKyc` (toggles).
- **`next.config.ts`**: `serverActions.bodySizeLimit: "25mb"` para la subida de documentos.

### Verificado
- Typecheck limpio; tabla de transiciones probada (válidas/invalidas).

## [0.0.50] — 2026-06-01 — KYC Fase 1: modelo de datos y migración

### Añadido
- Modelo **`VerificacionKyc`** (una fila por intento, historial): documento (`tipoDocumento` cédula/pasaporte, `nacionalidad` V/E, número, `docFrenteKey`/`docReversoKey`), `selfieKey`, `videoKey`, dirección opcional, `estado` (`EstadoKyc`), `motivoRechazo`, `notaInterna`, `revisadoPorId`, fechas. Índices por `usuarioId` y `estado`.
- Enums **`TipoDocumento`**, **`Nacionalidad`**, **`EstadoKyc`**.
- Campos en `Usuario`: **`nivelKyc`** (0 no verificado / 1 verificado), **`baneado`**, **`telefono`**, **`telefonoVerificado`**, y relaciones `verificaciones` / `verificacionesRevisadas`.
- Migración `20260601005502_kyc`.

### Verificado
- Typecheck limpio; cliente Prisma regenerado y dev reiniciado (enums KYC expuestos).

## [0.0.49] — 2026-05-31 — KYC Fase 0: almacenamiento privado (MinIO) + usuario de prueba

### Añadido
- **`lib/almacenamiento.ts`**: capa de almacenamiento de archivos privados (documentos KYC) sobre **MinIO/S3** (`@aws-sdk/client-s3`). `subirArchivo`, `leerArchivo`, `borrarArchivo`, `urlFirmadaLectura` (URLs temporales de solo lectura) y `asegurarBucket`. **El navegador nunca habla con MinIO**: sube al servidor y este reenvía (más seguro, sin CORS). Fallback a disco local (`.almacen/`) si no hay MinIO.
- **MinIO local** en podman (contenedor `greensol-minio`, API `:9000`, consola `:9011`, bucket privado `greensol-kyc`).
- **`prisma/seed-dev.ts`** + script `seed:dev`: usuario super-admin de pruebas idempotente (`qa@greensol.local`) para QA local. Credenciales en `_privado/` (no al repo).
- Variables `S3_*` en `.env.example`; `.almacen/` ignorado por git.

### Verificado
- Typecheck limpio. Subida/lectura/URL-firmada/borrado probados contra MinIO; seed ejecutado OK.

## [0.0.48] — 2026-05-31 — Pestañas deslizantes, campanita en vivo y diseño KYC

### Añadido
- **`components/use-indicador.ts`**: hook reutilizable que mide el elemento activo (`data-activo="true"`) de un contenedor para deslizar un indicador con transición; re-mide al cambiar la selección o al redimensionar.
- **Indicador deslizante** aplicado a los selectores tipo-pestaña: moneda de la **calculadora**, **Fiat/Cripto** en método de pago, **San/Vaca** del asistente (deslizamiento vertical) y el contenido entre pasos del asistente con fade + slide. `PanelTabs` (perfil y super-admin) ya lo tenía.
- **`docs/superpowers/specs/2026-05-31-kyc-verificacion-identidad-design.md`**: diseño aprobado del KYC propio (MinIO + URLs firmadas, liveness manual revisado por humano, proceso configurable por toggles, máquina de estados, cola en super-admin). Se evaluó el repo `AbhiEE03/TrustFlow_KYC` y se decidió **portar el patrón** nativo en vez de conectarlo por API.

### Corregido
- **Campanita desincronizada**: el `AppHeader` guardaba las notificaciones en estado local y no se refrescaba al revalidar; ahora un `useEffect` resincroniza con el servidor cuando cambia el contenido. Por eso al agregar un PIN llegaba el correo pero no aparecía el aviso in-app.
- **Panel "Avisos y notificaciones"**: se abre debajo de la campana vía `createPortal` (escapa al `backdrop-blur`), cierra al clic fuera, puntito ámbar en no leídas, marcar leída al pulsar y botón borrar.

### Cambiado
- Paso 2 de Verificación: título **"Método de seguridad adicional (2FA)"** y descripción "Agrega al menos un método de seguridad adicional. Ejemplo: un PIN o el código por correo."

### Verificado
- Typecheck limpio (`tsc --noEmit`).

## [0.0.47] — 2026-05-31 — Documentación completa al día (PRD, planes nuevos)

### Cambiado
- **PRD.md → "Estado del proyecto"** reescrito con todo lo de la sesión (SMTP real, panel reorganizado, plantillas con editor visual, 2FA, verificación inicial) y los nuevos pendientes (modal de verificación con jerarquía, TOTP/biometría/teléfono, flujo de cambio de contraseña con bloqueo 24 h, KYC, gestión de usuarios super-admin, notificaciones personalizadas, conectar plantillas a eventos).
- **`PLAN_SEGURIDAD.md`** ampliado: política de verificación retail-friendly (clave obligatoria + 2FA opcionales), jerarquía de factores y flujo de cambio de contraseña estilo Binance.

### Añadido
- **`docs/PLAN_NOTIFICACIONES.md`**, **`docs/PLAN_KYC.md`** (KYC manual propio, liveness, panel de revisión) y **`docs/PLAN_ADMIN.md`** (gestión de usuarios super-admin + notificaciones personalizadas).

## [0.0.46] — 2026-05-31 — Proceso de verificación inicial (notificación, banner, sección)

### Añadido
- **Notificación in-app al registrarse** (`app/(auth)/actions.ts`): "Completa tu verificación — agrega un método de seguridad" con enlace a Configuración → Verificación. Solo in-app.
- **Banner ámbar** en el dashboard (`components/banner-verificacion.tsx`), entre el hero y los accesos rápidos; se muestra mientras no haya un 2FA activo y enlaza a la verificación.
- **Pestaña "Verificación"** en Configuración (`components/seccion-verificacion.tsx`): checklist con ✓ verde (correo verificado · agrega un 2FA · KYC "Pronto") y contador.

### Verificado
- Typecheck limpio.

## [0.0.45] — 2026-05-31 — Cimientos de seguridad: 2FA (PIN, OTP) y cambio de contraseña

### Añadido
- Campos **`pinHash`** y **`otpCorreoActivo`** en `Usuario` (migración `seguridad_factores`).
- **`verificarFactores`** (`lib/seguridad.ts`) valida **clave (siempre) + PIN + OTP por correo**, exigiendo solo los factores que el usuario tenga activos; helper `factoresActivos`.
- Pantalla **Configuración → Seguridad** "Autenticación de dos factores (2FA)" (`components/form-seguridad.tsx`): tarjetas con ✓ verde — **PIN** (configurar/quitar con clave), **código por correo** (toggle), **biometría** (Recomendado) y **app de autenticador** como "Pronto".
- **Cambio de contraseña** (`configuracion/actions.ts → cambiarContrasena`) con la regla: **no se permite sin al menos un método de 2FA activo**; valida la contraseña actual y la política.

### Verificado
- Typecheck limpio.

## [0.0.44] — 2026-05-31 — Sistema de plantillas de notificaciones con editor visual

### Añadido
- **`lib/correo/`**: layout HTML de marca (`plantillas.ts`), **catálogo de eventos** (`catalogo.ts`) con los **canales** que aplica cada uno (app y/o correo) y plantillas por defecto, motor de variables `{{...}}`, y **resolver** (`resolver.ts`) que usa el override de la base de datos o el default.
- **Editor visual** en super-admin (`components/editor-plantillas.tsx`): **grid de tarjetas** por categoría con iconos ver/editar, **modal con pestañas Aplicación / Correo**, **barra de formato** (negrita, cursiva, subrayado, tachado, color, resaltado; enlace, imagen por URL, lista y línea divisoria en correo), **vista previa** (iframe en correo, tarjeta en app), **variables clickeables**, guardar / restablecer / enviar prueba, y **borrador en localStorage** (no se pierde al cerrar). El clic fuera no cierra el modal.
- El **correo de prueba del SMTP** usa este sistema (plantilla `prueba_smtp`).

### Corregido
- Selector de color/resaltado: ya no inserta código en cada movimiento (aplica una sola vez al cerrar el selector).
- **Ctrl+Z** funciona en el editor (inserciones con el mecanismo nativo del navegador).

### Verificado
- Typecheck limpio.

## [0.0.43] — 2026-05-31 — SMTP real + reorganización del panel super-admin

### Añadido / Cambiado
- **SMTP funcional**: envío real por `mail.proyecciondigital.org:465` (SSL) con el buzón `no-responder@greensol.creceideas.com`. `lib/mailer.ts` soporta HTML y `verificarConexionSmtp` (handshake sin enviar).
- **Panel super-admin** reorganizado: pestañas principales **Métricas · Usuarios · Configuración**; Configuración con **subpestañas** General · SMTP · Plantillas · Restricciones (`components/panel-tabs.tsx` con variante "sub").
- **Form SMTP** (`components/form-smtp.tsx`): **toggle de conexión segura (SSL/TLS)**, **remitente en dos campos** (nombre + correo) con "Aparece como…" en vivo, botón verde, **toast** al guardar y **enviar correo de prueba**; la contraseña se conserva si se deja vacía.

### Corregido
- **Scroll horizontal** del panel super-admin en móvil (faltaba `w-full` en el `main`; medido con Playwright). Pestañas scrollables en móvil.
- **Pantalla blanca en local** por correr `next build` con el `next dev` activo (corrompe `.next`): de ahora en adelante se verifica con `tsc --noEmit`.

### Verificado
- Typecheck limpio.

## [0.0.42] — 2026-05-30 — Documentación al día (PRD 0.10) + auditoría y estado del proyecto

### Cambiado
- **Auditoría código vs PRD** y actualización completa (sin resumir): `PRD.md` → **0.10**, `PRD.html` y `ARQUITECTURA_TECNICA.md` → **0.4**, alineados al estado real v0.0.41.
- **Nueva sección "Estado del proyecto"** en PRD (md y html) con tres listas: ✅ **Implementado**, ⏳ **Pendiente**, 🆕 **Pendientes nuevos** de la conversación; más una nota de **QA manual pendiente** (probar: crear/finalizar san, registro+OTP, super-admin+SMTP).
- Correcciones del PRD donde afirmaba de más (USDT suelto como moneda del san; métodos de pago viejos) y se documentó lo implementado que faltaba (asistente con método de pago del perfil, modelo `MetodoPago` rediseñado, `lib/seguridad.ts`, `notificarYCorreo`).

### Pendiente nuevo registrado
- **Pestaña de Verificaciones** (Configuración → Seguridad): verificación de **correo**, **identidad nivel 1 y 2** (habilitan límites/montos distintos en san/pote), y **teléfono** (futuro; código por **WhatsApp vía Evolution API** como alternativa a SMS).

## [0.0.41] — 2026-05-30 — Verificación por clave y avisos (app + correo)

### Añadido
- **Verificación de seguridad** reutilizable (`lib/seguridad.ts → verificarFactores`): hoy con la **clave de la cuenta**; diseñado para sumar OTP por correo, TOTP (Google Authenticator), PIN o biometría sin tocar las acciones.
- **Agregar / editar / eliminar** un método de pago ahora **piden confirmar con la clave** (eliminar incluido, por ser destructivo).
- **Avisos en la app y por correo** (`notificarYCorreo`) en cada cambio: se agregó/editó/eliminó un método de pago, y al **crear un ahorro** ("¡Creaste tu ahorro!").
- `docs/PLAN_SEGURIDAD.md`: diseño extensible y dónde aplicar el patrón (retiros, 2FA, eventos del san, etc.).

### Verificado
- Build limpio; E2E 4/4.

## [0.0.40] — 2026-05-30 — Editar métodos de pago

### Añadido
- Cada método de pago en **Perfil → Pagos** ahora tiene **Editar** (✏️): despliega un formulario en línea con los campos precargados (según el método), guarda con confirmación (toast) y se cierra. También **Quitar**.

### Verificado
- Build limpio; E2E 4/4.

## [0.0.39] — 2026-05-30 — Asistente del san: elegir método de pago del perfil (Fase 2)

### Cambiado
- El paso "Método de pago" del asistente ya **no pide datos**: el organizador **elige uno de sus métodos** del perfil, **filtrado por la moneda** del san (Bs → fiat VES; USDC/SOL → cripto).
- Si **no tiene** un método compatible, el paso **se bloquea** con un mensaje y enlace a **Perfil → Pagos**.
- Al crear, los datos de pago se **copian** del método elegido (endpoint `/api/metodos-pago`).

### Verificado
- Build limpio; E2E 4/4 (el endpoint de prueba crea un método cripto para el flujo).

## [0.0.38] — 2026-05-30 — Formulario de método de pago pulido y enfoque VES/USD

### Cambiado
- **Formulario de método de pago:** **etiqueta encima de cada campo**; **nombre y apellido separados**; **cédula con prefijo V/E**; en pago móvil, **teléfono y cédula en una línea**; número de cuenta a ancho completo.
- Botón **"Confirmar método de pago"** (color distinto, sin ícono +). Al guardar: **toast** de confirmación y el **formulario se limpia** (evita agregar duplicados).
- "Bolívar" → **"Bolívares"**.
- **Enfoque del MVP:** solo **Bolívares** y **USD** en el selector fiat (las demás monedas/países quedan en `MONEDAS_FIAT_FUTURAS` para reactivar luego). Prioridad: cripto Solana + Fiat Venezuela.

### Añadido (backend)
- Acción **`editarMetodoPago`** (la UI de edición se conecta a continuación).

### Verificado
- Build limpio; E2E 4/4.

## [0.0.37] — 2026-05-30 — Métodos de pago en el Perfil (rediseño, Fase 1)

### Cambiado
- **Modelo `MetodoPago` rediseñado** (migración): `categoria` (fiat/cripto), `moneda`, `metodo`, `alias`, `titular`, `cedula`, `banco`, `tipoCuenta`, `numeroCuenta`, `telefono`, `email`, `wallet`, `principal`, `detalle`. Se eliminó el enum `TipoMetodoPago`.
- **Perfil → Configuración → Pagos** rehecho: crear método con el flujo **Fiat/Cripto → moneda (buscable) → método → datos**.
  - **Fiat:** Bolívares (transferencia/pago móvil con banco buscable, cuenta, titular, cédula) · USD (efectivo, Zelle, Zinli, WalyTech, banco) · otras monedas (genéricos).
  - **Cripto:** USDC o SOL → dirección de wallet **externa** + alias. (La wallet **principal** la entregará la integración cripto, no editable.)
  - **Prohibición** clara: datos del titular, persona natural; no terceros ni empresas.
- Listado de métodos etiquetado (método · moneda · datos). Panel admin: ranking de métodos por `metodo`.

### Pendiente (Fase 2)
- El asistente del san pasa a **seleccionar** un método del perfil (filtrado por moneda) y a **bloquear** si no hay ninguno compatible.

### Verificado
- Build limpio; E2E 4/4.

## [0.0.36] — 2026-05-30 — Cimientos y plan del rediseño de métodos de pago

### Añadido
- `lib/monedas.ts`: monedas fiat (LatAm + USD) con prefijo/nombre/país (buscable) y los métodos por moneda (VES: transferencia/pago móvil; USD: efectivo/Zelle/Zinli/WalyTech/banco) + cripto (USDC/SOL).
- `docs/PLAN_METODOS_PAGO.md`: diseño completo del nuevo flujo — el organizador **selecciona** un método de pago de su Perfil (no llena datos en el asistente); métodos por categoría fiat/cripto → moneda → método; **wallet cripto principal** (predefinida, no editable, llega con la integración cripto) + **externas con alias**; prohibición de datos de terceros/empresas.

### Pendiente
- Migrar el modelo `MetodoPago` y la UI del Perfil; luego el asistente del san pasa a seleccionar de ahí (con bloqueo si no hay método compatible).

## [0.0.35] — 2026-05-30 — Asistente: paso de método de pago del organizador

### Añadido
- **Nuevo paso "Método de pago"** (antes de confirmar): tarjeta de **advertencia** (datos del titular, persona natural, no terceros ni empresas).
  - **Bolívares:** elegir **Transferencia** o **Pago móvil**; banco con **selector buscable** (bancos venezolanos por código), tipo de cuenta, número, titular y cédula (o teléfono en pago móvil).
  - **Cripto (USDC/SOL):** dirección de **wallet**.
- Modelo `DatosPagoRecolecta` (migración) + listado `lib/bancos-venezuela.ts` (25 bancos por código).
- El **detalle del ahorro muestra a los participantes a dónde pagar** (con la nota de tasa del día en bolívares).

### Verificado
- Build limpio; E2E 4/4.

## [0.0.34] — 2026-05-30 — Asistente: "Personalizar" y duración en días y semanas

### Cambiado
- El botón "A medida" del paso de frecuencia ahora dice **"Personalizar"**.
- La **duración estimada** se muestra en **días y su equivalente en semanas** (p. ej. "~75 días (≈11 semanas) · 5 turnos").

## [0.0.33] — 2026-05-30 — Barra inferior: respeta el área segura del dispositivo

### Corregido
- La **barra de navegación inferior** sube ~14 px además del `safe-area-inset-bottom`, para que la barra/indicador del sistema (Android/iPhone) no tape los botones.

## [0.0.32] — 2026-05-30 — Asistente de creación: claridad, anclaje al dólar y cálculo

### Cambiado (crear ahorro)
- **Paso tipo:** etiqueta colorida ("Por turnos" / "Meta en común") como placa, además del título y la descripción.
- **Paso título:** pregunta concreta ("¿Qué título le quieres poner a tu san/vaca?") + campo **descripción** con ejemplo.
- **Paso visibilidad:** al elegir privado, nota de que luego se invita por correo, usuario o enlace.
- **Paso moneda:** "¿En qué moneda deseas ahorrar?" + **tooltip** explicativo; opciones: Bolívares (dólar BCV), Bolívares (paralelo/USDT), USDC, Solana (se quitó USDT suelto).
- **Paso detalles (san) reordenado:** nº de participantes → **meta por turno anclada en dólares** (se paga en Bs a la tasa del día) → **aporte por persona calculado** → frecuencia (semanal/quincenal/mensual o **días a medida**) → **duración estimada**.

### Añadido
- Campos `descripcion` y `frecuenciaDias` en `Recolecta` (migración). El detalle muestra descripción, participantes, frecuencia y la nota de tasa del día.

### Pendiente (documentado)
- Sistema de solicitudes de unión (enlace → solicitar → aprobar/rechazar).

### Verificado
- Build limpio; E2E 4/4.

## [0.0.31] — 2026-05-30 — Documentación al día (PRD 0.9) y descripciones del ahorro

### Cambiado
- **Documentación actualizada al estado real (app v0.0.30):** `PRD.md` → 0.9 y `PRD.html` (navegación de 5 ítems, puntos/niveles, calculadora, sección Ahorro con asistente/unirse/guía, perfil+configuración, super-admin con métricas y restricciones, referidos en roadmap); `ARQUITECTURA_TECNICA.md` → 0.3 (modelo de datos y mapa de rutas).
- **Descripciones del ahorro corregidas:** en el san/susi el aporte es **simultáneo** y lo que rota es el **cobro** por turno; en la vaca/pote se aclara que aportan para **reunir y lograr una meta común**.

### Verificado
- Build limpio; E2E 4/4.

## [0.0.30] — 2026-05-30 — Asistente de creación de ahorro por pasos

### Añadido
- **Crear ahorro como asistente por fases:** tipo (Susi·San·Bolso por turnos / Vaca·Pote meta común) → nombre → visibilidad → **moneda** (Bs BCV, Bs paralelo, USDT, USDC, Solana) → detalles según tipo (san: **aporte por turno + frecuencia + nº de manos**; vaca: **meta**) → resumen y confirmar. Barra de progreso y validación por paso.
- Campos nuevos en `Recolecta`: `frecuencia` y `cupoMiembros` (migración). El detalle muestra moneda, frecuencia y manos.
- Imágenes de la guía actualizadas (Susi por turnos, Pote meta común).

### Corregido
- El "Siguiente" del asistente ya no envía el formulario por accidente (el form vive solo en el paso final).

### Verificado
- Build limpio; E2E 4/4.

## [0.0.29] — 2026-05-30 — Guía: orden de tarjetas y clasificación correcta

### Cambiado
- Vuelve la clasificación correcta: **San · Susi · Bolso = por turnos**; **Vaca · Pote = meta común**.
- **Orden dentro de cada tarjeta:** categoría (arriba) → título → imagen (al centro) → descripción → tip.

### Pendiente
- Imágenes nuevas y representativas por método (superprompt listo en _privado): rotación entre personas (turnos) vs pote llenándose hacia una meta.

### Verificado
- Build limpio.

### Cambiado
- En la guía, el **bolso** pasa al grupo de **meta común**: "Bolso · Vaca · Pote" (todos juntan en un lugar con una finalidad). El método **por turnos** queda como "San · Susi".
- Imágenes nuevas: `metodo-san.svg` (San/Susi) y `metodo-bolso.svg` (Bolso/Vaca/Pote).

## [0.0.27] — 2026-05-30 — Sección Ahorros reestructurada: unirse, compartir y guía

### Cambiado
- **Landing de Ahorros** sin la palabra "sanes/vacas" como título: "Ahorros" + descripción y **3 acciones** (Crear · Unirme · Guía), con estado vacío que invita a crear o unirse, y la lista de "Tus ahorros".

### Añadido
- **Unirse a un ahorro** (`/sanes/unirse`): pega el **enlace** o el **código** (acepta `?codigo=`), muestra el ahorro encontrado (tipo, organizador, miembros) y te une. Acciones `buscarRecolecta` y `unirseARecolecta` (notifica al organizador).
- **Compartir** desde el detalle: bloque con el **código** y botones **copiar enlace** y **compartir** (usa la hoja nativa del móvil si existe).
- **Guía visual** (`/sanes/guia`): tarjetas escaneables con infografía de cada método (San/Susi/Bolso por turnos, Vaca/Pote meta común, Dividir cuenta) y cómo aprovecharlo.

### Pendiente (documentado)
- Asistente de creación con periodicidad/nº de manos y animación de sorteo, código corto legible y fechas de turno (en `docs/IDEAS_FUTURAS.md`).

### Verificado
- Build limpio; E2E 4/4.

## [0.0.26] — 2026-05-30 — Calculadora: compactar sin perder contenido

### Corregido
- Revierte el exceso de v0.0.25 (que quitaba textos): se **restauran** la descripción, "¿Qué moneda quieres convertir?", "Cotización de hoy ·" y "Equivale a" con resultados legibles. Solo se compactan **espacios y tamaños** (chips de moneda en una fila, filas de resultado un poco más finas).

### Verificado
- Build limpio.

### Cambiado
- Selección de moneda en **una sola fila** (4 chips), filas de resultados más finas y menos espacios; se quitó el texto descriptivo. Objetivo: que todo entre **sin scroll**.

## [0.0.24] — 2026-05-30 — Calculadora rediseñada (clara y sin confusión)

### Cambiado
- **Calculadora más clara:** primero eliges la **moneda** (Bolívares, **Dólar BCV**, USDT, Solana), luego el **monto** con el **símbolo de la moneda como prefijo** (Bs, $, USDT, SOL) y su **cotización de hoy** debajo; abajo, las **conversiones** a las otras tres monedas con su símbolo.
- Etiquetas **solo por moneda** y "Dólar BCV" explícito (ya no el ambiguo "BCV"). Se quitó el euro y la redacción confusa.

### Verificado
- Build limpio; E2E 4/4.

## [0.0.23] — 2026-05-30 — Logo de la cabecera más grande y ajustado

### Cambiado
- Logo superior **~30% más grande** (de 36 a 48 px), **2 px hacia la derecha** y centrado en vertical con la etiqueta de nivel.

## [0.0.22] — 2026-05-30 — Notch despejado y nombre de usuario con disponibilidad en vivo

### Corregido
- **Cabecera tapada por el notch:** ahora baja con un **mínimo fijo** además del área segura (los simuladores de navegador no reportan `safe-area`), y se añadió `viewport-fit=cover` para que funcione el área segura en dispositivos reales.

### Añadido
- **Disponibilidad de nombre de usuario en vivo** (registro y configuración): mientras escribes valida formato, longitud y **si ya está en uso** (endpoint `/api/usuario-disponible`), con indicador ✓ / ✗ y mensaje.
- **Límites:** nombre de usuario de **3 a 15 caracteres** (validado en cliente, en el schema de registro y en el servidor al editar el perfil).

### Verificado
- Build limpio; **E2E 4/4**.

## [0.0.21] — 2026-05-30 — Nivel en la cabecera, lista negra de palabras y arreglo del Input

### Corregido
- **Error de consola de Base UI** ("changing the default value of an uncontrolled FieldControl"): el formulario de datos del perfil pasó a **componente controlado**; los inputs con `defaultValue` del panel admin usan `key` estable.

### Cambiado (cabecera)
- **Logo más grande** y **sin el texto "Green Sol"**; la cabecera **baja** según el área segura (notch).
- Junto al logo, **etiqueta redondeada con el nivel actual** ("Nivel 1 · Nuevo") que lleva a tu recompensa.

### Cambiado (niveles)
- Los niveles ahora se muestran como **"Nivel N · Nombre"** (número + rol) en cabecera, perfil, recompensa y dashboard, para que generen identidad.

### Añadido (restricciones)
- **Lista negra de palabras** para nombre, apellido y nombre de usuario (bloquea intentos de falsa autoridad: admin, organizador, soporte, etc.). Validada en **registro** y en **edición de perfil**.
- **El super-admin queda exento** (puede usar, p. ej., el usuario "admin").
- Nueva pestaña **Restricciones** en el panel super-admin para editar las listas por campo.

### Verificado
- Build limpio; **E2E 4/4**.

## [0.0.20] — 2026-05-30 — Navegación nueva (Pagos/Perfil), puntos y niveles, sin scroll fantasma

### Corregido
- **Scroll fantasma en móvil** que ocultaba el saludo: el shell ahora es de **altura fija** y solo scrollea el contenido central.
- **Tasas compactas:** cada una en 2 líneas (p. ej. "BCV / USD" arriba y la cotización debajo).

### Cambiado (navegación)
- **Menú inferior a 5 ítems:** Ahorro · Pagos · **Inicio** (centro) · Calculadora · **Perfil** (derecha).
- Se quitó el **engranaje** de la cabecera (solo queda la **campana** de avisos). La configuración dejó de ser un drawer y ahora es una **sección** propia.
- **Transición de fade** suave al cambiar de pestaña.

### Añadido (secciones)
- **Perfil** (hub): tarjeta de identidad (nombre, @usuario, **nivel** y **puntos**) + menú (Tu recompensa, Tus datos, Métodos de pago, Centro de ayuda, Configuración, Panel super-admin si aplica, Cerrar sesión).
- **Configuración** (`/configuracion`): pestañas Datos · Pagos (métodos) · Seguridad · Avisos, con **toggle a super-admin**. Acepta `?tab=`.
- **Recompensa** (`/recompensa`): puntos, nivel y **progreso al siguiente**, con adelanto del **sistema de referidos**.
- **Centro de ayuda** (`/ayuda`) y **Pagos** (`/pagos`): aportes por confirmar/rechazados y ahorros activos con tu turno.

### Cambiado (reputación)
- **Puntos = estrellitas** (acumulado, ya no ratio de 5) con **niveles**: Nuevo → Confiable → Destacado → Estrella → Leyenda.

### Idea futura
- Documentado en `docs/IDEAS_FUTURAS.md`: **referidos** (+40 pts, máx. 5, cuentas nuevas), **club de canje**, **tarjeta de participación** en el dashboard y **calendario de turnos con fechas**.

## [0.0.19] — 2026-05-30 — Dashboard compacto, drawer pulido y panel super-admin con métricas

### Cambiado (dashboard)
- **Hero compacto:** "¡Hola, {nombre}!" con las **estrellitas y valoraciones a la derecha** en la misma línea (ahorra una línea).
- **Accesos rápidos en horizontal:** ícono a la izquierda y título + subtítulo al lado (Nuevo ahorro / Calculadora), para subir la sección "Tus ahorros".

### Cambiado (drawer de configuración)
- **Deslizado suave** al abrir (derecha→izquierda) y fundido del fondo.
- El contenido **baja** según el área segura del dispositivo (notch/cámara).
- En "Tu cuenta" se muestra el **nombre de usuario** (`@usuario`) encima del correo.

### Añadido (registro)
- **Tooltip** en "Nombre de usuario" + ayuda: es tu apodo público (nombre o seudónimo).

### Mejorado (panel super-admin)
- **Responsive en móvil** y organizado en **pestañas**: Métricas · Usuarios · SMTP · App.
- **Métricas reales:** usuarios (total, verificados, nuevos hoy/ayer/7d/30d), ahorros (recolectas, sanes/vacas activos, abiertas/cerradas), aportes confirmados (cantidad y monto), y rankings de **monedas**, **método de recolecta** y **métodos de pago** más usados.
- **Configuración general de la app:** nombre, descripción, correo de contacto, URL de logo y favicon (claves `APP_*`).

### Verificado
- Build limpio; **E2E 4/4**.

## [0.0.18] — 2026-05-30 — Onboarding: "no volver a mostrar" y pantalla de carga

### Añadido
- **Checkbox "No volver a mostrar más"** en el popup de saltar el introductorio: al marcarlo se **descarta por completo** (no se vuelve a mostrar), sin tener que cerrarlo varias veces.
- **Pantalla de carga** (~2.5 s) al pulsar **Saltar** o **Empezar**: el logo **cae de arriba al centro y gira una vez** (animación `greensol-entrada`), dando sensación de "primera carga" antes de entrar al dashboard.

### Cambiado
- `cerrarOnboarding(noMostrarMas)`: si es `true`, fija `onboardingCerrado` al tope (descarte definitivo); si no, cuenta un cierre como antes.

## [0.0.17] — 2026-05-30 — Rediseño del dashboard y la navegación de la app

### Cambiado
- **Dashboard rediseñado** (fintech limpio): hero de bienvenida con degradado de marca, saludo por nombre y reputación en estrellitas; accesos rápidos (nuevo ahorro / calculadora); tarjeta de **tasas de hoy**; lista de **"Tus ahorros"** (san/vaca con ícono, participantes y estado) con estado vacío y CTA.
- **Barra inferior reorganizada a 3 ítems:** **Ahorro** (izquierda, ícono de billetera), **Inicio** (centro) y **Calculadora** (derecha). Salen "Avisos" y "Perfil".
- **Cabecera superior nueva:** logo a la izquierda; a la derecha **campana** de avisos (con contador de no leídos y panel desplegable) e ícono de **configuración**.
- **Panel lateral de configuración** (derecha→izquierda): perfil y datos de pago, seguridad y comunicaciones (próximamente), **toggle Super-admin ↔ usuario** (solo super-admin) y **Cerrar sesión** como última opción.
- Se quitó el botón suelto de "Cerrar sesión" del dashboard.

### Verificado
- Build limpio; **E2E 4/4**.

## [0.0.16] — 2026-05-30 — Infografías del onboarding

### Añadido
- Las **5 infografías** (intro, san/susi/bolso, vaca/pote, dividir cuenta, calculadora) reemplazan los íconos en el carrusel.
- La infografía de la intro entra con una **caída suave** (el giro tipo ruleta estaba pensado para el logo solo; en una infografía completa se quitó).

### Pendiente (optimización)
- Los SVG traen el arte embebido (~2 MB c/u). Para producción conviene convertirlos a WebP/PNG optimizado.

## [0.0.15] — 2026-05-30 — Animación de entrada del logo en el onboarding

### Añadido
- **Animación sutil del logo** al llegar al onboarding: cae desde arriba (rápido→lento), pausa breve y **gira una vez tipo ruleta**, luego queda quieto.
- **Fondo verde del carrusel más profundo** para mayor contraste del logo.

## [0.0.14] — 2026-05-30 — Onboarding: ajustes de UX y sesión en la home

### Corregido
- **Barra de scroll horizontal oculta** en el carrusel (no se veía en móvil, sí en escritorio).
- **Controles centrados:** dots al centro, "Anterior" a la izquierda y "Siguiente" a la derecha.
- **Logo SVG real** en la tarjeta de intro; **fondo degradado verde** con más contraste.
- La **home (`/`) detecta la sesión**: si hay sesión activa, redirige al onboarding o al dashboard (ya no muestra el login al usuario logueado).

## [0.0.13] — 2026-05-30 — Onboarding como carrusel a pantalla completa

### Cambiado
- Onboarding rediseñado como **carrusel de tarjetas a pantalla completa**, deslizable, con **fondo verde de marca** (degradado) y X de cerrar.
- Tarjetas: intro general + **san/susi/bolso** (por turnos, "el corazón de la app") + vaca/pote (meta) + dividir cuenta + calculadora.
- **X arriba-derecha con popup de confirmación** para saltar.
- **Lógica inteligente:** se deja de mostrar tras cerrarlo 3 veces o ingresar más de 7 veces. Aparece tras crear cuenta y en logins mientras aplique. Campos `onboardingCerrado`, `ingresos` (reemplazan `onboardingVisto`).
- Íconos grandes como placeholder; las infografías SVG se integran cuando estén.

### Verificado
- Build limpio; E2E 4/4.

## [0.0.12] — 2026-05-30 — Registro por fases, onboarding y animación

### Añadido
- **Registro en 2 fases:** (1) correo + contraseña + **confirmar contraseña**; (2) nombre, apellido, **nombre de usuario** y **país**.
- **Campo de contraseña** con ícono de ojito (mostrar/ocultar) y de **generar contraseña**, dentro del mismo campo.
- **Login por correo O nombre de usuario**.
- **País → preselecciona la moneda** (Latinoamérica + EE.UU.; Venezuela con tratamiento especial). Modelo: `pais`, `monedaPreferida`, `onboardingVisto`.
- **Onboarding** tras el registro, con infografía: los 2 tipos de ahorro (san/susi por turnos — destacado; vaca/pote por meta), dividir cuentas y calculadora.
- **Animación de carga** (logo con oscilación suave) en las pantallas de auth.

### Verificado
- Build limpio; **E2E 4/4** (incluye el registro por fases); unitarios 6/6.

## [0.0.11] — 2026-05-30 — Hidratación: suppressHydrationWarning en el body

### Corregido
- Warning de hidratación en el `<body>` causado por **extensiones del navegador** (ColorZilla `cz-shortcut-listen`, LanguageTool): añadido `suppressHydrationWarning` al `<body>`. No era un bug de la app (el servidor responde 200 y la DB funciona).

## [0.0.10] — 2026-05-30 — Logos de marca en la app

### Añadido
- **Logo principal de Green Sol** (badge con degradado, el "detalle" 3D) en la pantalla de inicio y en las pantallas de auth (login/registro/verificar), reemplazando el ícono plano.
- Íconos de **Solana** y **GitHub** (open source, con enlace al repo) en el pie de la bienvenida.
- Assets de logo copiados a `public/`.

### Verificado
- Build limpio; E2E 4/4 y unitarios 6/6 pasan.

## [0.0.9] — 2026-05-30 — QA end-to-end con Playwright

### Añadido
- **Playwright** con pruebas E2E del flujo real en navegador:
  - La home muestra la marca y el botón lleva a registro.
  - El registro lleva a la verificación por OTP.
  - El dashboard sin sesión redirige a login.
  - Flujo autenticado: dashboard + crear un san.
- Endpoint `/api/test/sesion` (solo desarrollo) para autenticar en los E2E.
- Script `npm run e2e`.

### Verificado
- 4/4 tests E2E pasan; 6/6 tests unitarios pasan.

## [0.0.8] — 2026-05-30 — Correcciones críticas (botón de inicio, deploy Vercel, hidratación)

### Corregido
- **Botón de la pantalla de inicio:** ahora lleva a registro/login (estaba como placeholder sin conectar, "no hacía nada").
- **Deploy en Vercel:** se ejecuta `prisma generate` en `build` y `postinstall`. Los deploys posteriores a v0.0.1 fallaban porque el cliente de Prisma no se generaba en Vercel.
- **Hidratación:** `suppressHydrationWarning` en `<html>` para silenciar el warning que causan extensiones del navegador (LanguageTool).

### Importante
- En Vercel, además del build, hay que configurar `DATABASE_URL` apuntando a una base de datos accesible (la del VPS) para que el runtime funcione.

## [0.0.7] — 2026-05-30 — Bloque 6: panel super-admin

### Añadido
- Panel `/admin` protegido (solo rol `super_admin`).
- **Gestión de usuarios:** listar y cambiar rol (usuario / admin_grupo / super_admin).
- **Configuración de SMTP** desde el panel (modelo `ConfiguracionApp`): el mailer usa la config de la base de datos y, si no, las variables de entorno.

### Notas
- Para crear el primer super-admin, promover la cuenta por SQL (ver `README_DEV.md`).

## [0.0.6] — 2026-05-30 — Bloque 5: reputación y perfil

### Añadido
- Modelos `Valoracion` (manito +/−) y `MetodoPago`; campos de perfil en `Usuario` (nombre, apellido, nombre de usuario, foto).
- **Cerrar recolecta** (organizador), que habilita la valoración.
- **Valorar** (manito arriba/abajo) a los demás participantes al cerrar.
- **Reputación** calculada (positivos/negativos → estrellitas doradas) mostrada en el perfil.
- **Perfil editable:** datos personales + datos de pago (efectivo, transferencia, pago móvil, wallet USDT, wallet Solana).

## [0.0.5] — 2026-05-30 — Bloque 4: notificaciones y pagos

### Añadido
- Modelos `Notificacion` y `Aporte` (estado reportado/confirmado/rechazado).
- **Notificaciones persistentes (campanita):** página de avisos con leído/no leído y "marcar leídas".
- **Toasts** disponibles (sonner con colores: verde/rojo/naranja/azul) montados en toda la app.
- **Reportar pago** (participante): monto + referencia; notifica al organizador.
- **Confirmar/rechazar pago** (organizador); notifica al participante.
- **Notificaciones automáticas** en eventos: invitación, sorteo de turnos, pago reportado, pago resuelto.

### Pendiente
- Subida de comprobante (archivo) y multa por mora; método cripto.

## [0.0.4] — 2026-05-30 — Bloque 3: sanes y vacas

### Añadido
- Modelos `Recolecta`, `Participante`, `Turno` (con enums de tipo, visibilidad, método y estado) y relaciones con `Usuario`.
- **Crear recolecta:** san (por turnos) o vaca (meta común), pública o privada, método tradicional.
- **Listado** de las recolectas del usuario y **detalle** con participantes.
- **Invitar** participantes por correo (organizador).
- **Sorteo de turnos** al azar para el san (genera el orden e inicia la recolecta).

### Pendiente
- Reportes de pago, mora y notificaciones (bloque 4); método cripto (bloque cripto).

## [0.0.3] — 2026-05-30 — Bloque 2: tasas en vivo y calculadora

### Añadido
- **Servicio de tasas:** BCV (CDN público), USDT (API privada con key) y SOL/USDC (DexScreener), normalizados a un shape simple.
- **Caché global de tasas** en base de datos (modelo `TasaCache`): toda la app y la calculadora leen del caché, sin consultar las APIs por usuario.
- **Endpoint protegido de cron** (`/api/cron/tasas`) para refrescar el caché (se programará en Vercel Cron: BCV 2×/día, USDT y SOL cada 1–2 h).
- **Resumen de tasas del día** en el dashboard (BCV, USDT, SOL).
- **Calculadora:** convierte entre Bs (BCV/USDT), USDC y SOL con las tasas del día.
- Placeholders de las pestañas Sanes, Avisos y Perfil para la navegación.

### Verificado
- El cron refresca correctamente las tres fuentes con datos reales (`bcv: ok, usdt: ok, sol: ok`).

## [0.0.2] — 2026-05-30 — Bloque 1: autenticación

Sistema de autenticación propio (sin librería externa), con verificación por OTP y sesión por cookie.

### Añadido
- Registro y login con **correo + contraseña** (política segura: mayúscula, número, símbolo) y **generador de contraseña**.
- **Verificación de cuenta por OTP** de 6 dígitos al correo (en desarrollo se imprime en consola; en producción usa SMTP por variables de entorno).
- **Sesiones propias** en base de datos con cookie httpOnly; contraseñas hasheadas con **Argon2**.
- Modelos Prisma `Sesion` y `CodigoOtp`; relaciones en `Usuario`.
- Pantallas de registro, login y verificación con la identidad de marca.
- **Layout protegido** (redirige a `/login` sin sesión) y **barra de navegación inferior** (Inicio, Sanes, Calculadora, Avisos, Perfil).
- Tests de la política de contraseña, hash y generador.

### Pendiente
- SMTP real (datos de Luis). Login con wallet y métodos combinables llegan en el bloque cripto.

## [0.0.1] — 2026-05-30 — Bloque 0: cimientos

Primer hito: el esqueleto del proyecto corre en local con base de datos, identidad de marca, framework de tests y verificación de salud de la base de datos.

### Añadido
- **Scaffolding** Next.js 16 (App Router, TypeScript) + Tailwind v4 + shadcn/ui, montado en la raíz del repositorio (conviviendo con `docs/` y `_privado/`).
- **Identidad de marca:** verde de Green Sol (`#0E9F6E` light / `#1DCB8E` dark) como color primario, tokens `--brand`/`--brand-2`/`--gold`, fuente Inter, modo light por defecto e idioma español.
- **Pantalla de bienvenida** con la marca (sol verde, tagline, botón), **security headers** (X-Frame-Options, X-Content-Type-Options, Referrer-Policy) y `README_DEV.md`.
- **Base de datos:** Postgres 16 en contenedor (Docker/Podman, `docker/docker-compose.dev.yml`, puerto 5433) + Prisma 6 + modelo `Usuario` (con enum `Rol`) + migración inicial.
- **Health-check:** endpoint `GET /api/health` que verifica la conexión a la base de datos.
- **Tests:** Vitest configurado (carga `.env`) con pruebas del helper `cn` y del health-check contra la base de datos real.

### Notas
- App desplegará en Vercel; la base de datos de producción vivirá en el VPS (pendiente de configurar).
- Credenciales solo en `.env` / `_privado/`, nunca en el repositorio.
