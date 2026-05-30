import { obtenerTasas } from "@/lib/rates/cache";

function fmt(n: number) {
  return n.toLocaleString("es-VE", { maximumFractionDigits: 2 });
}

function Tasa({
  label,
  valor,
  sub,
}: {
  label: string;
  valor: string;
  sub: string;
}) {
  return (
    <div className="rounded-lg border bg-card p-2">
      <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        {label} / {sub}
      </div>
      <div className="text-sm font-semibold text-foreground">{valor}</div>
    </div>
  );
}

export async function TasasResumen() {
  const t = await obtenerTasas();
  return (
    <div className="grid grid-cols-3 gap-2 text-center text-xs">
      <Tasa label="BCV" valor={t.bcv ? `Bs ${fmt(t.bcv.usd)}` : "—"} sub="USD" />
      <Tasa
        label="USDT"
        valor={t.usdt ? `Bs ${fmt(t.usdt.promedio)}` : "—"}
        sub="promedio"
      />
      <Tasa label="SOL" valor={t.sol ? `$${fmt(t.sol.usd)}` : "—"} sub="USD" />
    </div>
  );
}
