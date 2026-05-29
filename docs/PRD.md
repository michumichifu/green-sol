# PRD — Green Sol

> Proyecto del Solana Vibe Bootcamp (Venezuela). App para **juntar dinero en grupo de forma transparente** (san, bolso, pote, vaca) y dividir cuentas. Funciona con método tradicional (reporte de pagos) o con cripto opcional sobre Solana, sin que la app custodie dinero a la fuerza.

- **Versión:** 0.3 (idea ampliada)
- **Fecha:** 2026-05-29
- **Fase:** 0 — Documentación previa al desarrollo
- **Nombre:** Green Sol (sol verde). Descartado: Cochino.

Versión visual: [PRD.html](PRD.html). Técnica: [ARQUITECTURA_TECNICA.md](ARQUITECTURA_TECNICA.md) y [SEGURIDAD_Y_WALLETS.md](SEGURIDAD_Y_WALLETS.md).

---

## 1. Resumen ejecutivo

Green Sol digitaliza y hace **transparente** una práctica que en Venezuela y Latinoamérica todos conocen: juntar dinero en grupo. Cubre tres formas, todas con el mismo motor:

1. **San / bolso** — recolecta **rotativa**: todos aportan periódicamente y por turnos cada quien recibe el bote.
2. **Pote / vaca** — recolecta hacia una **meta común** para gastar o repartir.
3. **Dividir una cuenta** — repartir un **gasto a pagar** entre varios.

Cada recolecta puede manejarse de forma **tradicional** (la app organiza y cada quien reporta sus pagos con comprobante; el dinero se mueve por fuera, en Bs o efectivo) o con **cripto** (USDC/SOL sobre Solana). La gracia: transparencia total (quién puso qué, a quién le toca) sin obligar a nadie a confiar su dinero a la plataforma.

> **Nota sobre el "MVP":** los tres tipos se desarrollan (por fases). El **san/bolso** y el **pote/vaca** son el gancho inicial de promoción porque es lo que más engancha al hablar de finanzas en Venezuela; "dividir cuentas" llega en una fase posterior, pero también se construye.

## 2. Problema que resuelve

- **Los sanes y vacas se manejan a ciegas:** alguien guarda el dinero y el resto confía; no hay transparencia de quién aportó, a quién le toca, ni cuánto falta.
- **Ahorrar en bolívares no protege el valor** (inflación, tasa BCV irreal). La gente quiere dólares pero no sabe usar USDT/USDC ni quiere complejidad.
- **Las apps que dicen "mete tu dinero aquí" generan rechazo.** Green Sol no exige cripto ni custodia tu dinero: organiza y da transparencia.

## 3. Principio rector de UX

¿Reduce la fricción y la desconfianza de alguien que nunca ha usado cripto?

1. La app **vale sin cripto**: funciona como registro transparente de la recolecta.
2. **Cripto opcional**, y solo para respaldar/recibir, nunca custodiar a la fuerza.
3. **Registro rápido** con correo (la wallet se crea por detrás); cédula/KYC solo para funciones de dinero.
4. **Lenguaje humano**, tooltips y guías claras.
5. **Transparencia pública** dentro del grupo (turnos, aportes, mora).

## 4. Los tres tipos de recolecta

### San / bolso (rotativo) — gancho principal

Aporte periódico y reparto por turnos. Ejemplo: 5 personas, cada una recibe $100; dura 5 semanas; cada semana **todos aportan $20** y **a uno le toca cobrar** los $100. Quien cobra primero se compromete a seguir aportando. Al final, cada quien puso $100 y recibió $100 una vez. Ahorro disciplinado, sencillo, muy popular.

### Pote / vaca (meta común)

Todos aportan (montos iguales o distintos, como acuerden) **hasta llegar a una meta**, sin fechas fijas, y luego se gasta o reparte.

### Dividir una cuenta (fase posterior)

Repartir un gasto a pagar entre varios (la cena de $600 entre 12). Cada quien ve cuánto le toca y su equivalente en Bs a la tasa elegida.

## 5. Método por recolecta: tradicional o cripto

Al crear cualquier recolecta se elige el método. **No es un modo global**: cada bolso/vaca/cuenta puede ser de un tipo distinto.

### Tradicional (la app organiza, el dinero va por fuera)

- Referencia en **USDT y/o Bs**, a la tasa que elijan (BCV / USDT / personalizada).
- Métodos: **efectivo** (más para bolsos en dólares físicos), **transferencia bancaria** o **pago móvil**.
- Al crear la recolecta se indican los **datos de la cuenta destino**: tipo (pago móvil / cuenta bancaria), banco (con su **código**), titular, número de cuenta, tipo de cuenta. Así cada quien tiene los datos a la mano.
- Cada participante **reporta su pago**: sube el comprobante (captura), número de referencia, fecha, monto, banco origen y destino. La app lleva el control de quién pagó qué, cuándo y a qué tasa correspondía.

### Cripto (sobre Solana)

- Referencia y movimiento en **USDC** (o SOL).
- El grupo elige entre:
  - **Wallet de la app** (embebida, no-custodial): el usuario maneja su saldo y hace transferencias/retiros desde la app sin cargar una wallet externa (experiencia tipo GMGN).
  - **Autocustodia / dirección externa**: ponen su dirección y ellos transfieren; la app refleja los datos (modo espejo).
- El **bote de grupo** seguro usa **multifirma** (ver [SEGURIDAD_Y_WALLETS.md](SEGURIDAD_Y_WALLETS.md)).

