# PRD — Green Sol

> Proyecto del Solana Vibe Bootcamp (Venezuela). App para **gestionar el ahorro en grupo de forma transparente** (san, bolso, pote, vaca) y dividir cuentas, con **reputación de usuarios**. Método tradicional o cripto sobre Solana, sin que la app custodie dinero a la fuerza. **La finalidad es servir de puente al ahorro en cripto** para la comunidad hispana.

- **Versión:** 0.6 (planificación de desarrollo: auth con OTP por correo y login por wallet, wallet embebida no-custodial + onboarding de respaldo, super-admin con gestión de usuarios y SMTP, capa cripto integrada al plan). Diseño de implementación en [superpowers/specs/2026-05-29-green-sol-mvp-design.md](superpowers/specs/2026-05-29-green-sol-mvp-design.md).
- **Fecha:** 2026-05-29
- **Fase:** 0 — Documentación previa al desarrollo (entrega de primera versión: **1 de junio de 2026, 5:30 p.m.**)
- **Nombre:** Green Sol (sol verde). Descartado: Cochino.

Versión visual: [PRD.html](PRD.html). Técnica: [ARQUITECTURA_TECNICA.md](ARQUITECTURA_TECNICA.md), [INTEGRACIONES_API.md](INTEGRACIONES_API.md) y [SEGURIDAD_Y_WALLETS.md](SEGURIDAD_Y_WALLETS.md).

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

- **San / bolso (rotativo) — gancho principal.** Aporte periódico y reparto por turnos. Ej.: 5 personas, cada una recibe $100; dura 5 semanas; cada semana todos aportan $20 y a uno le toca cobrar los $100. Quien cobra primero sigue aportando. Ahorro disciplinado y muy popular.
- **Pote / vaca (meta común).** Todos aportan (igual o distinto) hasta llegar a una meta, sin fechas fijas, y luego se gasta o reparte.
- **Dividir una cuenta (fase posterior).** Repartir un gasto entre varios; cada quien ve cuánto le toca.

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

Herramienta clave accesible desde la **barra de navegación** (sección 12). Convierte en ambos sentidos entre:

- **Bolívares** a tasa **BCV**, **USDT** o **personalizada**.
- **USDC** (≈ dólar digital).
- **SOL** (a su precio del día vía DexScreener).

Es más completa que las calculadoras de tasas venezolanas habituales (que solo hacen Bs↔USD): aquí se suma USDC y SOL, leyendo del **caché global** (sección 7) para no consultar las APIs en cada cálculo. Ejemplos: "¿cuántos Bs son 20 USDT a tasa BCV?", "¿cuántos Bs equivale 1 SOL?", "¿cuánto SOL son 50 USDC?".

## 9. Turnos del san y mora

- **Turnos:** orden **al azar** (animación: dado, ruleta, carrusel) o **manual**. Siempre **público**: todos ven quién giró y a quién le tocó.
- **Mora:** la app **notifica al grupo, al moroso y al administrador** (sección 13). **Multa por mora opcional** (porcentaje o monto fijo, en USDC/SOL/Bs). La mora también **baja la reputación** (sección 10).

## 10. Reputación y confianza (clave, desde el inicio)

Con dinero no se juega; saber con quién te metes es esencial.

- Al **cerrar un bolso**, cada participante puede **valorar a los demás**: **manito arriba (+1)** o **manito abajo (−1)** y un **comentario** sobre la experiencia. Todo se almacena.
- El perfil muestra la **puntuación** (positivos vs negativos) y su equivalente visual en **estrellitas** (atractivo y rápido de leer).
- La reputación **baja por retrasos y mora**.
- **Al unirse a un san**, se ve a el/los **organizador(es)** (pueden ser varios) y su historial: cuántos sanes han hecho, montos, cuántos **completados** vs **no concretados**, y de qué tipo (público/privado, tradicional/cripto, Bs/USDC/SOL). También se ve quién más se unió, su nombre/usuario y su reputación.
- Aplica **incluso en planes privados**: ver quién entró y su puntuación.
- Responsabilidad: la plataforma presta la herramienta y la transparencia; **organizar y cumplir es responsabilidad de los usuarios**.

> Referencia a investigar: **Cashea** (app venezolana de cuotas) tiene un sistema de puntuación muy logrado; hay info pública. El modelo base de Green Sol es simple (manito +/−, estilo P2P de Binance), pero conviene estudiar Cashea para evolucionarlo.

## 11. Dashboard del usuario

Pantalla principal con lo esencial de un vistazo:

