import { Shield, Mail } from "lucide-react";
import { prisma } from "@/lib/db";
import { obtenerUsuario } from "@/lib/auth/session";
import { eliminarMetodoPago } from "@/app/(app)/perfil/actions";
import { PanelTabs } from "@/components/panel-tabs";
import { ToggleAdmin } from "@/components/toggle-admin";
import { FormDatos } from "@/components/form-datos";
import { FormMetodoPago } from "@/components/form-metodo-pago";
import { METODO_LABEL, monedaFiat } from "@/lib/monedas";
import { BANCOS_VE } from "@/lib/bancos-venezuela";
import { Button } from "@/components/ui/button";

const TABS = ["datos", "pagos", "seguridad", "comunicaciones"];

function resumenMetodo(m: {
  alias: string | null;
  banco: string | null;
  numeroCuenta: string | null;
  telefono: string | null;
  email: string | null;
  wallet: string | null;
  titular: string | null;
}): string {
  const partes: string[] = [];
  if (m.alias) partes.push(m.alias);
  if (m.banco)
    partes.push(BANCOS_VE.find((b) => b.codigo === m.banco)?.nombre ?? m.banco);
  if (m.numeroCuenta) partes.push(m.numeroCuenta);
  if (m.telefono) partes.push(m.telefono);
  if (m.email) partes.push(m.email);
  if (m.wallet) partes.push(`${m.wallet.slice(0, 6)}…${m.wallet.slice(-4)}`);
  if (m.titular) partes.push(m.titular);
  return partes.join(" · ");
}

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
            Tus métodos para recibir en los ahorros que organices.
          </p>
          <ul className="space-y-1.5 text-sm">
            {usuario!.metodosPago.map((m) => {
              const eliminar = eliminarMetodoPago.bind(null, m.id);
              const monedaTxt =
                m.categoria === "cripto"
                  ? m.moneda
                  : (monedaFiat(m.moneda)?.nombre ?? m.moneda);
              return (
                <li
                  key={m.id}
                  className="flex items-center justify-between gap-2 rounded-lg border bg-card px-3 py-2"
                >
                  <span className="min-w-0">
                    <span className="block font-medium">
                      {METODO_LABEL[m.metodo] ?? m.metodo} · {monedaTxt}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {resumenMetodo(m)}
                    </span>
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
          <FormMetodoPago />
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
