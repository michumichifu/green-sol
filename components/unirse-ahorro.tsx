"use client";

import { useEffect, useState } from "react";
import { Search, Users, PiggyBank, LogIn } from "lucide-react";
import {
  buscarRecolecta,
  unirseARecolecta,
  type ResultadoBusqueda,
} from "@/app/(app)/sanes/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function UnirseAhorro({ codigoInicial }: { codigoInicial: string }) {
  const [codigo, setCodigo] = useState(codigoInicial);
  const [cargando, setCargando] = useState(false);
  const [uniendo, setUniendo] = useState(false);
  const [error, setError] = useState("");
  const [encontrada, setEncontrada] =
    useState<ResultadoBusqueda["recolecta"]>(undefined);

  async function buscar(valor: string) {
    if (!valor.trim()) return;
    setCargando(true);
    setError("");
    setEncontrada(undefined);
    const res = await buscarRecolecta(valor);
    if (res.ok && res.recolecta) setEncontrada(res.recolecta);
    else setError(res.error ?? "No se pudo buscar.");
    setCargando(false);
  }

  async function unirme() {
    setUniendo(true);
    setError("");
    const res = await unirseARecolecta(codigo);
    // Si tiene éxito, la acción redirige; solo llegamos aquí si hubo error.
    if (res?.error) {
      setError(res.error);
      setUniendo(false);
    }
  }

  // Si llegó con ?codigo=, busca automáticamente.
  useEffect(() => {
    if (codigoInicial.trim()) buscar(codigoInicial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const esSan = encontrada?.tipo === "san";

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="codigo" className="text-sm font-medium">
          Código o enlace de invitación
        </label>
        <div className="flex gap-2">
          <Input
            id="codigo"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            placeholder="Pega el código o el enlace"
            onKeyDown={(e) => e.key === "Enter" && buscar(codigo)}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => buscar(codigo)}
            disabled={cargando}
          >
            <Search className="size-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Te lo comparte quien organiza el ahorro.
        </p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {encontrada && (
        <div className="space-y-3 rounded-2xl border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <span
              className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${
                esSan ? "bg-brand/10 text-brand" : "bg-gold/15 text-gold"
              }`}
            >
              {esSan ? (
                <Users className="size-5" />
              ) : (
                <PiggyBank className="size-5" />
              )}
            </span>
            <div className="min-w-0">
              <p className="truncate font-semibold">{encontrada.nombre}</p>
              <p className="text-xs text-muted-foreground">
                {esSan ? "San · por turnos" : "Vaca · meta común"} ·{" "}
                {encontrada.miembros} miembro(s)
              </p>
              <p className="text-xs text-muted-foreground">
                Organiza: {encontrada.organizador}
              </p>
            </div>
          </div>

          {encontrada.yaUnido ? (
            <p className="text-sm text-brand">Ya participas en este ahorro.</p>
          ) : !encontrada.abierta ? (
            <p className="text-sm text-muted-foreground">
              Este ahorro ya no admite nuevos miembros.
            </p>
          ) : (
            <Button
              type="button"
              className="w-full"
              onClick={unirme}
              disabled={uniendo}
            >
              <LogIn className="size-4" />{" "}
              {uniendo ? "Uniéndote..." : "Unirme a este ahorro"}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
