# PRD — Green Sol

> Proyecto del Solana Vibe Bootcamp (Venezuela). Aplicación web (con visión a móvil) para **ahorrar en grupo o individualmente de forma transparente**, que funciona sin cripto y, opcionalmente, con un bote real en dólares digitales sobre Solana.

- **Versión:** 0.2 (idea cerrada)
- **Fecha:** 2026-05-29
- **Fase:** 0 — Documentación previa al desarrollo
- **Nombre:** Green Sol (descartado: Cochino — connotación negativa fuera de Venezuela; otros barajados: Alma, La Vaca)

La versión visual para lectura rápida está en [PRD.html](PRD.html). Detalles técnicos en [ARQUITECTURA_TECNICA.md](ARQUITECTURA_TECNICA.md) y [SEGURIDAD_Y_WALLETS.md](SEGURIDAD_Y_WALLETS.md).

---

## 1. Resumen ejecutivo

Green Sol es una app para **juntar y organizar dinero en grupo de forma transparente**: hacer una recolecta o ahorro común (la "vaca", el "san" o "bolso" de toda la vida) y también **dividir una cuenta o gasto a pagar** entre varias personas. Cada quien ve cuánto se lleva, cuánto falta y quién aportó o cuánto le toca.

La clave del diseño es que funciona en **dos niveles**:

- **Sin cripto (base):** un registro transparente de la vaca. La app lleva las cuentas; no toca el dinero de nadie. Cero desconfianza, funciona en cualquier país.
- **Con cripto (opcional):** quien quiera, respalda el bote con **dólares digitales (USDC) sobre Solana**, verificable y sin que la app custodie los fondos.

La cripto entra solo para **dar respaldo y transparencia real, nunca para custodiar dinero del usuario**. Eso elimina la barrera de desconfianza que hunde a la mayoría de las apps cripto.

## 2. Problema que resuelve

- **Las "vacas" se manejan a ciegas y con desconfianza.** Cuando un grupo junta dinero para algo, alguien guarda el bote y los demás tienen que confiar. No hay transparencia de quién puso qué ni de cuánto falta.
- **Ahorrar en bolívares no protege el valor** (contexto venezolano: inflación, confusión entre tasa BCV y tasa real de mercado). La gente quiere dólares pero **no sabe usar USDT/USDC** ni quiere lidiar con esa complejidad.
- **Las apps que piden "mete tu dinero aquí" generan rechazo inmediato**, sobre todo si exigen una wallet para entrar.

Green Sol ataca las tres: transparencia del bote, ahorro en dólares estables sin complejidad, y una app que **no exige cripto ni custodia tu dinero**.

## 3. Principio rector de UX

Toda decisión se mide contra: **¿reduce la fricción y la desconfianza de alguien que nunca ha usado cripto?**

1. **La app vale por sí misma sin cripto.** Funciona completa como registro de ahorro aunque nunca toques una wallet.
2. **Solana es opcional y solo para recibir/respaldar**, nunca para custodiar dinero. Recibir no da miedo; entregar sí.
3. **Registro con correo y contraseña.** La wallet, si se usa, se crea por detrás (embebida, no-custodial).
4. **Lenguaje humano, no jerga.** Todo explicado con tooltips y guías claras.
5. **Single-user primero.** Útil para una persona; el grupo es la evolución natural.

## 4. La idea en detalle

### Modo individual

El usuario crea una **meta** (nombre, monto objetivo, foto opcional) y le da seguimiento visual: una barra de progreso hacia el objetivo. Puede adjuntar una **nota** a cada meta — texto simple y/o una **nota de voz** — para registrar el porqué, el plan, recordatorios, etc.

### Modo grupo (la vaca / el san)

La misma meta, pero compartida. Varios participan, cada quien registra/aporta, y todos ven el progreso del bote y **quién aportó cuánto**. Es el corazón del producto: aquí Green Sol resuelve un problema real que una wallet o una cuenta de banco no resuelven (coordinación, transparencia y confianza del bote común).

### Modo dividir cuentas (cuentas por pagar)

El mismo motor sirve para **dividir una cuenta o un gasto** entre varias personas (una salida, un servicio compartido, un alquiler). En vez de juntar hacia una meta, se reparte un monto y cada quien ve **cuánto le toca** y cuánto ha pagado. Recolectar y dividir son la misma mecánica vista al derecho y al revés; por eso van **unificadas** en una sola app. (En Venezuela a la recolecta también se le dice *san*, *bolso* o *recolecta*.)

### Moneda de referencia y tasas (contexto Venezuela)

Las recolectas, ahorros y pagos se llevan en **USDC** (referente al dólar) — o en **SOL** para usuarios muy cripto. Pero como en Venezuela la gente piensa en bolívares, cada monto muestra además un **tag con el equivalente en Bs**, a la tasa que el usuario elija ver:

- **BCV** — tasa oficial; no sigue al mercado real, casi no fluctúa.
- **Promedio USDT P2P** — la "tasa Binance" que la gente usa de referencia. No es fija: varía por comerciante, condiciones y monto, así que se toma como **promedio aproximado**.
- **Personalizada** — el usuario fija su propia tasa.

El valor real **siempre vive en USDC/SOL**; las tasas son solo para *mostrar el equivalente* en Bs. Para obtenerlas se usará una **API externa de consulta** (de un desarrollador venezolano radicado en España) que entrega BCV, promedio USDT y otra referencia. Detalle de integración en [ARQUITECTURA_TECNICA.md](ARQUITECTURA_TECNICA.md).

