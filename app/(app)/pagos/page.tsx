import Link from "next/link";
import {
  CalendarClock,
  Clock,
  AlertCircle,
  Users,
  ArrowRight,
} from "lucide-react";
import { prisma } from "@/lib/db";
import { obtenerUsuario } from "@/lib/auth/session";
import { obtenerTasas } from "@/lib/rates/cache";
import { fechaCorte } from "@/lib/san/rondas";
import { infoMontoParticipante } from "@/lib/san/montos";
import {
  CalendarioPagos,
  type Vencimiento,
} from "@/components/san/calendario-pagos";
import { cn } from "@/lib/utils";

function ymd(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function fmt(n: number) {
  return n.toLocaleString("es-VE", { maximumFractionDigits: 2 });
}

export default async function PagosPage() {
  const usuario = await obtenerUsuario();
  const participaciones = await prisma.participante.findMany({
    where: { usuarioId: usuario!.id },
    include: {
      recolecta: true,
      turno: true,
      aportes: { orderBy: { creadoEn: "desc" } },
    },
    orderBy: { unidoEn: "desc" },
  });

  const activas = participaciones.filter(
    (p) => p.recolecta.estado === "activa",
  );
  const aportes = participaciones.flatMap((p) =>
    p.aportes.map((a) => ({
      ...a,
      moneda: p.recolecta.moneda,
      nombre: p.recolecta.nombre,
    })),
  );
  const porConfirmar = aportes.filter((a) => a.estado === "reportado");
  const rechazados = aportes.filter((a) => a.estado === "rechazado");

  // Vencimientos (fechas de corte) de los sanes en curso del usuario, para el calendario.
  const tasas = await obtenerTasas();
  const vencimientos: Vencimiento[] = [];
  for (const p of activas) {
    const r = p.recolecta;
    if (r.tipo !== "san" || !r.fechaInicio) continue;
    const dias =
      r.frecuenciaDias ??
      (r.frecuencia === "mensual" ? 30 : r.frecuencia === "quincenal" ? 15 : 7);
    const nRondas = r.cupoMiembros ?? 1;
    const info = infoMontoParticipante(r.moneda, r.montoAporte ?? 0, tasas);
    const cuotaTxt =
      info.enBolivares && info.montoBs != null
        ? `Bs ${fmt(info.montoBs)} ≈ $${fmt(info.montoAncla)}`
        : `${fmt(info.montoAncla)} ${info.ancla}`;
    for (let ronda = r.rondaActual; ronda <= nRondas; ronda++) {
      vencimientos.push({
        fecha: ymd(fechaCorte(r.fechaInicio, ronda, dias)),
        sanId: p.recolectaId,
        sanNombre: r.nombre,
        ronda,
        cuotaTxt,
      });
    }
  }

  const vacio = participaciones.length === 0;

  return (
    <main className="mx-auto max-w-md space-y-5 px-5 py-6">
      <h1 className="text-xl font-bold">Cuentas por pagar</h1>

      {vencimientos.length > 0 && <CalendarioPagos vencimientos={vencimientos} />}

      {vacio && (
        <div className="rounded-2xl border border-dashed bg-card p-6 text-center">
          <span className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-brand/10 text-brand">
            <CalendarClock className="size-6" />
          </span>
          <p className="text-sm font-medium">No tienes pagos por ahora</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Cuando participes en un ahorro verás aquí tus aportes y turnos.
          </p>
        </div>
      )}

      {/* Rechazados (requieren atención) */}
      {rechazados.length > 0 && (
        <section className="space-y-2">
          <h2 className="flex items-center gap-1.5 text-sm font-semibold text-destructive">
            <AlertCircle className="size-4" /> Rechazados ({rechazados.length})
          </h2>
          <ul className="space-y-2">
            {rechazados.map((a) => (
              <li
                key={a.id}
                className="rounded-2xl border border-destructive/30 bg-card p-3.5 shadow-sm"
              >
                <p className="font-medium">{a.nombre}</p>
                <p className="text-xs text-muted-foreground">
                  {a.moneda} {fmt(a.monto)} · vuelve a reportar el pago
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Por confirmar */}
      {porConfirmar.length > 0 && (
        <section className="space-y-2">
          <h2 className="flex items-center gap-1.5 text-sm font-semibold">
            <Clock className="size-4 text-gold" /> Por confirmar (
            {porConfirmar.length})
          </h2>
          <ul className="space-y-2">
            {porConfirmar.map((a) => (
              <li
                key={a.id}
                className="rounded-2xl border bg-card p-3.5 shadow-sm"
              >
                <p className="font-medium">{a.nombre}</p>
                <p className="text-xs text-muted-foreground">
                  {a.moneda} {fmt(a.monto)} · esperando confirmación del
                  organizador
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Ahorros activos */}
      {activas.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold">Tus ahorros activos</h2>
          <ul className="space-y-2">
            {activas.map((p) => {
              const esSan = p.recolecta.tipo === "san";
              return (
                <li key={p.id}>
                  <Link
                    href={`/sanes/${p.recolecta.id}`}
                    className="flex items-center gap-3 rounded-2xl border bg-card p-3.5 shadow-sm transition-colors hover:border-brand/40"
                  >
                    <span
                      className={cn(
                        "flex size-10 shrink-0 items-center justify-center rounded-xl",
                        esSan
                          ? "bg-brand/10 text-brand"
                          : "bg-gold/15 text-gold",
                      )}
                    >
                      <Users className="size-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{p.recolecta.nombre}</p>
                      <p className="text-xs text-muted-foreground">
                        {esSan && p.turno
                          ? `Tu turno: posición ${p.turno.posicion}${p.turno.cobrado ? " · ya cobraste" : ""}`
                          : esSan
                            ? "Turno sin asignar"
                            : "Meta común"}
                      </p>
                    </div>
                    <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {!vacio && (
        <p className="px-1 text-center text-xs text-muted-foreground">
          El calendario con las fechas de cada turno llegará pronto.
        </p>
      )}
    </main>
  );
}
