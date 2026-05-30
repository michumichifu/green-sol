import { obtenerTasas } from "@/lib/rates/cache";
import { Calculadora } from "@/components/calculadora";

export default async function CalculadoraPage() {
  const tasas = await obtenerTasas();
  return (
    <main className="mx-auto max-w-md space-y-4 px-5 py-5">
      <h1 className="text-xl font-bold">Calculadora</h1>
      <Calculadora tasas={tasas} />
    </main>
  );
}
