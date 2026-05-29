# PRD — Green Sol

> Proyecto del Solana Vibe Bootcamp (Venezuela). App para **juntar dinero en grupo de forma transparente** (san, bolso, pote, vaca) y dividir cuentas, con **reputación de usuarios**. Método tradicional o cripto opcional sobre Solana, sin que la app custodie dinero a la fuerza.

- **Versión:** 0.4 (idea ampliada: reputación, público/privado, dashboard)
- **Fecha:** 2026-05-29
- **Fase:** 0 — Documentación previa al desarrollo
- **Nombre:** Green Sol (sol verde). Descartado: Cochino.

Versión visual: [PRD.html](PRD.html). Técnica: [ARQUITECTURA_TECNICA.md](ARQUITECTURA_TECNICA.md) y [SEGURIDAD_Y_WALLETS.md](SEGURIDAD_Y_WALLETS.md).

---

## 1. Resumen ejecutivo

Green Sol digitaliza y hace **transparente** una práctica que en Venezuela y Latinoamérica todos conocen: juntar dinero en grupo. Tres formas con el mismo motor:

1. **San / bolso** — recolecta **rotativa** por turnos.
2. **Pote / vaca** — recolecta hacia una **meta común**.
3. **Dividir una cuenta** — repartir un **gasto a pagar**.

Cada recolecta puede ser **tradicional** (la app organiza y cada quien reporta pagos; el dinero va por fuera, en Bs o efectivo) o con **cripto** (USDC/SOL). Y como aquí se maneja dinero entre personas, el corazón de la confianza es un **sistema de reputación**: cada quien construye un historial visible (puntuación, estrellitas) que se gana o se pierde según su responsabilidad.

> **Sobre el "MVP":** los tres tipos se desarrollan (por fases). El **san/bolso** y el **pote/vaca** son el gancho de promoción; dividir cuentas llega después. La **reputación se implementa desde el inicio** (no es opcional: con dinero no se juega).

## 2. Problema que resuelve

- **Los sanes y vacas se manejan a ciegas:** alguien guarda el dinero y el resto confía; no hay transparencia ni forma de saber con quién te estás metiendo.
- **Ahorrar en bolívares no protege el valor** (inflación, tasa BCV irreal). La gente quiere dólares pero no sabe usar USDT/USDC.
- **Las apps que dicen "mete tu dinero aquí" generan rechazo.** Green Sol organiza y da transparencia, no custodia a la fuerza.
- **El san tiene muchos morosos e irresponsables.** Sin reputación, no hay forma de prever quién cumplirá.

## 3. Principio rector de UX

¿Reduce la fricción y la desconfianza de alguien que nunca ha usado cripto?

1. La app **vale sin cripto**: registro transparente de la recolecta.
2. **Cripto opcional**, solo para respaldar/recibir, nunca custodiar a la fuerza.
3. **Registro rápido**; cédula/KYC solo para funciones de dinero.
4. **Transparencia pública** dentro del grupo: turnos, aportes, mora y **reputación**.
5. **Lenguaje humano**, tooltips y guías claras.

## 4. Los tres tipos de recolecta

- **San / bolso (rotativo) — gancho principal.** Aporte periódico y reparto por turnos. Ej.: 5 personas, cada una recibe $100; dura 5 semanas; cada semana todos aportan $20 y a uno le toca cobrar los $100. Quien cobra primero sigue aportando. Ahorro disciplinado y muy popular.
- **Pote / vaca (meta común).** Todos aportan (igual o distinto) hasta llegar a una meta, sin fechas fijas, y luego se gasta o reparte.
- **Dividir una cuenta (fase posterior).** Repartir un gasto entre varios; cada quien ve cuánto le toca.

## 5. Público o privado, y marketplace

Al crear una recolecta se elige su visibilidad:

- **Privado:** solo las personas que invites (amigos, familia, conocidos).
- **Público:** aparece en un **marketplace** donde otros usuarios pueden verlo y solicitar unirse.

