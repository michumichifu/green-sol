import Link from "next/link";
import { prisma } from "@/lib/db";
import { obtenerUsuario } from "@/lib/auth/session";

export default async function SanesPage() {
  const usuario = await obtenerUsuario();
  const recolectas = await prisma.recolecta.findMany({
    where: { participantes: { some: { usuarioId: usuario!.id } } },
    include: { _count: { select: { participantes: true } } },
    orderBy: { creadaEn: "desc" },
  });

  return (
    <main className="mx-auto max-w-md space-y-4 px-6 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Sanes y vacas</h1>
        <Link
          href="/sanes/crear"
          className="inline-flex items-center rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground"
        >
          Crear
        </Link>
      </div>
      {recolectas.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Aún no participas en ninguna. Crea la primera.
        </p>
      )}
      <ul className="space-y-2">
        {recolectas.map((r) => (
          <li key={r.id}>
            <Link
              href={`/sanes/${r.id}`}
              className="block rounded-xl border bg-card p-4"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold">{r.nombre}</span>
                <span className="text-xs uppercase text-brand">{r.tipo}</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {r._count.participantes} participante(s) · {r.estado}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
