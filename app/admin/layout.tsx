import { notFound } from "next/navigation";
import { obtenerUsuario } from "@/lib/auth/session";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const usuario = await obtenerUsuario();
  if (!usuario || usuario.rol !== "super_admin") notFound();
  return <div className="flex min-w-0 flex-1 flex-col">{children}</div>;
}
