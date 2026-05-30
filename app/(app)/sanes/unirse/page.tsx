import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { UnirseAhorro } from "@/components/unirse-ahorro";

export default async function UnirsePage({
  searchParams,
}: {
  searchParams: Promise<{ codigo?: string }>;
}) {
  const { codigo } = await searchParams;

  return (
    <main className="mx-auto max-w-md space-y-4 px-5 py-5">
      <Link
        href="/sanes"
        className="flex items-center gap-1.5 text-sm text-muted-foreground"
      >
        <ArrowLeft className="size-4" /> Ahorros
      </Link>
      <div>
        <h1 className="text-xl font-bold">Unirme a un ahorro</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pega el enlace o el código que te compartieron y únete.
        </p>
      </div>
      <UnirseAhorro codigoInicial={codigo ?? ""} />
    </main>
  );
}