El **marketplace público** es una meta **a futuro y ambiciosa**, pero se diseña desde ya porque depende de la reputación (sección 9): unirse a un bolso de desconocidos solo tiene sentido si puedes ver su historial y el del organizador.

## 6. Método por recolecta: tradicional o cripto

No es un modo global: cada recolecta elige su método.

**Tradicional (la app organiza, el dinero va por fuera):**
- Referencia en USDT y/o Bs, a la tasa que elijan.
- Métodos: efectivo (más para bolsos en dólares físicos), transferencia bancaria o pago móvil.
- Al crear: **datos de la cuenta destino** (tipo, banco con su código, titular, número, tipo de cuenta).
- Cada participante **reporta su pago**: comprobante (captura), referencia, fecha, monto, banco origen/destino.

**Cripto (sobre Solana):**
- Referencia y movimiento en USDC (o SOL).
- El grupo elige **wallet de la app** (embebida, maneja saldo y transfiere sin extensión, estilo GMGN) o **autocustodia / dirección externa** (la app refleja).
- El **bote de grupo** seguro usa **multifirma**.

## 7. Moneda, tasas y equivalencia en bolívares

Cada monto muestra un **tag con el equivalente en Bs** a la tasa elegida: **BCV**, **USDT** (mercado/cripto, aproximada) o **personalizada**. En preferencias: moneda por defecto (Bs/USDC) y tasa. Las tasas vienen de una **API externa**, consultada desde el backend y cacheada; son **solo informativas**, nunca mueven fondos.

## 8. Turnos del san y mora

- **Turnos:** orden **al azar** (animación: dado, ruleta, carrusel) o **manual**. Siempre **público**: todos ven quién giró y a quién le tocó.
- **Mora:** la app **notifica al grupo, al moroso y al administrador**. **Multa por mora opcional** (porcentaje o monto fijo, en USDC/SOL/Bs). La mora también **baja la reputación** (sección 9).

## 9. Reputación y confianza (clave, desde el inicio)

Con dinero no se juega; saber con quién te metes es esencial.

- Al **cerrar un bolso**, cada participante puede **valorar a los demás**: **manito arriba (+1)** o **manito abajo (−1)** y un **comentario** sobre la experiencia. Todo se almacena.
- El perfil muestra la **puntuación** (positivos vs negativos) y su equivalente visual en **estrellitas** (atractivo y rápido de leer).
- La reputación **baja por retrasos y mora**.
- **Al unirse a un san**, se ve a el/los **organizador(es)** (pueden ser varios) y su historial: cuántos sanes han hecho, montos, cuántos **completados** vs **no concretados**, y de qué tipo (público/privado, tradicional/cripto, Bs/USDC/SOL). También se ve quién más se unió, su nombre/usuario y su reputación.
- Aplica **incluso en planes privados**: ver quién entró y su puntuación.
- Responsabilidad: la plataforma presta la herramienta y la transparencia; **organizar y cumplir es responsabilidad de los usuarios**.

> Referencia a investigar: **Cashea** (app venezolana de cuotas) tiene un sistema de puntuación muy logrado; hay info pública. El modelo base de Green Sol es simple (manito +/−, estilo P2P de Binance), pero conviene estudiar Cashea para evolucionarlo.

## 10. Dashboard del usuario

Pantalla principal con lo esencial de un vistazo:
- Si tiene **saldo** en su wallet (y cuánto), con equivalente en Bs.
- En qué **bolsos / vacas / cuentas** está participando ahora, su estado y próximos vencimientos.
- Su **reputación** (estrellitas) y accesos rápidos a crear o unirse.

## 11. Cuenta, registro, verificación y roles

- **Registro rápido** con correo + contraseña (wallet embebida por detrás). Sin cédula al inicio.
- **Perfil:** nacionalidad; si es venezolano, documento (cédula/pasaporte) y número.
- **KYC:** no para registrarse, pero **sí para funciones de dinero**, vía proveedor tercero (documento + selfie/video), no manual.
- **Roles:** usuario, administrador de grupo, y **super-admin** (sección 12).