### Custodia: dos modalidades (cuando se activa la cripto)

1. **Bote gestionado con multifirma.** El bote es una wallet que **exige varias aprobaciones para mover fondos** (ej. 2 de 3 administradores). No existe una llave secreta única que entregar o robar; **ni la app ni un solo administrador pueden vaciarlo**. La app coordina las firmas, no custodia. El creador es administrador y puede nombrar más.
2. **Modo espejo (wallet externa).** El grupo usa su propia wallet externa y Green Sol solo **refleja** los datos (saldo, aportes, quién puso qué). Para los que no quieren confiar en ninguna plataforma.

> **Atribución de aportes:** para saber *quién* aportó, lo ideal es que los aportes salgan desde direcciones de usuarios registrados en la app. Un ingreso desde una dirección suelta se detecta, pero no se puede atribuir a una persona.

## 5. Usuarios objetivo

- **Persona principal — organizador de vacas:** quien junta dinero con amigos/familia/compañeros para una meta común y quiere transparencia sin pelear con hojas de cálculo ni con la desconfianza.
- **Persona secundaria — ahorrador individual:** quien quiere fijarse metas y verlas progresar (modo individual con notas).
- **Usuario avanzado (pro):** quien activa la capa Solana para respaldar el bote en USDC, usa multifirma o modo espejo.

## 6. Requisitos funcionales

### 6.1 Cuenta y acceso
- Registro/login con correo + contraseña. Wallet embebida no-custodial creada por detrás (solo si se usa la capa cripto).
- Opción de conectar/importar wallet externa.
- **Preferencias:** moneda por defecto (Bs o USDC) y tasa de referencia para el equivalente en Bs (BCV / promedio USDT / personalizada).

### 6.2 Metas, recolectas y división (núcleo, sin cripto)
- Crear meta/recolecta: nombre, monto objetivo, foto opcional.
- **Modo dividir:** repartir un monto entre participantes y ver cuánto le toca y cuánto ha pagado cada uno.
- Registrar aportes/pagos; ver barra de progreso y monto faltante.
- En grupo: invitar por enlace, ver aportes por persona.
- Mostrar cada monto con su **equivalente en Bs** según la tasa elegida.
- Nota por meta: texto + nota de voz (audio).

### 6.3 Capa cripto (opcional)
- Respaldar el bote con USDC sobre Solana.
- Bote gestionado con multifirma (roles de administrador) o modo espejo (reflejar wallet externa).
- Retiro/transferencia del bote (con aprobaciones según multifirma).

## 7. Requisitos no funcionales

- **Confianza por diseño:** no-custodial; la app no guarda llaves ni dinero ajeno.
- **Seguridad:** ver [SEGURIDAD_Y_WALLETS.md](SEGURIDAD_Y_WALLETS.md).
- **Almacenamiento de archivos** (audio/imágenes) en object storage tradicional, NO on-chain.
- **Responsive** escritorio→móvil; **accesibilidad**; **i18n** (español por defecto).
- Stack alineado con lo que el equipo ya domina.

## 8. Qué usa Solana y qué no

| Capa | ¿On-chain? | Ejemplos |
| --- | --- | --- |
| Cuentas, metas, registro de aportes, notas | No (web tradicional) | Login, metas, progreso, texto/audio |
| Archivos pesados (audio, imágenes) | No (object storage) | Notas de voz, fotos |
| Tasas y equivalencia en Bs | No (API externa) | BCV, promedio USDT, personalizada (solo para mostrar) |
| Respaldo del bote en dólares digitales | Sí (Solana) | Saldo USDC, aportes verificables |
| Mover fondos del bote | Sí (multifirma) | Retiros aprobados por administradores |
| Reflejar una wallet externa | Sí (lectura RPC) | Modo espejo |

## 9. Roadmap por fases

- **Fase 0 — Documentación (actual).**
- **Fase 1 — MVP web (en devnet):** cuenta con correo, crear meta, registro de aportes sin cripto, barra de progreso, nota de texto + voz, grupo básico por enlace, y modo espejo de una dirección.
- **Fase 2 — Capa cripto completa:** bote en USDC, multifirma, roles de administrador, atribución de aportes.
- **Fase 3 — Notas ricas y móvil:** editor de texto enriquecido (colores, fuentes, imágenes, links), empaquetado Android/iOS.

## 10. Identidad de marca

- **Nombre:** Green Sol — un sol (Solana es, literalmente, una estrella) en **verde**. El verde evoca dinero, organización y calma/confianza.
- **Concepto visual:** astros / galaxia, con el sol verde como elemento central.
- **Ícono:** un sol verde (o blanco) que contraste tanto en modo claro como oscuro.
- **Por qué no "Cochino":** funciona en Venezuela (alcancía/cerdito), pero en otros países connota suciedad. Green Sol viaja mejor y conecta con Solana.

## 11. Fuera de alcance / decisiones abiertas

- Identidad visual final (diseño del logo del sol, escala de verdes, tipografía).
- Proveedor de wallet embebida (ver arquitectura).
- Modelo de negocio.
- Conversión a moneda local: el usuario retira a su exchange y convierte; Green Sol no hace cambio de divisa.
