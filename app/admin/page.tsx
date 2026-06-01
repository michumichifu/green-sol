import Link from "next/link";
import { prisma } from "@/lib/db";
import {
  obtenerConfigSmtp,
  obtenerConfigApp,
  obtenerPlantillasGuardadas,
} from "@/lib/config";
import { EVENTOS_NOTIFICACION } from "@/lib/correo/catalogo";
import { obtenerRestriccionesTexto } from "@/lib/restricciones";
import { METODO_LABEL } from "@/lib/monedas";
import {
  cambiarRol,
  guardarAppConfig,
  guardarRestricciones,
} from "./actions";
import { PanelTabs } from "@/components/panel-tabs";
import { FormSmtp } from "@/components/form-smtp";
import { EditorPlantillas } from "@/components/editor-plantillas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const ROLES = ["usuario", "admin_grupo", "super_admin"];
const METODO_RECOLECTA_LABEL: Record<string, string> = {
  tradicional: "Tradicional",
  cripto: "Cripto",
};

function fmt(n: number) {
  return n.toLocaleString("es-VE", { maximumFractionDigits: 2 });
}

function Stat({ label, valor }: { label: string; valor: string | number }) {
  return (
    <div className="min-w-0 rounded-xl border bg-card p-3">
      <p className="truncate text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 truncate text-2xl font-bold tabular-nums">{valor}</p>
    </div>
  );
}

