import { redirect } from "next/navigation";
import { obtenerUsuario } from "@/lib/auth/session";
import { BottomNav } from "@/components/bottom-nav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const usuario = await obtenerUsuario();
  if (!usuario) redirect("/login");

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex-1 pb-16">{children}</div>
      <BottomNav />
    </div>
  );
}