## 12. Panel super-admin

Acceso interno separado para los responsables: administrar usuarios y recolectas, ver métodos de pago y documentos subidos (cédula, pasaporte, comprobantes), hacer comprobaciones manuales anti-estafa, y mayor control de seguridad.

## 13. Qué usa Solana y qué no

| Capa | ¿On-chain? | Ejemplos |
| --- | --- | --- |
| Cuentas, recolectas, turnos, reportes, reputación, UTM | No (web tradicional) | Login, grupos, progreso, valoraciones |
| Archivos pesados (comprobantes, audio, fotos) | No (object storage) | Capturas, notas de voz |
| Tasas y equivalencia en Bs | No (API externa) | BCV, USDT, personalizada |
| Recolecta con cripto (saldo del bote) | Sí (Solana) | USDC/SOL verificable |
| Mover fondos del bote cripto | Sí (multifirma) | Retiros aprobados |
| Reflejar wallet externa | Sí (lectura RPC) | Modo espejo |

## 14. Datos y analítica (control interno)

- **UTM** de cada usuario (registro, ingreso, campañas) para medir adquisición y para marketing.
- Métricas de uso (sanes creados, completados, no concretados, montos, tipos) — útiles para el negocio **y** para mostrar parte al usuario como reputación/historial.
- Todo respetando privacidad y con datos sensibles protegidos.

## 15. Requisitos no funcionales

- **Confianza por diseño:** no-custodial por defecto.
- **Seguridad:** datos personales y comprobantes cifrados y con acceso restringido.
- **Responsive** escritorio→móvil; **accesibilidad**; **i18n** (español por defecto).

## 16. Roadmap por fases

- **Fase 0 — Documentación (actual).**
- **Fase 1 — MVP gancho (tradicional):** bienvenida, registro, preferencias, dashboard, crear san/bolso y pote/vaca (público/privado), cuenta destino, reporte de pagos, turnos, avisos de mora y **reputación básica** (manito +/−, estrellitas). Pruebas en Vercel.
- **Fase 2 — Capa cripto:** wallet embebida, USDC/SOL, multifirma o modo espejo, tasas vía API, multas por mora.
- **Fase 3 — Confianza y escala:** dividir cuentas, KYC con proveedor, panel super-admin completo, **marketplace público**, despliegue en VPS.
- **Fase 4 — Móvil:** Android/iOS.

## 17. Identidad de marca y diseño

- **Green Sol:** el sol (Solana es una estrella) en **verde** (dinero, organización, calma). Concepto astros/galaxia; ícono de sol que contrasta en claro y oscuro.
- **Modo light por defecto** — tanto en el PRD como en la app. La primera impresión transmite más confianza y seriedad en claro. El **modo dark es opcional**, con un botón de cambio fácil en el dashboard principal.
- **Paleta:** verde de marca como base, con **acentos** donde aporten (no todo verde). Las **estrellitas de reputación van en dorado**, con buen contraste en ambos modos: dorado **más oscuro en light** (`#C8881A`) y **más claro en dark** (`#F5C84B`). Mismo criterio para otros íconos donde haga juego.

## 18. Despliegue

- **Pruebas / MVP:** Vercel (cuenta y proyecto vinculados con GitHub) + Postgres gestionada + object storage.
- **Producción:** VPS propio en contenedor cerrado cuando madure. Detalle en [ARQUITECTURA_TECNICA.md](ARQUITECTURA_TECNICA.md).

## 19. Fuera de alcance / decisiones abiertas

- Proveedor de wallet embebida y de KYC.
- Endpoint/credenciales de la API de tasas (en variables de entorno, no en el repo).
- Detalle del algoritmo de reputación (estudiar Cashea).
- Modelo de negocio.
