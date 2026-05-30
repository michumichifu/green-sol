# Ideas futuras — Green Sol

Backlog de ideas de producto que **aún no se implementan**, para no perderlas.

## Reputación, puntos y recompensas (inspirado en Cashea)

- **Puntos = estrellitas.** No es un sistema de 5 estrellas, sino un acumulado de puntos que se muestran como estrellitas. El **nivel** depende de la cantidad de puntos. _(Ya adoptado en la UI: niveles Nuevo → Confiable → Destacado → Estrella → Leyenda.)_
- En Cashea los puntos se ganan por **cuotas pagadas a tiempo**; aquí el equivalente es **aportes cumplidos a tiempo** + valoraciones positivas del grupo.

### Sistema de referidos (pendiente — toca schema y lógica)
- Tarjeta con **código de referido** + botón **copiar / compartir** (texto reenviable por WhatsApp, etc.).
- **+40 puntos para ambos** (quien invita y referido) cuando el referido **se registra con el código** y **realiza su primer aporte** dentro de un ahorro.
- **Condiciones:** máximo **5 referidos** premiados; deben ser **cuentas nuevas** (si ya tenía cuenta, no cuenta); los puntos se acreditan **una vez procesado el primer aporte**.
- Flujo: 1) invita y comparte el link/código → 2) el referido lo ingresa al crear la cuenta → 3) al hacer su primer aporte se activa la recompensa para ambos.
- Requiere: campos `codigoReferido` y `referidoPorId` en `Usuario`, control de acreditación única, y enganche en el evento "primer aporte confirmado".

### Club de recompensas (más adelante)
- Canjear puntos por beneficios: tipos de ahorro especiales, recompensas, etc.

## Dashboard
- **Tarjeta de participación** (estilo Cashea): en cuántos sanes/vacas está activo el usuario, cuántos métodos de ahorro tiene en curso, resumen de su actividad.

## Flujo de creación de ahorro (mejora pendiente — toca schema)
- Asistente paso a paso: elegir **método** (san/susi/bolso vs vaca/pote) con infografía → tipo (privado/público) → **meta o aporte** → para el san: **nº de manos/miembros**, **periodicidad** (cada cuánto se gira la mano) → **animación de sorteo** de manos.
- Requiere añadir a `Recolecta`: `frecuencia` (semanal/quincenal/mensual), `fechaInicio`, y opcional `cupoMiembros`. Con `fechaInicio` + `frecuencia` se generan las **fechas por turno** (alimenta el calendario de Pagos).
- **Código de invitación corto y legible** (hoy se usa el `id`/cuid como código): añadir un campo `codigo` corto y único a `Recolecta`.

## Pagos
- **Calendario de turnos con fechas:** hoy el modelo `Turno` solo tiene `posicion` y `cobrado`. Para mostrar "qué fecha te toca" hay que añadir fechas/periodicidad al san (fecha de inicio + frecuencia → fechas por posición).
