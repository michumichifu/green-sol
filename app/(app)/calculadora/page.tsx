import { obtenerTasas } from "@/lib/rates/cache";
import { Calculadora } from "@/components/calculadora";

export default async function CalculadoraPage() {
  const tasas = await obtenerTasas();
  return (
    <main className="mx-auto max-w-md space-y-6 px-6 py-8">
      <h1 className="text-2xl font-bold">Calculadora</h1>
      <p className="text-sm text-muted-foreground">
        Convierte entre bolívares (BCV/USDT), USDC y SOL con las tasas del día.
      </p>
      <Calculadora tasas={tasas} />
    </main>
  );
}
