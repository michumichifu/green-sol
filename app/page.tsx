import { Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-brand text-white shadow-lg shadow-brand/30">
        <Sun className="size-8" strokeWidth={2} />
      </div>
      <div className="space-y-3">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Green Sol</h1>
        <p className="mx-auto max-w-md text-lg text-muted-foreground">
          Tu ahorro en grupo —san, bolso, vaca— transparente y con control, al
          mundo cripto sobre Solana.
        </p>
      </div>
      <Button size="lg">Entrar</Button>
      <p className="text-sm text-muted-foreground">
        Solana Vibe Bootcamp · Venezuela
      </p>
    </main>
  );
}
