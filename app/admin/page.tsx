import Link from "next/link";
import { prisma } from "@/lib/db";
import { obtenerConfigSmtp } from "@/lib/config";
import { cambiarRol, guardarSmtp } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const ROLES = ["usuario", "admin_grupo", "super_admin"];
const CAMPOS_SMTP: [string, string][] = [
  ["SMTP_HOST", "Host"],
  ["SMTP_PORT", "Puerto"],
  ["SMTP_USER", "Usuario"],
  ["SMTP_PASS", "Contraseña"],
  ["SMTP_FROM", "Remitente"],
  ["SMTP_SECURE", "Seguro (true/false)"],
];

export default async function AdminPage() {
  const usuarios = await prisma.usuario.findMany({
    orderBy: { creadoEn: "desc" },
    take: 100,
  });
  const smtp = await obtenerConfigSmtp();

  return (
    <main className="mx-auto max-w-2xl space-y-8 px-6 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Panel super-admin</h1>
        <Link href="/dashboard" className="text-sm text-brand underline">
          Volver
        </Link>
      </div>

      <section className="space-y-3">
        <h2 className="font-semibold">Usuarios ({usuarios.length})</h2>
        <ul className="space-y-1 text-sm">
          {usuarios.map((u) => {
            const accion = cambiarRol.bind(null, u.id);
            return (
              <li
                key={u.id}
                className="flex items-center justify-between gap-2 rounded-lg border bg-card px-3 py-2"
              >
                <span className="truncate">{u.correo}</span>
                <form action={accion} className="flex items-center gap-2">
                  <select
                    name="rol"
                    defaultValue={u.rol}
                    className="rounded-md border bg-background p-1 text-xs"
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                  <Button type="submit" size="sm" variant="outline">
                    Guardar
                  </Button>
                </form>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold">Configuración de correo (SMTP)</h2>
        <p className="text-xs text-muted-foreground">
          De aquí salen la verificación, los OTP y el reseteo de contraseña.
        </p>
        <form action={guardarSmtp} className="grid gap-3 sm:grid-cols-2">
          {CAMPOS_SMTP.map(([clave, label]) => (
            <div key={clave} className="space-y-1">
              <Label htmlFor={clave}>{label}</Label>
              <Input
                id={clave}
                name={clave}
                defaultValue={smtp[clave] ?? ""}
                type={clave === "SMTP_PASS" ? "password" : "text"}
              />
            </div>
          ))}
          <div className="sm:col-span-2">
            <Button type="submit" variant="outline">
              Guardar SMTP
            </Button>
          </div>
        </form>
      </section>
    </main>
  );
}
