import { Star } from "lucide-react";
import { prisma } from "@/lib/db";
import { obtenerUsuario } from "@/lib/auth/session";
import { obtenerReputacion } from "@/lib/reputacion";
import {
  actualizarPerfil,
  agregarMetodoPago,
  eliminarMetodoPago,
} from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const TIPOS_PAGO = [
  { id: "efectivo", label: "Efectivo (USD)" },
  { id: "transferencia_bs", label: "Transferencia (Bs)" },
  { id: "pago_movil", label: "Pago móvil" },
  { id: "wallet_usdt", label: "Wallet USDT" },
  { id: "wallet_solana", label: "Wallet Solana" },
];

export default async function PerfilPage() {
  const sesion = await obtenerUsuario();
  const usuario = await prisma.usuario.findUnique({
    where: { id: sesion!.id },
    include: { metodosPago: true },
  });
  const rep = await obtenerReputacion(usuario!.id);
  const llenas = Math.round(rep.estrellas);

  return (
    <main className="mx-auto max-w-md space-y-6 px-6 py-8">
      <h1 className="text-2xl font-bold">Perfil</h1>

      <div className="flex items-center gap-3 rounded-xl border bg-card p-4">
        <div className="flex">
          {[1, 2, 3, 4, 5].map((i) => (
            <Star
              key={i}
              className="size-5"
              style={{ color: i <= llenas ? "var(--gold)" : "var(--border)" }}
              fill={i <= llenas ? "currentColor" : "none"}
            />
          ))}
        </div>
        <span className="text-sm text-muted-foreground">
          {rep.estrellas} · {rep.positivos} positivos / {rep.negativos} negativos
        </span>
      </div>

      <form action={actualizarPerfil} className="space-y-3">
        <h2 className="font-semibold">Datos</h2>
        <div className="space-y-1">
          <Label>Correo</Label>
          <Input defaultValue={usuario!.correo} disabled />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label htmlFor="nombre">Nombre</Label>
            <Input id="nombre" name="nombre" defaultValue={usuario!.nombre ?? ""} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="apellido">Apellido</Label>
            <Input
              id="apellido"
              name="apellido"
              defaultValue={usuario!.apellido ?? ""}
            />
          </div>
        </div>
        <div className="space-y-1">
          <Label htmlFor="nombreUsuario">Nombre de usuario</Label>
          <Input
            id="nombreUsuario"
            name="nombreUsuario"
            defaultValue={usuario!.nombreUsuario ?? ""}
          />
        </div>
        <Button type="submit" variant="outline">
          Guardar
        </Button>
      </form>

      <section className="space-y-3">
        <h2 className="font-semibold">Datos de pago</h2>
        <ul className="space-y-1 text-sm">
          {usuario!.metodosPago.map((m) => {
            const eliminar = eliminarMetodoPago.bind(null, m.id);
            return (
              <li
                key={m.id}
                className="flex items-center justify-between rounded-lg border bg-card px-3 py-2"
              >
                <span>
                  {m.tipo}: {m.detalle}
                </span>
                <form action={eliminar}>
                  <Button type="submit" size="sm" variant="ghost">
                    Quitar
                  </Button>
                </form>
              </li>
            );
          })}
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
    </main>
  );
}
