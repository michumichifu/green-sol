# Motor de rondas del san: recolección → entrega → siguiente ronda — Diseño

**Fecha:** 2026-06-03
**Estado:** Aprobado (dirección). Decisiones de Luis incorporadas. Se pule en la implementación.
**Alcance:** El ciclo de rondas de un san por turnos, sobre lo ya construido (detalle con pestañas, pagos con declaración+PIN). NO toca cripto ni SMTP.

## Contexto

Un san de N personas tiene **N rondas**. En cada ronda **todos aportan su cuota** y **una persona recibe el total** (su turno). El **organizador es la persona de confianza** que recoge los aportes y entrega el total al del turno (modelo tradicional venezolano; apps como Tu-Turno/Kontigo lo digitalizan con pasarela, aquí el organizador reparte). Hoy en Green Sol: los participantes reportan pago → el organizador aprueba con **declaración + PIN** (v0.0.122). Falta el **ciclo de rondas**: qué pasa cuando todos pagaron, cómo se entrega al cobrador, y cómo se avanza a la siguiente ronda.

## Decisiones tomadas

- **El organizador decide al crear el san si participa o solo organiza** (`organizadorParticipa`). Si participa, tiene turno y aporta como los demás; si solo organiza, no tiene turno ni aporta.
- **Solo el organizador marca la entrega** (reporta fecha + referencia, confirma con PIN). Sin doble confirmación del cobrador en el MVP.

## Datos (migración)

- **`Recolecta`:**
  - `organizadorParticipa Boolean @default(true)` — elegido en el asistente de creación.
  - `rondaActual Int @default(1)` — ronda en curso.
- **`Aporte`:**
  - `ronda Int @default(1)` — a qué ronda pertenece el pago (se sella con `rondaActual` al reportar).
- **`Turno`:** (ya tiene `cobrado`)
  - `entregadoEn DateTime?` y `entregaReferencia String?` — datos de la entrega al cobrador.

**Aportantes de una ronda** = participantes con turno (si `organizadorParticipa`, incluye al organizador; si no, lo excluye). El **nº de rondas** = nº de turnos.

## Flujo (estados de una ronda)

1. **Recolección:** los participantes reportan su cuota de la ronda actual; el organizador aprueba con declaración+PIN. Un aporte cuenta para la ronda si `estado=confirmado` y `ronda=rondaActual`.
2. **Ronda completa → "Por entregar":** cuando **todos los aportantes** tienen su aporte confirmado en la ronda actual, el san muestra **"Te toca entregar a [cobrador de esta ronda]"**. Avisos: al **cobrador** ("esta ronda cobras tú") y al **organizador** ("ya recogiste todo, entrégale a Fulano").
3. **Entrega (inverso de aprobar):** el organizador ve los **datos de pago del cobrador** (su `MetodoPago`/`DatosPago`), transfiere por fuera y **reporta la entrega**: fecha + referencia, confirmando con **PIN** y una declaración ("declaro que entregué el total a [cobrador]"). Se marca `Turno.cobrado=true`, `entregadoEn`, `entregaReferencia`.
4. **Cierre de ronda:** disclaimer **"Ronda X completada. ¿Iniciar la ronda X+1?"**. Al confirmar: `rondaActual++` y arranca la recolección de la siguiente ronda. Aviso a todos: "Empezó la ronda X+1".
5. **Fin del san:** cuando se entregó el último turno (`rondaActual` supera el nº de turnos), el san pasa a **finalizado/cerrado** (todos cobraron una vez). Habilita las valoraciones.

## Backend (acciones en `app/(app)/sanes/actions.ts`)

- `crearRecolecta`: aceptar `organizadorParticipa` del asistente; si `false`, el organizador **no** se crea como `Participante`.
- `generarTurnos`: generar turnos solo para los aportantes (excluir al organizador si no participa).
- `reportarPago`: sellar `ronda = recolecta.rondaActual` en el `Aporte`.
- Nueva `reportarEntrega(recolectaId, turnoId, formData con referencia, pin)`: valida organizador + PIN + que la ronda esté completa; marca el turno entregado; notifica al cobrador.
- Nueva `iniciarSiguienteRonda(recolectaId, pin)`: valida organizador + PIN + que el turno de la ronda esté entregado; `rondaActual++` o finaliza el san; notifica.
- Helper `estadoRonda(recolecta)`: deriva `{ rondaActual, totalRondas, aportantes, confirmadosRonda, completa, cobradorActual, entregada }`.

## UI

- **Asistente de crear (`sanes/crear`):** nuevo paso/toggle **"¿Participas tú también o solo organizas?"** → `organizadorParticipa`.
- **Resumen / Pagos (organizador):** cuando la ronda está completa, banner **"Te toca entregar a [cobrador]"** con sus datos de pago y botón **Reportar entrega** (modal con declaración + PIN, análogo a `ConfirmarResolucionPago`). Tras entregar, disclaimer **"¿Iniciar la ronda siguiente?"**.
- **Miembros / progreso:** la dona y "Ronda X de Y" ya existen; reflejan `rondaActual` y turnos cobrados.

## Notificaciones (catálogo)

- `san_ronda_por_cobrar` → cobrador de la ronda ("esta ronda cobras tú").
- `san_ronda_por_entregar` → organizador ("ya recogiste todo, entrégale a {{cobrador}}").
- `san_entrega_hecha` → cobrador ("el organizador te entregó {{monto}}, ref {{referencia}}").
- `san_nueva_ronda` → todos ("empezó la ronda {{ronda}}").
- `san_finalizado` → todos ("el san terminó, todos cobraron").

## Verificación

- Migración + reiniciar dev + `tsc` por fase + E2E (greensol_test) del ciclo: reportar→aprobar todos→entregar→iniciar siguiente. Documentar (CHANGELOG/PRD/arquitectura). Versionar 0.0.x.

## Fuera de alcance

Penalizaciones/prórroga por atraso (idea de Tu-Turno: 7 días) — a futuro. Doble confirmación del cobrador — a futuro. Pasarela de pago automática — no aplica al modelo (organizador reparte).