## 6. Moneda, tasas y equivalencia en bolívares

El valor real vive en USDC/SOL (cripto) o en la moneda que el grupo acuerde (tradicional). Cada monto muestra un **tag con el equivalente en Bs** a la tasa elegida:

- **BCV** (oficial; no sigue al mercado).
- **USDT** (mercado/cripto; aproximado, varía por comerciante y monto). Se usa "USDT", no "Binance".
- **Personalizada**.

En **preferencias del usuario**: moneda por defecto (Bs/USDC) y tasa de referencia. Las tasas vienen de una **API externa** (dev venezolano en España), consultada desde el backend y cacheada; son **solo informativas**, nunca mueven fondos.

## 7. Turnos del san y mora

- **Turnos:** el orden de quién cobra cada ronda se define **al azar** (con animación a elegir: dado, ruleta, carrusel) o **manual**. Siempre **público y transparente**: todos ven quién giró, cuándo y a quién le tocó.
- **Mora:** si alguien no aporta su cuota, la app **notifica al grupo, al moroso y al administrador**.
- **Multa por mora (opcional):** configurable al crear la recolecta — por **porcentaje** o **monto fijo**, en USDC, SOL o Bs (a tasa BCV/USDT/personalizada).

## 8. Cuenta, registro, verificación y roles

- **Registro rápido** con correo + contraseña (wallet embebida creada por detrás). Sin cédula al inicio, para no poner barrera (como los exchanges).
- **Datos de perfil:** nacionalidad; si es venezolano, tipo de documento (cédula/pasaporte) y número. Sirven contra estafas.
- **Verificación de identidad (KYC):** **no se exige para registrarse**, pero **sí para acceder a las funciones de dinero** (crear/cobrar recolectas con montos, etc.). Razón: al ser finanzas, alguien debe responsabilizarse; el usuario verificado responde por su uso. Se hará con un **proveedor tercero** (verificación automática de documento/selfie/video), no manual.
- **Roles:** usuario normal; administrador de un grupo; y **super-admin** (ver sección 9).

## 9. Panel Super-Admin

Acceso interno separado (puerta trasera) para los responsables de la plataforma:

- Ver y administrar **usuarios** y los **grupos/recolectas** creados.
- Ver **métodos de pago** y **datos/documentos subidos** (cédula, pasaporte, comprobantes).
- Hacer **comprobaciones manuales** puntuales para detectar y frenar estafadores.
- Mayor control y seguridad de la app y de los usuarios.

Hay dos accesos: el **normal** (todo lo descrito para usuarios) y el **interno super-admin**.

## 10. Qué usa Solana y qué no

| Capa | ¿On-chain? | Ejemplos |
| --- | --- | --- |
| Cuentas, recolectas, turnos, reportes de pago, notas | No (web tradicional) | Login, grupos, progreso, comprobantes |
| Archivos pesados (comprobantes, audio, fotos) | No (object storage) | Capturas, notas de voz |
| Tasas y equivalencia en Bs | No (API externa) | BCV, USDT, personalizada |
| Recolecta con cripto (saldo del bote) | Sí (Solana) | USDC/SOL verificable |
| Mover fondos del bote cripto | Sí (multifirma) | Retiros aprobados |
| Reflejar wallet externa | Sí (lectura RPC) | Modo espejo |

## 11. Requisitos no funcionales

- **Confianza por diseño:** no-custodial por defecto; la app no obliga a entregar dinero.
- **Seguridad:** datos personales y comprobantes cifrados y con acceso restringido. Ver [SEGURIDAD_Y_WALLETS.md](SEGURIDAD_Y_WALLETS.md).
- **Responsive** escritorio→móvil; **accesibilidad**; **i18n** (español por defecto).
- Almacenamiento ligero (capturas + texto): no requiere mucho espacio.

## 12. Roadmap por fases

- **Fase 0 — Documentación (actual).**
- **Fase 1 — MVP gancho (tradicional, sin cripto):** pantalla de bienvenida, registro, preferencias (moneda/tasa), crear **san/bolso** y **pote/vaca**, datos de cuenta destino, reporte de pagos con comprobante, turnos (azar/manual) y avisos de mora. Pruebas en Vercel.
- **Fase 2 — Capa cripto:** wallet embebida, USDC/SOL, bote multifirma o modo espejo, tasas vía API, multas por mora.
- **Fase 3 — Confianza y escala:** dividir cuentas, KYC con proveedor, panel super-admin completo, despliegue en VPS (contenedor).
- **Fase 4 — Móvil:** Android/iOS.

## 13. Identidad de marca

- **Green Sol:** el sol (Solana es una estrella) en **verde** (dinero, organización, calma). Concepto astros/galaxia; ícono de sol que contrasta en claro y oscuro.

## 14. Despliegue (resumen)

- **Pruebas:** Vercel (cuenta y proyecto ya vinculados con GitHub). Seguro y gratis para empezar.
- **Producción:** VPS propio en contenedor cerrado, con datos restringidos, cuando el proyecto madure. Detalle en [ARQUITECTURA_TECNICA.md](ARQUITECTURA_TECNICA.md).

## 15. Fuera de alcance / decisiones abiertas

- Proveedor de wallet embebida y de KYC (a elegir).
- Endpoint/credenciales de la API de tasas (irán en variables de entorno, no en el repo).
- Modelo de negocio.
- Conversión a moneda local: el usuario la hace por fuera; Green Sol no cambia divisas.