- **Tasas del día** mostradas de forma **sutil** arriba de las tarjetas: BCV, USDT promedio y SOL/USDC, con su variación (del caché global, sección 7).
- Si tiene **saldo** en su wallet (y cuánto), con equivalente en Bs.
- En qué **bolsos / vacas / cuentas** está participando ahora, su estado y próximos vencimientos.
- Su **reputación** (estrellitas) y accesos rápidos a crear o unirse.

## 12. Navegación (barra inferior)

La app usa un **menú de navegación inferior** (bottom nav, estilo app móvil) con los botones clave. Set previsto (a afinar con referencias visuales): **Dashboard / Inicio**, **Sanes & Vacas**, **Calculadora**, **Notificaciones** (campanita) y **Perfil**. Diseño responsive: la barra inferior en móvil; en escritorio puede pasar a lateral o superior.

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

> Para el MVP, notificaciones **in-app** son suficientes; correo/push pueden venir después.

## 14. Cuenta, registro, verificación, perfil y roles

**Registro y login (métodos combinables):**
- **Correo + contraseña.** Política de contraseña segura: al menos **una mayúscula, un número y un símbolo** (además de letras). Con **generador de contraseña aleatoria** opcional.
- **Verificación y 2FA por OTP al correo:** **código aleatorio único autogenerado** enviado al correo asociado, para confirmar la cuenta y como **segundo factor de seguridad básico**. Sale por el **servidor SMTP propio** (dominio de prueba). TOTP/Google Authenticator queda para más adelante.
- **Login con wallet** (Phantom/Solflare): se entra por la **firma** de la wallet, **sin OTP** (la propia wallet autentica).
- **Métodos combinables:** quien entró por wallet puede **vincular** luego correo + contraseña + OTP si lo desea; quien se registró por correo recibe su **wallet embebida no-custodial** (sección 6).
- Sin cédula al inicio, para no poner barrera.
- **A futuro (no MVP):** Google (OAuth) y TOTP/Google Authenticator.

**Perfil y configuración (por pestañas):**
- **Cuenta:** cambiar correo principal y contraseña.
- **Perfil:** foto de perfil, nombre y apellido, **nombre de usuario** (campo adicional); nacionalidad y, si es venezolano, documento (cédula/pasaporte) y número.
- **Datos de pago** (para cobrar/pagar en los sanes):
  - **Tradicional:** efectivo (dólar físico), transferencia bancaria (Bs), pago móvil (Bs).
  - **Cripto:** dirección de wallet **USDT** (ej. Binance) y/o wallet **Solana** (USDC/SOL) — se incentiva Solana para que haya consulta entre la wallet y la app (saldos, interacción en los sanes).

**KYC:** no para registrarse, pero **sí para funciones de dinero**, vía proveedor tercero (documento + selfie/video), no manual.

**Roles:** usuario, administrador de grupo, y **super-admin** (sección 15).

## 15. Panel super-admin

Acceso interno separado para los responsables. Panel **completo**:
- **Gestión de usuarios:** ver todos los usuarios, **editarlos**, y **crear o invitar** nuevos (incluido otro super-admin).
- **Recolectas:** administrar sanes/vacas; ver métodos de pago y documentos subidos (cédula, pasaporte, comprobantes); comprobaciones manuales anti-estafa.
- **Configuración de correo (SMTP):** cargar los datos del **servidor SMTP** de la aplicación; de ahí salen las automatizaciones (verificación de cuenta, OTP, reseteo de contraseña, avisos).
- **Notificaciones:** enviar a un usuario o globales (sección 13).
- Mayor control de seguridad.

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

- **Fase 0 — Documentación (actual).**
- **Fase 1 — MVP gancho (tradicional).** Entrega de **primera versión: 1 de junio de 2026, 5:30 p.m.** (tarea del bootcamp: tuit con screenshot/video + URL). Incluye: bienvenida, registro/login (correo + clave segura + verificación), preferencias, dashboard con **tasas en vivo**, **calculadora**, **bottom nav**, crear san/bolso y pote/vaca (público/privado), cuenta destino, reporte de pagos, turnos, avisos de mora, **notificaciones (toasts + campanita básica)** y **reputación básica** (manito +/−, estrellitas). Pruebas en Vercel. *(El alcance exacto del entregable del 1-jun se prioriza por impacto visual; ver nota abajo.)*
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

- Proveedor de wallet embebida y de KYC.
- Set final y orden de íconos del bottom nav (pendiente revisar referencias visuales).
- Detalle del algoritmo de reputación (estudiar Cashea).
- ¿Notificaciones por correo/push además de in-app? (fase posterior).
- Modelo de negocio.
