"use client";

import { useActionState, useEffect, useState } from "react";
import { ShieldAlert, Wallet, Banknote, Search } from "lucide-react";
import { toast } from "sonner";
import {
  agregarMetodoPago,
  type EstadoMetodo,
} from "@/app/(app)/perfil/actions";
import {
  MONEDAS_FIAT,
  MONEDAS_FIAT_FUTURAS,
  METODOS_POR_MONEDA,
  METODOS_GENERICOS,
  CRIPTO_OPCIONES,
} from "@/lib/monedas";
import { SelectBanco } from "@/components/select-banco";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function Campo({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-muted-foreground">
        {label}
      </label>
      {children}
    </div>
  );
}

export function FormMetodoPago() {
  const [estado, accion, pendiente] = useActionState<EstadoMetodo, FormData>(
    agregarMetodoPago,
    {},
  );

  const [categoria, setCategoria] = useState("");
  const [moneda, setMoneda] = useState("");
  const [metodo, setMetodo] = useState("");
  const [q, setQ] = useState("");
  const [alias, setAlias] = useState("");
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [cedulaPref, setCedulaPref] = useState("V");
  const [cedulaNum, setCedulaNum] = useState("");
  const [banco, setBanco] = useState("");
  const [tipoCuenta, setTipoCuenta] = useState("");
  const [numeroCuenta, setNumeroCuenta] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [wallet, setWallet] = useState("");
  const [detalle, setDetalle] = useState("");

  function limpiar() {
    setCategoria("");
    setMoneda("");
    setMetodo("");
    setQ("");
    setAlias("");
    setNombre("");
    setApellido("");
    setCedulaPref("V");
    setCedulaNum("");
    setBanco("");
    setTipoCuenta("");
    setNumeroCuenta("");
    setTelefono("");
    setEmail("");
    setWallet("");
    setDetalle("");
  }

  useEffect(() => {
    if (estado.ok) {
      toast.success("Método de pago agregado");
      limpiar();
    } else if (estado.error) {
      toast.error(estado.error);
    }
  }, [estado]);

  const esVE = moneda === "VES";
  const esCripto = categoria === "cripto";
  const metodos =
    categoria === "fiat"
      ? (METODOS_POR_MONEDA[moneda] ?? METODOS_GENERICOS)
      : [];

  const t = q.trim().toLowerCase();
  const coincide = (m: { prefijo: string; nombre: string; pais: string; codigo: string }) =>
    !t ||
    m.prefijo.toLowerCase().includes(t) ||
    m.nombre.toLowerCase().includes(t) ||
    m.pais.toLowerCase().includes(t) ||
    m.codigo.toLowerCase().includes(t);
  const fiatDisponibles = MONEDAS_FIAT.filter(coincide);
  const fiatFuturas = MONEDAS_FIAT_FUTURAS.filter(coincide);

  const titular = `${nombre} ${apellido}`.trim();
  const cedula = cedulaNum.trim() ? `${cedulaPref}-${cedulaNum.trim()}` : "";

  const puedeAgregar = esCripto
    ? !!metodo && wallet.trim().length > 0
    : !!moneda && !!metodo && nombre.trim().length > 0;

  const camposTitular = (
    <>
      <div className="grid grid-cols-2 gap-2">
        <Campo label="Nombre">
          <Input value={nombre} onChange={(e) => setNombre(e.target.value)} />
        </Campo>
        <Campo label="Apellido">
          <Input
            value={apellido}
            onChange={(e) => setApellido(e.target.value)}
          />
        </Campo>
      </div>
    </>
  );

  const campoCedula = (
    <Campo label="Cédula del titular">
      <div className="flex gap-2">
        <select
          value={cedulaPref}
          onChange={(e) => setCedulaPref(e.target.value)}
          className="h-8 w-16 rounded-lg border bg-transparent px-2 text-sm"
        >
          <option value="V">V</option>
          <option value="E">E</option>
        </select>
        <Input
          value={cedulaNum}
          onChange={(e) => setCedulaNum(e.target.value)}
          inputMode="numeric"
          placeholder="12345678"
          className="flex-1"
        />
      </div>
    </Campo>
  );

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
          onClick={() => {
            setCategoria("fiat");
            setMoneda("");
            setMetodo("");
          }}
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
          onClick={() => {
            setCategoria("cripto");
            setMoneda("");
            setMetodo("");
          }}
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
            {fiatDisponibles.map((m) => (
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
            {fiatFuturas.map((m) => (
              <li key={m.codigo}>
                <div
                  className="flex w-full cursor-not-allowed items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm opacity-50"
                  aria-disabled="true"
                  title="Disponible próximamente"
                >
                  <span className="font-mono text-xs text-muted-foreground">
                    {m.prefijo}
                  </span>
                  <span className="flex-1">
                    {m.nombre} · {m.pais}
                  </span>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase">
                    Pronto
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Fiat → método */}
      {categoria === "fiat" && moneda && (
        <div className="space-y-2">
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
              onClick={() => {
                setMetodo(c.id);
                setMoneda(c.id === "usdc" ? "USDC" : "SOL");
              }}
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
        <form action={accion} className="space-y-2.5 rounded-xl border p-3">
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
              <Campo label="Dirección de tu wallet (Solana)">
                <Input
                  value={wallet}
                  onChange={(e) => setWallet(e.target.value)}
                  placeholder="Dirección pública"
                />
              </Campo>
              <Campo label="Alias">
                <Input
                  value={alias}
                  onChange={(e) => setAlias(e.target.value)}
                  placeholder="Ej. Mi wallet Phantom"
                />
              </Campo>
              <p className="text-xs text-muted-foreground">
                Wallet externa. La principal la entrega la app (próximamente).
              </p>
            </>
          ) : (
            <>
              {(metodo === "transferencia" || metodo === "pago_movil") &&
                esVE && (
                  <Campo label="Banco">
                    <SelectBanco value={banco} onChange={setBanco} />
                  </Campo>
                )}
              {(metodo === "transferencia" || metodo === "banco") && !esVE && (
                <Campo label="Banco">
                  <Input
                    value={banco}
                    onChange={(e) => setBanco(e.target.value)}
                  />
                </Campo>
              )}
              {metodo === "transferencia" && (
                <Campo label="Tipo de cuenta">
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
                </Campo>
              )}
              {(metodo === "transferencia" || metodo === "banco") && (
                <Campo label="Número de cuenta">
                  <Input
                    value={numeroCuenta}
                    onChange={(e) => setNumeroCuenta(e.target.value)}
                    inputMode="numeric"
                  />
                </Campo>
              )}
              {(metodo === "zelle" || metodo === "zinli") && (
                <Campo label="Email o teléfono">
                  <Input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </Campo>
              )}

              {camposTitular}

              {/* Pago móvil: teléfono + cédula en una línea */}
              {metodo === "pago_movil" ? (
                <div className="grid grid-cols-2 gap-2">
                  <Campo label="Teléfono">
                    <Input
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value)}
                      inputMode="tel"
                      placeholder="04xx..."
                    />
                  </Campo>
                  {esVE && campoCedula}
                </div>
              ) : (
                <>
                  {metodo === "walytech" && (
                    <Campo label="Teléfono">
                      <Input
                        value={telefono}
                        onChange={(e) => setTelefono(e.target.value)}
                        inputMode="tel"
                      />
                    </Campo>
                  )}
                  {esVE && campoCedula}
                </>
              )}

              {metodo === "efectivo" && (
                <Campo label="Nota (dónde/cómo entregar)">
                  <Input
                    value={detalle}
                    onChange={(e) => setDetalle(e.target.value)}
                  />
                </Campo>
              )}

              <Campo label="Alias (opcional)">
                <Input
                  value={alias}
                  onChange={(e) => setAlias(e.target.value)}
                />
              </Campo>
            </>
          )}

          <Button
            type="submit"
            variant="secondary"
            className="w-full"
            disabled={!puedeAgregar || pendiente}
          >
            {pendiente ? "Guardando..." : "Confirmar método de pago"}
          </Button>
        </form>
      )}
    </div>
  );
}
