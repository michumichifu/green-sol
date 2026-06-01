import { Mail } from "lucide-react";
import { prisma } from "@/lib/db";
import { obtenerUsuario } from "@/lib/auth/session";
import { PanelTabs } from "@/components/panel-tabs";
import { ToggleAdmin } from "@/components/toggle-admin";
import { FormDatos } from "@/components/form-datos";
import { FormSeguridad } from "@/components/form-seguridad";
import { SeccionVerificacion } from "@/components/seccion-verificacion";
import { FormMetodoPago } from "@/components/form-metodo-pago";
import { MetodoPagoItem } from "@/components/metodo-pago-item";
import { ultimaVerificacion } from "@/lib/kyc/consultas";
import { pasosRequeridos } from "@/lib/kyc/config";

const TABS = ["datos", "verificacion", "pagos", "seguridad", "comunicaciones"];

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

  const [kyc, pasosKyc] = await Promise.all([
    ultimaVerificacion(usuario!.id),
    pasosRequeridos(),
  ]);

  return (
    <main className="mx-auto max-w-md space-y-5 px-5 py-6">
      <h1 className="text-xl font-bold">Configuración</h1>

      <PanelTabs
        tabs={["Datos", "Verificación", "Pagos", "Seguridad", "Avisos"]}
        inicial={inicial}
      >
        {/* Datos */}
        <FormDatos
          correo={usuario!.correo}
          nombre={usuario!.nombre ?? ""}
          apellido={usuario!.apellido ?? ""}
          nombreUsuario={usuario!.nombreUsuario ?? ""}
        />

        {/* Verificación */}
        <SeccionVerificacion
          correoVerificado={usuario!.correoVerificado}
          tiene2FA={!!usuario!.pinHash || usuario!.otpCorreoActivo}
          estadoKyc={kyc?.estado ?? null}
          motivoRechazoKyc={kyc?.motivoRechazo ?? null}
          pasosKyc={pasosKyc}
        />

        {/* Pagos */}
        <section className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Tus métodos para recibir en los ahorros que organices.
          </p>
          <ul className="space-y-1.5 text-sm">
            {usuario!.metodosPago.map((m) => (
              <MetodoPagoItem key={m.id} m={m} />
            ))}
            {usuario!.metodosPago.length === 0 && (
              <li className="text-xs text-muted-foreground">
                Aún no tienes métodos de pago.
              </li>
            )}
          </ul>
          <FormMetodoPago />
        </section>

        {/* Seguridad */}
        <FormSeguridad
          pinActivo={!!usuario!.pinHash}
          otpActivo={usuario!.otpCorreoActivo}
        />

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
