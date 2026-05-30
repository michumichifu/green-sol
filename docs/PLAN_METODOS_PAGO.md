# Plan — Rediseño de métodos de pago y su uso en el san

Estado: **en construcción** (cimientos listos: `lib/monedas.ts`, `lib/bancos-venezuela.ts`).
Decidido con Luis (2026-05-30): seguir con métodos de pago/san en fiat; la **wallet embebida** (integración cripto) es un bloque aparte posterior.

## 1. Métodos de pago en el PERFIL (prerequisito)

El usuario crea/gestiona sus métodos en **Perfil → Configuración → Pagos**. Flujo de creación:

1. **Categoría:** Fiat o Cripto.
2. **Fiat → moneda:** selector **buscable** de monedas (`lib/monedas.ts`: prefijo · nombre · país; buscar por cualquiera). Prioritarias: VES y USD.
   - **VES (Venezuela):** método = **Transferencia** o **Pago móvil**.
     - Transferencia: banco (selector buscable `lib/bancos-venezuela.ts`), tipo de cuenta (corriente/ahorro), número de cuenta, titular, cédula.
     - Pago móvil: banco, teléfono, titular, cédula.
   - **USD:** método = **Efectivo**, **Zelle**, **Zinli**, **WalyTech** o **Banco (USD)**.
     - Zelle/Zinli: email o teléfono + titular. WalyTech: usuario/teléfono + titular. Banco: banco (texto) + número + titular. Efectivo: titular + nota.
   - **Otras monedas:** métodos genéricos (transferencia/cuenta, efectivo).
3. **Cripto:** USDC o SOL (red Solana) → **dirección de wallet** + **alias**.
   - La **wallet principal (main)** que la app entrega al registrarse aparecerá **predefinida y NO editable** (cuando exista la integración cripto). Las que agregue el usuario son **externas**, cada una con su **alias/prefijo** (la main se marca `principal=true`).

**Prohibición (no solo advertencia):** los datos deben ser del **titular, persona natural**. Nada de terceros ni empresas.

### Modelo `MetodoPago` (rediseño — pendiente de migración)
Reemplaza `tipo (enum) + detalle`. Campos:
`categoria` (fiat|cripto), `moneda` (VES|USD|…|USDC|SOL), `metodo` (transferencia|pago_movil|efectivo|zelle|zinli|walytech|banco|usdc|sol), `alias?`, `titular?`, `cedula?`, `banco?`, `tipoCuenta?`, `numeroCuenta?`, `telefono?`, `email?`, `wallet?`, `principal` (bool, para la main), `detalle?`, `creadoEn`.
Quitar `enum TipoMetodoPago`. **Actualizar usos:** `app/(app)/perfil/actions.ts` (agregarMetodoPago), `app/(app)/configuracion/page.tsx` (UI/listado), `app/admin/page.tsx` (groupBy `tipo`→`metodo`, etiquetas con `METODO_LABEL`).

## 2. Paso "Método de pago" en el ASISTENTE del san (Fase 2)

- Reemplaza el formulario actual (`sanes/crear`): el organizador **selecciona uno de sus métodos** ya creados, **filtrados por la moneda** del san (VES/USD/USDC/SOL según lo elegido).
- Si **no tiene** métodos compatibles → **bloquea** el paso: "no tienes un método de pago para esta moneda; ve a Perfil → Pagos y crea uno" (con enlace).
- `DatosPagoRecolecta` pasa a **referenciar** el `MetodoPago` elegido (o copiar sus datos al crear), en vez de capturarlos en el wizard.

## 3. Pendiente / depende de la integración cripto (bloque aparte)
- Wallet **embebida de autocustodia** entregada en el **registro** (mostrar dirección + llave difuminada con ícono ojo, bajo responsabilidad del usuario).
- **Billetera** en el dashboard y **retiros**.
- La wallet **main** como método de pago predefinido sale de aquí.
- Define: proveedor (Privy/Turnkey/keypair propio), RPC DevNet, credenciales (fuera del repo).
