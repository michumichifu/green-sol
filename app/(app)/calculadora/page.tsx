import { obtenerTasas } from "@/lib/rates/cache";
import { Calculadora } from "@/components/calculadora";

export default async function CalculadoraPage() {
  const tasas = await obtenerTasas();
  return (
    <main className="mx-auto max-w-md space-y-5 px-5 py-6">
      <h1 className="text-xl font-bold">Calculadora</h1>
      <p className="text-sm text-muted-foreground">
        Elige la moneda y el monto; abajo verás la conversión con las tasas de
        hoy.
      </p>
      <Calculadora tasas={tasas} />
    </main>
  );
}
