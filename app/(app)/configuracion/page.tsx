import { Shield, Mail } from "lucide-react";
import { prisma } from "@/lib/db";
import { obtenerUsuario } from "@/lib/auth/session";
import {
  agregarMetodoPago,
  eliminarMetodoPago,
} from "@/app/(app)/perfil/actions";
import { PanelTabs } from "@/components/panel-tabs";
import { ToggleAdmin } from "@/components/toggle-admin";
import { FormDatos } from "@/components/form-datos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const TIPOS_PAGO = [
  { id: "efectivo", label: "Efectivo (USD)" },
  { id: "transferencia_bs", label: "Transferencia (Bs)" },
  { id: "pago_movil", label: "Pago móvil" },
  { id: "wallet_usdt", label: "Wallet USDT" },
  { id: "wallet_solana", label: "Wallet Solana" },
];
const TIPO_PAGO_LABEL: Record<string, string> = Object.fromEntries(
  TIPOS_PAGO.map((t) => [t.id, t.label]),
);
const TABS = ["datos", "pagos", "seguridad", "comunicaciones"];

export default async function ConfiguracionPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const inicial = Math.max(0, TABS.indexOf(tab ?? "datos"));

  const sesion = await obtenerUsuario();
  const usuario = await prisma.usuario.findUnique({
    where: { id: sesion!.id },
    include: { metodosPago: true },
  });
  const esAdmin = usuario!.rol === "super_admin";

  return (
    <main className="mx-auto max-w-md space-y-5 px-5 py-6">
      <h1 className="text-xl font-bold">Configuración</h1>

      <PanelTabs
        tabs={["Datos", "Pagos", "Seguridad", "Avisos"]}
        inicial={inicial}
      >
        {/* Datos */}
        <FormDatos
          correo={usuario!.correo}
          nombre={usuario!.nombre ?? ""}
          apellido={usuario!.apellido ?? ""}
          nombreUsuario={usuario!.nombreUsuario ?? ""}
        />

        {/* Pagos */}
        <section className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Tus métodos de pago para enviar y recibir en los ahorros.
          </p>
          <ul className="space-y-1 text-sm">
            {usuario!.metodosPago.map((m) => {
              const eliminar = eliminarMetodoPago.bind(null, m.id);
              return (
                <li
                  key={m.id}
                  className="flex items-center justify-between rounded-lg border bg-card px-3 py-2"
                >
                  <span className="min-w-0 truncate">
                    <span className="font-medium">
                      {TIPO_PAGO_LABEL[m.tipo] ?? m.tipo}
                    </span>
                    : {m.detalle}
                  </span>
                  <form action={eliminar}>
                    <Button type="submit" size="sm" variant="ghost">
                      Quitar
                    </Button>
                  </form>
                </li>
              );
            })}
            {usuario!.metodosPago.length === 0 && (
              <li className="text-xs text-muted-foreground">
                Aún no tienes métodos de pago.
              </li>
            )}
          </ul>
          <form
            action={agregarMetodoPago}
            className="space-y-2 rounded-xl border p-3"
          >
            <select
              name="tipo"
              className="w-full rounded-md border bg-background p-2 text-sm"
            >
              {TIPOS_PAGO.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
            <Input
              name="detalle"
              placeholder="Banco/titular/número o dirección de wallet"
              required
            />
            <Button type="submit" variant="outline" className="w-full">
              Agregar método
            </Button>
          </form>
        </section>

        {/* Seguridad */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 rounded-2xl border bg-card p-4 text-sm text-muted-foreground">
            <Shield className="size-5 text-brand" />
            Cambio de contraseña y verificación en dos pasos.{" "}
            <span className="font-medium">Próximamente.</span>
          </div>
        </section>

        {/* Comunicaciones */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 rounded-2xl border bg-card p-4 text-sm text-muted-foreground">
            <Mail className="size-5 text-brand" />
            Preferencias de correos y avisos de marketing.{" "}
            <span className="font-medium">Próximamente.</span>
          </div>
        </section>
      </PanelTabs>

      {esAdmin && <ToggleAdmin />}
    </main>
  );
}
