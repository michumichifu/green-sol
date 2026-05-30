import { redirect } from "next/navigation";
import { obtenerUsuario } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { BottomNav } from "@/components/bottom-nav";
import { AppHeader } from "@/components/app-header";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const usuario = await obtenerUsuario();
  if (!usuario) redirect("/login");

  const [notisRaw, noLeidas] = await Promise.all([
    prisma.notificacion.findMany({
      where: { usuarioId: usuario.id },
      orderBy: { creadaEn: "desc" },
      take: 8,
      select: { id: true, titulo: true, cuerpo: true, leida: true },
    }),
    prisma.notificacion.count({
      where: { usuarioId: usuario.id, leida: false },
    }),
  ]);

  return (
    <div className="flex h-dvh flex-col bg-muted/30">
      <AppHeader notis={notisRaw} noLeidas={noLeidas} />
      <div className="flex-1 overflow-y-auto">{children}</div>
      <BottomNav />
    </div>
  );
}
