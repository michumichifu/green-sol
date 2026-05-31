"use client";

import { useActionState, useEffect, useState } from "react";
import { Pencil } from "lucide-react";
import { toast } from "sonner";
import {
  editarMetodoPago,
  eliminarMetodoPago,
  type EstadoMetodo,
} from "@/app/(app)/perfil/actions";
import { METODO_LABEL, monedaFiat } from "@/lib/monedas";
import { BANCOS_VE } from "@/lib/bancos-venezuela";
import { SelectBanco } from "@/components/select-banco";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type MetodoCompleto = {
  id: string;
  categoria: string;
  moneda: string;
  metodo: string;
  alias: string | null;
  titular: string | null;
  cedula: string | null;
  banco: string | null;
  tipoCuenta: string | null;
  numeroCuenta: string | null;
  telefono: string | null;
  email: string | null;
  wallet: string | null;
};

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

export function MetodoPagoItem({ m }: { m: MetodoCompleto }) {
  const [editando, setEditando] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  const [claveEdit, setClaveEdit] = useState("");
  const [claveDel, setClaveDel] = useState("");
  const [estado, accion, pendiente] = useActionState<EstadoMetodo, FormData>(
    editarMetodoPago,
    {},
  );
  const [estadoDel, accionDel, pendienteDel] = useActionState<
    EstadoMetodo,
    FormData
  >(eliminarMetodoPago, {});

  const [alias, setAlias] = useState(m.alias ?? "");
  const [titular, setTitular] = useState(m.titular ?? "");
  const [cedula, setCedula] = useState(m.cedula ?? "");
  const [banco, setBanco] = useState(m.banco ?? "");
  const [tipoCuenta, setTipoCuenta] = useState(m.tipoCuenta ?? "");
  const [numeroCuenta, setNumeroCuenta] = useState(m.numeroCuenta ?? "");
  const [telefono, setTelefono] = useState(m.telefono ?? "");
  const [email, setEmail] = useState(m.email ?? "");
  const [wallet, setWallet] = useState(m.wallet ?? "");

  useEffect(() => {
    if (estado.ok) {
      toast.success("Método actualizado");
      setEditando(false);
      setClaveEdit("");
    } else if (estado.error) {
      toast.error(estado.error);
    }
  }, [estado]);

  useEffect(() => {
    if (estadoDel.ok) toast.success("Método eliminado");
    else if (estadoDel.error) toast.error(estadoDel.error);
  }, [estadoDel]);

  const esVE = m.moneda === "VES";
  const esCripto = m.categoria === "cripto";
  const monedaTxt = esCripto
    ? m.moneda
    : (monedaFiat(m.moneda)?.nombre ?? m.moneda);
  const resumen = [
    m.alias,
    m.banco
      ? (BANCOS_VE.find((b) => b.codigo === m.banco)?.nombre ?? m.banco)
      : null,
    m.numeroCuenta,
    m.telefono,
    m.email,
    m.wallet ? `${m.wallet.slice(0, 6)}…${m.wallet.slice(-4)}` : null,
    m.titular,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <li className="rounded-lg border bg-card px-3 py-2">
      <div className="flex items-center justify-between gap-2">
        <span className="min-w-0">
          <span className="block text-sm font-medium">
            {METODO_LABEL[m.metodo] ?? m.metodo} · {monedaTxt}
          </span>
          <span className="block truncate text-xs text-muted-foreground">
            {resumen}
          </span>
        </span>
        <div className="flex shrink-0 items-center gap-1">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => {
              setEditando((v) => !v);
              setEliminando(false);
            }}
            aria-label="Editar"
          >
            <Pencil className="size-4" />
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => {
              setEliminando((v) => !v);
              setEditando(false);
            }}
          >
            Quitar
          </Button>
        </div>
      </div>

      {eliminando && (
        <form action={accionDel} className="mt-3 space-y-2.5 border-t pt-3">
          <input type="hidden" name="id" value={m.id} />
          <p className="text-sm">
            ¿Eliminar este método? Confirma con tu clave.
          </p>
          <Input
            type="password"
            name="clave"
            value={claveDel}
            onChange={(e) => setClaveDel(e.target.value)}
            placeholder="Tu clave de la cuenta"
            autoComplete="current-password"
          />
          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              className="flex-1"
              onClick={() => setEliminando(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="destructive"
              className="flex-1"
              disabled={claveDel.trim().length === 0 || pendienteDel}
            >
              {pendienteDel ? "Eliminando..." : "Eliminar"}
            </Button>
          </div>
        </form>
      )}

      {editando && (
        <form action={accion} className="mt-3 space-y-2.5 border-t pt-3">
          <input type="hidden" name="id" value={m.id} />
          <input type="hidden" name="banco" value={banco} />
          <input type="hidden" name="tipoCuenta" value={tipoCuenta} />
          <input type="hidden" name="titular" value={titular} />
          <input type="hidden" name="cedula" value={cedula} />
          <input type="hidden" name="numeroCuenta" value={numeroCuenta} />
          <input type="hidden" name="telefono" value={telefono} />
          <input type="hidden" name="email" value={email} />
          <input type="hidden" name="wallet" value={wallet} />
          <input type="hidden" name="alias" value={alias} />

          {esCripto ? (
            <Campo label="Dirección de wallet">
              <Input value={wallet} onChange={(e) => setWallet(e.target.value)} />
            </Campo>
          ) : (
            <>
              {m.banco !== null &&
                (esVE ? (
                  <Campo label="Banco">
                    <SelectBanco value={banco} onChange={setBanco} />
                  </Campo>
                ) : (
                  <Campo label="Banco">
                    <Input
                      value={banco}
                      onChange={(e) => setBanco(e.target.value)}
                    />
                  </Campo>
                ))}
              {m.tipoCuenta !== null && (
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
              {m.numeroCuenta !== null && (
                <Campo label="Número de cuenta">
                  <Input
                    value={numeroCuenta}
                    onChange={(e) => setNumeroCuenta(e.target.value)}
                    inputMode="numeric"
                  />
                </Campo>
              )}
              {m.telefono !== null && (
                <Campo label="Teléfono">
                  <Input
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    inputMode="tel"
                  />
                </Campo>
              )}
              {m.email !== null && (
                <Campo label="Email o teléfono">
                  <Input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </Campo>
              )}
              {m.titular !== null && (
                <Campo label="Titular (nombre y apellido)">
                  <Input
                    value={titular}
                    onChange={(e) => setTitular(e.target.value)}
                  />
                </Campo>
              )}
              {m.cedula !== null && (
                <Campo label="Cédula">
                  <Input
                    value={cedula}
                    onChange={(e) => setCedula(e.target.value)}
                  />
                </Campo>
              )}
            </>
          )}

          <Campo label="Alias">
            <Input value={alias} onChange={(e) => setAlias(e.target.value)} />
          </Campo>

          <Campo label="Confirma con tu clave">
            <Input
              type="password"
              name="clave"
              value={claveEdit}
              onChange={(e) => setClaveEdit(e.target.value)}
              autoComplete="current-password"
            />
          </Campo>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              className="flex-1"
              onClick={() => setEditando(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="secondary"
              className="flex-1"
              disabled={claveEdit.trim().length === 0 || pendiente}
            >
              {pendiente ? "Guardando..." : "Guardar cambios"}
            </Button>
          </div>
        </form>
      )}
    </li>
  );
}
