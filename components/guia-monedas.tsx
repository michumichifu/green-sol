import { Banknote, Wallet, Info } from "lucide-react";

type Opcion = {
  titulo: string;
  tipo: "fiat" | "cripto";
  descripcion: string;
};

const OPCIONES: Opcion[] = [
  {
    titulo: "Bolívares — dólar BCV",
    tipo: "fiat",
    descripcion:
      "Todo se maneja en bolívares, anclado a la tasa del dólar BCV del día. Tú, como organizador, cobras en bolívares y tus participantes pagan en bolívares, calculado con la tasa BCV de ese día.",
  },
  {
    titulo: "Bolívares — promedio (USDC)",
    tipo: "fiat",
    descripcion:
      "Igual que la anterior: cobran y pagan en bolívares. La diferencia es la tasa de cálculo: usa el promedio del USDC (el dólar del mercado), no el BCV.",
  },
  {
    titulo: "USDC (Solana)",
    tipo: "cripto",
    descripcion:
      "USDC es una moneda cripto con paridad 1 a 1 con el dólar: 1 USDC = 1 dólar. Perfecta para ahorrar en algo estable, equivalente al dólar. Se maneja solo por el sistema cripto, con la wallet que te damos: compras USDC en un exchange y lo retiras a tu dirección de Green Sol.",
  },
  {
    titulo: "SOL (Solana)",
    tipo: "cripto",
    descripcion:
      "SOL es la moneda propia de la red Solana (su precio sube y baja con el mercado). También se maneja solo por la wallet cripto que te entregamos.",
  },
];

function BadgeTipo({ tipo }: { tipo: "fiat" | "cripto" }) {
  if (tipo === "fiat") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-2.5 py-0.5 text-[11px] font-semibold text-sky-700 dark:bg-sky-900/30 dark:text-sky-300">
        <Banknote className="size-3" />
        Fiat
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-brand/10 px-2.5 py-0.5 text-[11px] font-semibold text-brand">
      <Wallet className="size-3" />
      Cripto
    </span>
  );
}

export function GuiaMonedas() {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold">¿En qué moneda ahorrar?</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Entiende la diferencia antes de elegir.
        </p>
      </div>

      {/* Fiat vs Cripto */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border bg-sky-50 p-4 dark:bg-sky-900/10">
          <div className="mb-2 flex items-center gap-2">
            <Banknote className="size-5 text-sky-600 dark:text-sky-400" />
            <span className="font-semibold text-sky-700 dark:text-sky-300">
              Fiat (tradicional)
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            El dinero de siempre, el que emiten los gobiernos: billetes y
            monedas de cada país (o su versión digital). Por ejemplo, el
            bolívar o el dólar físico. Es lo que mueves por banco, efectivo o
            pago móvil.
          </p>
        </div>

        <div className="rounded-2xl border bg-brand/5 p-4">
          <div className="mb-2 flex items-center gap-2">
            <Wallet className="size-5 text-brand" />
            <span className="font-semibold text-brand">Cripto</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Monedas digitales que viven en internet, en la red Solana,
            guardadas en una wallet (monedero digital) que Green Sol te
            entrega. No son billetes: las compras en un exchange (como
            Binance) y las retiras a la dirección que te damos. Tu ahorro
            queda respaldado en cripto, separado del sistema tradicional.
          </p>
        </div>
      </div>

      {/* Las 4 opciones */}
      <div className="space-y-3">
        <p className="text-sm font-medium">Las 4 opciones disponibles</p>
        {OPCIONES.map((op) => (
          <div
            key={op.titulo}
            className="rounded-2xl border bg-card p-4 shadow-sm"
          >
            <div className="mb-2 flex items-start justify-between gap-2">
              <span className="font-semibold leading-tight">{op.titulo}</span>
              <BadgeTipo tipo={op.tipo} />
            </div>
            <p className="text-sm text-muted-foreground">{op.descripcion}</p>
          </div>
        ))}
      </div>

      {/* Nota de cierre */}
      <div className="flex items-start gap-2.5 rounded-2xl border bg-muted/40 p-4">
        <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Las opciones en <b>Bolívares</b> se pagan con tu banco o efectivo.
          Las opciones <b>cripto</b> (USDC y SOL) se manejan solo con tu
          wallet de Green Sol — nada que ver con dólares físicos ni el banco.
        </p>
      </div>
    </div>
  );
}