function ListaConteo({
  titulo,
  datos,
}: {
  titulo: string;
  datos: { label: string; valor: number }[];
}) {
  const orden = [...datos].sort((a, b) => b.valor - a.valor);
  const max = Math.max(1, ...orden.map((d) => d.valor));
  return (
    <div className="rounded-xl border bg-card p-4">
      <h3 className="mb-3 text-sm font-semibold">{titulo}</h3>
      {orden.length === 0 ? (
        <p className="text-xs text-muted-foreground">Sin datos todavía.</p>
      ) : (
        <ul className="space-y-2">
          {orden.map((d) => (
            <li key={d.label} className="text-sm">
              <div className="mb-1 flex items-center justify-between">
                <span>{d.label}</span>
                <span className="font-semibold">{d.valor}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-brand"
                  style={{ width: `${(d.valor / max) * 100}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default async function AdminPage() {
  const ahora = new Date();
  const inicioHoy = new Date(
    ahora.getFullYear(),
    ahora.getMonth(),
    ahora.getDate(),
  );
  const inicioAyer = new Date(inicioHoy.getTime() - 86_400_000);
  const hace7 = new Date(inicioHoy.getTime() - 7 * 86_400_000);
  const hace30 = new Date(inicioHoy.getTime() - 30 * 86_400_000);

  const [
    totalUsuarios,
    verificados,
    nuevosHoy,
    nuevosAyer,
    nuevos7,
    nuevos30,
    totalRecolectas,
    sanesActivos,
    vacasActivas,
    abiertas,
    cerradas,
    aportesConf,
    montoConf,
    porMoneda,
    porMetodo,
    porMetodoPago,
    usuarios,
    smtp,
    app,
  ] = await Promise.all([
    prisma.usuario.count(),
    prisma.usuario.count({ where: { correoVerificado: true } }),
    prisma.usuario.count({ where: { creadoEn: { gte: inicioHoy } } }),
    prisma.usuario.count({
      where: { creadoEn: { gte: inicioAyer, lt: inicioHoy } },
    }),
    prisma.usuario.count({ where: { creadoEn: { gte: hace7 } } }),
    prisma.usuario.count({ where: { creadoEn: { gte: hace30 } } }),
    prisma.recolecta.count(),
    prisma.recolecta.count({ where: { tipo: "san", estado: "activa" } }),
    prisma.recolecta.count({ where: { tipo: "vaca", estado: "activa" } }),
    prisma.recolecta.count({ where: { estado: "abierta" } }),
    prisma.recolecta.count({ where: { estado: "cerrada" } }),
    prisma.aporte.count({ where: { estado: "confirmado" } }),
    prisma.aporte.aggregate({
      _sum: { monto: true },
      where: { estado: "confirmado" },
    }),
    prisma.recolecta.groupBy({ by: ["moneda"], _count: { _all: true } }),
    prisma.recolecta.groupBy({ by: ["metodo"], _count: { _all: true } }),
    prisma.metodoPago.groupBy({ by: ["metodo"], _count: { _all: true } }),
    prisma.usuario.findMany({ orderBy: { creadoEn: "desc" }, take: 100 }),
    obtenerConfigSmtp(),
    obtenerConfigApp(),
  ]);
  const restricciones = await obtenerRestriccionesTexto();
  const plantillas = await obtenerPlantillasGuardadas();

  return (
    <main className="mx-auto w-full max-w-3xl space-y-6 overflow-x-hidden px-4 pb-6 sm:px-6 pt-[max(2.75rem,calc(env(safe-area-inset-top)+1.5rem))]">
      <div className="flex items-center justify-between gap-3">
        <h1 className="min-w-0 truncate text-xl font-bold sm:text-2xl">
          Panel super-admin
        </h1>
        <Link
          href="/dashboard"
          className="shrink-0 text-sm text-brand underline"
        >
          Volver
        </Link>
      </div>

      <PanelTabs tabs={["Métricas", "Usuarios", "Configuración"]}>
        {/* Métricas */}
        <div className="space-y-6">
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground">
              Usuarios
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Stat label="Total" valor={totalUsuarios} />
              <Stat label="Verificados" valor={verificados} />
              <Stat label="Nuevos hoy" valor={nuevosHoy} />
              <Stat label="Ayer" valor={nuevosAyer} />
              <Stat label="Últimos 7 días" valor={nuevos7} />
              <Stat label="Últimos 30 días" valor={nuevos30} />
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground">
              Ahorros
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Stat label="Recolectas" valor={totalRecolectas} />
              <Stat label="Sanes activos" valor={sanesActivos} />
              <Stat label="Vacas activas" valor={vacasActivas} />
              <Stat label="Abiertas" valor={abiertas} />
              <Stat label="Cerradas" valor={cerradas} />
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground">
              Aportes confirmados
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <Stat label="Cantidad" valor={aportesConf} />
              <Stat label="Monto total" valor={fmt(montoConf._sum.monto ?? 0)} />
            </div>
            <p className="text-xs text-muted-foreground">
              El monto suma distintas monedas sin convertir (valor referencial).
            </p>
          </section>

          <div className="grid gap-4 sm:grid-cols-2">
            <ListaConteo
              titulo="Monedas más usadas"
              datos={porMoneda.map((m) => ({
                label: m.moneda,
                valor: m._count._all,
              }))}
            />
            <ListaConteo
              titulo="Método de recolecta"
              datos={porMetodo.map((m) => ({
                label: METODO_RECOLECTA_LABEL[m.metodo] ?? m.metodo,
                valor: m._count._all,
              }))}
            />
          </div>
          <ListaConteo
            titulo="Métodos de pago registrados"
            datos={porMetodoPago.map((m) => ({
              label: METODO_LABEL[m.metodo] ?? m.metodo,
              valor: m._count._all,
            }))}
          />
        </div>

        {/* Usuarios */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold">
            Gestión de usuarios ({usuarios.length})
          </h2>
          <ul className="space-y-2">
            {usuarios.map((u) => {
              const accion = cambiarRol.bind(null, u.id);
              return (
                <li key={u.id} className="rounded-xl border bg-card p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {u.nombreUsuario ?? u.nombre ?? "—"}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {u.correo}
                    </p>
                  </div>
                  <form
                    action={accion}
                    className="mt-2 flex items-center gap-2"
                  >
                    <select
                      name="rol"
                      defaultValue={u.rol}
                      className="flex-1 rounded-md border bg-background p-1.5 text-xs"
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

        {/* Configuración (subpestañas) */}
        <PanelTabs
          variante="sub"
          tabs={["General", "SMTP", "Plantillas", "Restricciones"]}
        >
          {/* General (configuración de la app) */}
          <section className="space-y-3">
            <h2 className="text-sm font-semibold">
              Configuración general de la app
            </h2>
            <p className="text-xs text-muted-foreground">
              Datos públicos de la aplicación (marca, contacto y metadatos).
            </p>
            <form action={guardarAppConfig} className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="APP_NOMBRE">Nombre de la app</Label>
                <Input
                  key={`nombre-${app.APP_NOMBRE ?? ""}`}
                  id="APP_NOMBRE"
                  name="APP_NOMBRE"
                  defaultValue={app.APP_NOMBRE ?? ""}
                  placeholder="Green Sol"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="APP_DESCRIPCION">Descripción</Label>
                <textarea
                  id="APP_DESCRIPCION"
                  name="APP_DESCRIPCION"
                  defaultValue={app.APP_DESCRIPCION ?? ""}
                  rows={2}
                  className="w-full rounded-md border bg-background p-2 text-sm"
                  placeholder="Ahorra solo o en grupo, claro y transparente."
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="APP_CORREO_CONTACTO">Correo de contacto</Label>
                <Input
                  key={`correo-${app.APP_CORREO_CONTACTO ?? ""}`}
                  id="APP_CORREO_CONTACTO"
                  name="APP_CORREO_CONTACTO"
                  type="email"
                  defaultValue={app.APP_CORREO_CONTACTO ?? ""}
                  placeholder="hola@greensol.app"
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="APP_LOGO_URL">URL del logo</Label>
                  <Input
                    key={`logo-${app.APP_LOGO_URL ?? ""}`}
                    id="APP_LOGO_URL"
                    name="APP_LOGO_URL"
                    defaultValue={app.APP_LOGO_URL ?? ""}
                    placeholder="/green-sol-logo.svg"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="APP_FAVICON_URL">URL del favicon</Label>
                  <Input
                    key={`favicon-${app.APP_FAVICON_URL ?? ""}`}
                    id="APP_FAVICON_URL"
                    name="APP_FAVICON_URL"
                    defaultValue={app.APP_FAVICON_URL ?? ""}
                    placeholder="/favicon.ico"
                  />
                </div>
              </div>
              <Button type="submit" variant="outline">
                Guardar configuración
              </Button>
            </form>
          </section>

          {/* SMTP */}
          <FormSmtp smtp={smtp} />

          {/* Plantillas de correo */}
          <EditorPlantillas eventos={EVENTOS_NOTIFICACION} overrides={plantillas} />

          {/* Restricciones */}
          <section className="space-y-3">
            <h2 className="text-sm font-semibold">Restricciones de palabras</h2>
            <p className="text-xs text-muted-foreground">
              Palabras separadas por coma. Se bloquean en cuentas de usuario (tú,
              como super-admin, quedas exento).
            </p>
            <form action={guardarRestricciones} className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="r_nombre">Nombre</Label>
                <textarea
                  id="r_nombre"
                  name="nombre"
                  rows={2}
                  defaultValue={restricciones.nombre}
                  className="w-full rounded-md border bg-background p-2 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="r_apellido">Apellido</Label>
                <textarea
                  id="r_apellido"
                  name="apellido"
                  rows={2}
                  defaultValue={restricciones.apellido}
                  className="w-full rounded-md border bg-background p-2 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="r_usuario">Nombre de usuario</Label>
                <textarea
                  id="r_usuario"
                  name="nombreUsuario"
                  rows={2}
                  defaultValue={restricciones.nombreUsuario}
                  className="w-full rounded-md border bg-background p-2 text-sm"
                />
              </div>
              <Button type="submit" variant="outline">
                Guardar restricciones
              </Button>
            </form>
          </section>
        </PanelTabs>
      </PanelTabs>
    </main>
  );
}
