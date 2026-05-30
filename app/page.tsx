import Link from "next/link";
import { Sun } from "lucide-react";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-brand text-white shadow-lg shadow-brand/30">
        <Sun className="size-8" strokeWidth={2} />
      </div>
      <div className="space-y-3">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Green Sol
        </h1>
        <p className="mx-auto max-w-md text-lg text-muted-foreground">
          Tu ahorro en grupo —san, bolso, vaca— transparente y con control, al
          mundo cripto sobre Solana.
        </p>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Link
          href="/registro"
          className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          Crear cuenta
        </Link>
        <Link href="/login" className="text-sm text-brand underline">
          Ya tengo cuenta
        </Link>
      </div>
      <p className="text-sm text-muted-foreground">
        Solana Vibe Bootcamp · Venezuela
      </p>
    </main>
  );
}
