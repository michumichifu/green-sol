# Detalle del san: pestañas, pagos con conversión y vistas por rol — Diseño

**Fecha:** 2026-06-02
**Estado:** Aprobado (dirección); se pule en la implementación viendo cada pantalla.
**Alcance:** Sub-proyecto A del MVP funcional. (El sub-proyecto B — incentivos/modelo de negocio — va aparte, a futuro, en repo privado.)

## Contexto

El detalle del san (`app/(app)/sanes/[id]/page.tsx`, ~310 líneas, un solo scroll) ya muestra participantes, "¿dónde pagar?" e invitar, y el backend de pagos ya existe: modelo `Aporte` (monto, referencia, comprobanteUrl, `estado` reportado/confirmado/rechazado), `Turno` (posicion, cobrado), `DatosPagoRecolecta`, y acciones `reportarPago` / `resolverAporte` / `generarTurnos` / `invitarPorCorreo`. Las tasas viven en `lib/rates/cache.ts` (`obtenerTasas()` → bcv.usd, usdt.promedio, sol.usd). Este sub-proyecto es mayormente **rediseño de UI/UX** sobre esos cimientos, más la **conversión Bs↔$** y un **aviso de unión** que falta.

## Estructura: pestañas dentro del san (ambos roles)

El detalle pasa a tener dos pestañas, visibles tanto para el **organizador** como para el **participante**: **Resumen** y **Pagos**. (Reusar el patrón `PanelTabs` existente.)

### Pestaña Resumen
- **Cabecera:** nombre del san · estado (abierto/activo/cerrado) · chip de rol (organizador / participante).
- **Progreso:** barra "Ronda X de Y" (se conserva) + una **gráfica de torta (dona) simple** de la ronda actual: pagados (confirmados) vs pendientes. SVG propio, sin librería nueva.
- **Participantes (compacto, una línea c/u):** a la izquierda la **foto de perfil** (`usuario.fotoUrl`) y, si no hay, un **iconito** (dorado para el organizador, sin círculo de fondo); luego **Nombre Apellido @usuario** en una sola línea; a la derecha el turno y un check si ya cobró/pagó. Diseño simple y denso (NO tarjetas grandes).
- **¿Dónde pagar?** (datos de `DatosPagoRecolecta`, como hoy).
- **Invitar / compartir** (`CompartirAhorro`, como hoy; está bien).

### Pestaña Pagos
- **Vista organizador** — sub-pestañas (reusar `PanelTabs` variante sub):
  - **Pendientes por revisar:** los `Aporte` en estado `reportado`. Cada uno muestra participante, monto (Bs + equivalente $), referencia, fecha, y botones **Aprobar / Rechazar** (`resolverAporte`). Sin requerir captura.
  - **Aprobados:** historial de `Aporte` confirmados. Al aprobar, la barra y la dona del Resumen reflejan el cambio.
- **Vista participante** —
  - **"Lo que te toca pagar":** para sanes anclados en Bolívares (`bs_bcv`/`bs_usdt`), se muestra el monto en **Bs** = `aportePersona($) × tasa`, con el equivalente en **$** y la **tasa y el ancla** explícitos (ej. "Bs 4.000 ≈ $20 · dólar BCV: Bs 200/$"). Para `usdc`/`sol` se muestra el monto en la cripto y que se paga por la wallet. El `aportePersona` es el monto por turno entre los cupos (ya se calcula en el creador).
  - **Reportar pago:** campo de **monto en Bs** (con la conversión a $ mostrada a la derecha en vivo) + **referencia** (texto). Sin captura obligatoria. Crea un `Aporte` (estado `reportado`) vía `reportarPago`.
  - **Mi historial:** los `Aporte` propios (reportado / aprobado / rechazado) con su estado.

## Conversión Bs↔$

- Las tasas se leen de `obtenerTasas()` (caché que el planificador mantiene fresco).
- `bs_bcv` → tasa = `tasas.bcv.usd` (Bs por $). `bs_usdt` → tasa = `tasas.usdt.promedio`. `usdc`/`sol` → sin conversión a Bs (son cripto).
- El **progreso es por conteo** (cuántos de N participantes pagaron/confirmaron la ronda), no por suma de montos — así la fluctuación diaria del Bs no afecta el avance. El `Aporte.monto` registra el monto reportado (en Bs para sanes en Bolívares); el equivalente en $ es derivable del `aportePersona` del san. No se requiere cambio de esquema.
- Si en algún momento no hay tasa en caché, mostrar el monto en $ y una nota ("tasa no disponible, calcula con la del día").

## Notificaciones del san

- **Al unirse un participante (BUG actual: no llega nada):** el organizador recibe aviso **in-app y por correo** con **Nombre Apellido @usuario** del nuevo miembro. Se dispara en la acción de unirse (`unirsePorCodigo`/`unirse` en `app/(app)/sanes/actions.ts`), vía el sistema de catálogo/plantillas (`notificarEvento`/`resolverNotificacion`) — nuevo evento p. ej. `san_nuevo_participante`.
- **Al reportar un pago:** el organizador recibe aviso (hay pago por revisar). **Al aprobar/rechazar:** el participante recibe aviso. (Verificar qué existe ya y completar lo que falte, reusando el catálogo.)

## Componentes afectados

- `app/(app)/sanes/[id]/page.tsx` — se reestructura en pestañas; se parte en componentes más pequeños (hoy es un solo archivo grande).
- Nuevos componentes (en `components/san/` o similar): `resumen-san.tsx`, `participantes-lista.tsx` (fila compacta), `dona-progreso.tsx` (SVG), `pagos-organizador.tsx` (sub-pestañas pendientes/aprobados), `pagos-participante.tsx` ("lo que te toca pagar" + reportar + historial).
- `lib/san/montos.ts` (nuevo) — cálculo de `aportePersona`, conversión Bs↔$ según moneda/ancla y tasas.
- `app/(app)/sanes/actions.ts` — `unirse...` emite el aviso al organizador; `reportarPago`/`resolverAporte` emiten avisos donde falte.
- `lib/correo/catalogo.ts` — eventos nuevos (`san_nuevo_participante`, y los de pago que falten), editables desde el editor de plantillas.

## Fuera de alcance (ahora)

- Incentivos / interacción / modelo de negocio (sub-proyecto B, repo privado, futuro).
- Captura de comprobante obligatoria (el organizador confirma con la referencia).
- Flujo cripto real de pago por wallet (la capa Solana/DevNet es otra fase); aquí solo se muestra el monto y que va por wallet.
- Cambios de esquema (el modelo actual basta).

## Notas

- Mobile-first; participantes en filas densas, no tarjetas grandes.
- Reusar `PanelTabs`, `CompartirAhorro`, el catálogo de notificaciones y el caché de tasas — no reinventar.
- Se pule visualmente en la implementación, viendo cada pantalla (preferencia del usuario).
