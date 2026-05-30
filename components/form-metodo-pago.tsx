"use client";

import { useState } from "react";
import { ShieldAlert, Wallet, Plus, Banknote, Search } from "lucide-react";
import { agregarMetodoPago } from "@/app/(app)/perfil/actions";
import {
  MONEDAS_FIAT,
  METODOS_POR_MONEDA,
  METODOS_GENERICOS,
  CRIPTO_OPCIONES,
} from "@/lib/monedas";
import { SelectBanco } from "@/components/select-banco";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function FormMetodoPago() {
  const [categoria, setCategoria] = useState("");
  const [moneda, setMoneda] = useState("");
  const [metodo, setMetodo] = useState("");
  const [q, setQ] = useState("");
  const [alias, setAlias] = useState("");
  const [titular, setTitular] = useState("");
  const [cedula, setCedula] = useState("");
  const [banco, setBanco] = useState("");
  const [tipoCuenta, setTipoCuenta] = useState("");
  const [numeroCuenta, setNumeroCuenta] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [wallet, setWallet] = useState("");
  const [detalle, setDetalle] = useState("");

  const esVE = moneda === "VES";
  const esCripto = categoria === "cripto";
  const metodos =
    categoria === "fiat"
      ? (METODOS_POR_MONEDA[moneda] ?? METODOS_GENERICOS)
      : [];

  const t = q.trim().toLowerCase();
  const monedasFiltradas = MONEDAS_FIAT.filter(
    (m) =>
      !t ||
      m.prefijo.toLowerCase().includes(t) ||
      m.nombre.toLowerCase().includes(t) ||
      m.pais.toLowerCase().includes(t) ||
      m.codigo.toLowerCase().includes(t),
  );

  function elegirCategoria(c: string) {
    setCategoria(c);
    setMoneda("");
    setMetodo("");
  }
  function elegirCripto(id: string) {
    setMetodo(id);
    setMoneda(id === "usdc" ? "USDC" : "SOL");
  }

  const puedeAgregar = esCripto
    ? !!metodo && wallet.trim().length > 0
    : !!moneda && !!metodo && titular.trim().length > 0;

  return (
    <div className="space-y-3">
      <div className="flex gap-2 rounded-xl border border-gold/40 bg-gold/5 p-3 text-xs">
        <ShieldAlert className="size-4 shrink-0 text-gold" />
        <span>
          <b>Prohibido</b> usar datos de terceros o de empresas. Deben ser{" "}
          <b>tuyos</b> (titular, persona natural).
        </span>
      </div>

      {/* Categoría */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => elegirCategoria("fiat")}
          className={cn(
            "flex items-center justify-center gap-2 rounded-xl border p-3 text-sm transition-colors",
            categoria === "fiat"
              ? "border-brand bg-brand/5 text-brand"
              : "hover:border-brand/40",
          )}
        >
          <Banknote className="size-4" /> Fiat
        </button>
        <button
          type="button"
          onClick={() => elegirCategoria("cripto")}
          className={cn(
            "flex items-center justify-center gap-2 rounded-xl border p-3 text-sm transition-colors",
            categoria === "cripto"
              ? "border-brand bg-brand/5 text-brand"
              : "hover:border-brand/40",
          )}
        >
          <Wallet className="size-4" /> Cripto
        </button>
      </div>

      {/* Fiat → moneda */}
      {categoria === "fiat" && !moneda && (
        <div className="space-y-2 rounded-xl border p-3">
          <p className="text-sm font-medium">Elige la moneda</p>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Busca por moneda o país"
              className="pl-8"
            />
          </div>
          <ul className="max-h-48 space-y-0.5 overflow-y-auto">
            {monedasFiltradas.map((m) => (
              <li key={m.codigo}>
                <button
                  type="button"
                  onClick={() => {
                    setMoneda(m.codigo);
                    setMetodo("");
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm hover:bg-muted"
                >
                  <span className="font-mono text-xs text-muted-foreground">
                    {m.prefijo}
                  </span>
                  <span className="flex-1">
                    {m.nombre} · {m.pais}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Fiat → método */}
      {categoria === "fiat" && moneda && (
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => {
              setMoneda("");
              setMetodo("");
            }}
            className="text-xs text-brand"
          >
            ← Cambiar moneda ({moneda})
          </button>
          <div className="flex flex-wrap gap-2">
            {metodos.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMetodo(m.id)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-sm transition-colors",
                  metodo === m.id
                    ? "border-brand bg-brand/5 text-brand"
                    : "hover:border-brand/40",
                )}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Cripto → moneda/método */}
      {esCripto && (
        <div className="flex gap-2">
          {CRIPTO_OPCIONES.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => elegirCripto(c.id)}
              className={cn(
                "flex-1 rounded-xl border p-3 text-sm transition-colors",
                metodo === c.id
                  ? "border-brand bg-brand/5 text-brand"
                  : "hover:border-brand/40",
              )}
            >
              {c.label}
            </button>
          ))}
        </div>
      )}

      {/* Campos del método */}
      {(esCripto ? metodo : moneda && metodo) && (
        <form action={agregarMetodoPago} className="space-y-2.5">
          <input type="hidden" name="categoria" value={categoria} />
          <input type="hidden" name="moneda" value={moneda} />
          <input type="hidden" name="metodo" value={metodo} />
          <input type="hidden" name="banco" value={banco} />
          <input type="hidden" name="tipoCuenta" value={tipoCuenta} />
          <input type="hidden" name="alias" value={alias} />
          <input type="hidden" name="titular" value={titular} />
          <input type="hidden" name="cedula" value={cedula} />
          <input type="hidden" name="numeroCuenta" value={numeroCuenta} />
          <input type="hidden" name="telefono" value={telefono} />
          <input type="hidden" name="email" value={email} />
          <input type="hidden" name="wallet" value={wallet} />
          <input type="hidden" name="detalle" value={detalle} />

          {esCripto ? (
            <>
              <Input
                value={wallet}
                onChange={(e) => setWallet(e.target.value)}
                placeholder="Dirección de tu wallet (Solana)"
              />
              <Input
                value={alias}
                onChange={(e) => setAlias(e.target.value)}
                placeholder="Alias (ej. Mi wallet Phantom)"
              />
              <p className="text-xs text-muted-foreground">
                Wallet externa. La principal la entrega la app (próximamente).
              </p>
            </>
          ) : (
            <>
              {(metodo === "transferencia" || metodo === "pago_movil") &&
                esVE && <SelectBanco value={banco} onChange={setBanco} />}
              {(metodo === "transferencia" || metodo === "banco") && !esVE && (
                <Input
                  value={banco}
                  onChange={(e) => setBanco(e.target.value)}
                  placeholder="Banco"
                />
              )}
              {metodo === "transferencia" && (
                <div className="grid grid-cols-2 gap-2">
                  {(["corriente", "ahorro"] as const).map((tc) => (
                    <button
                      key={tc}
                      type="button"
                      onClick={() => setTipoCuenta(tc)}
                      className={cn(
                        "rounded-lg border p-2 text-sm capitalize transition-colors",
                        tipoCuenta === tc
                          ? "border-brand bg-brand/5 text-brand"
                          : "hover:border-brand/40",
                      )}
                    >
                      {tc}
                    </button>
                  ))}
                </div>
              )}
              {(metodo === "transferencia" || metodo === "banco") && (
                <Input
                  value={numeroCuenta}
                  onChange={(e) => setNumeroCuenta(e.target.value)}
                  placeholder="Número de cuenta"
                  inputMode="numeric"
                />
              )}
              {(metodo === "zelle" || metodo === "zinli") && (
                <Input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={metodo === "zelle" ? "Email/teléfono de Zelle" : "Email/teléfono de Zinli"}
                />
              )}
              {(metodo === "pago_movil" || metodo === "walytech") && (
                <Input
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  placeholder="Teléfono"
                  inputMode="tel"
                />
              )}
              <Input
                value={titular}
                onChange={(e) => setTitular(e.target.value)}
                placeholder="Nombre y apellido del titular"
              />
              {esVE && (
                <Input
                  value={cedula}
                  onChange={(e) => setCedula(e.target.value)}
                  placeholder="Cédula del titular"
                  inputMode="numeric"
                />
              )}
              {metodo === "efectivo" && (
                <Input
                  value={detalle}
                  onChange={(e) => setDetalle(e.target.value)}
                  placeholder="Nota (dónde/cómo entregar)"
                />
              )}
              <Input
                value={alias}
                onChange={(e) => setAlias(e.target.value)}
                placeholder="Alias (opcional)"
              />
            </>
          )}

          <Button
            type="submit"
            variant="outline"
            className="w-full"
            disabled={!puedeAgregar}
          >
            <Plus className="size-4" /> Agregar método
          </Button>
        </form>
      )}
    </div>
  );
}
