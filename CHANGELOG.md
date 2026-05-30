# Changelog — Green Sol

Versionado **0.0.x** durante el desarrollo, incrementando por cada avance, hasta **v1.0** (primera versión estable / preview en vivo). A partir de v1.0 se publican *releases*.

Formato basado en [Keep a Changelog](https://keepachangelog.com/es/).

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
