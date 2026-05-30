"use client";

import { useActionState, useState } from "react";
import {
  RefreshCw,
  Target,
  Lock,
  Globe,
  ArrowLeft,
  ArrowRight,
  Check,
  Info,
  CalendarClock,
  Banknote,
  Smartphone,
  ShieldAlert,
  Wallet,
} from "lucide-react";
import { crearRecolecta, type EstadoRecolecta } from "../actions";
import {
  MONEDAS_RECOLECTA,
  MONEDA_RECOLECTA,
  FRECUENCIAS_PRESET,
} from "@/lib/validations/recolecta";
import { SelectBanco } from "@/components/select-banco";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const TOTAL = 7;

function fmt(n: number) {
  if (!isFinite(n)) return "0";
  return n.toLocaleString("es-VE", {
    maximumFractionDigits: n !== 0 && Math.abs(n) < 1 ? 4 : 2,
  });
}

export default function CrearPage() {
  const [estado, accion, pendiente] = useActionState<EstadoRecolecta, FormData>(
    crearRecolecta,
    {},
  );

  const [paso, setPaso] = useState(0);
  const [tipo, setTipo] = useState<"" | "san" | "vaca">("");
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [visibilidad, setVisibilidad] = useState<"privado" | "publico">(
    "privado",
  );
  const [moneda, setMoneda] = useState("");
  const [monto, setMonto] = useState(""); // san: meta por turno · vaca: meta a juntar
  const [cupo, setCupo] = useState("");
  const [frecId, setFrecId] = useState(""); // preset id o "personalizado"
  const [dias, setDias] = useState("");
  const [verTip, setVerTip] = useState(false);
  // Método de pago del organizador
  const [metodoPago, setMetodoPago] = useState("");
  const [banco, setBanco] = useState("");
  const [tipoCuenta, setTipoCuenta] = useState("");
  const [numeroCuenta, setNumeroCuenta] = useState("");
  const [titular, setTitular] = useState("");
  const [cedula, setCedula] = useState("");
  const [telefono, setTelefono] = useState("");
  const [wallet, setWallet] = useState("");

  const esSan = tipo === "san";
  const info = moneda ? MONEDA_RECOLECTA[moneda] : null;
  const ancla = info?.ancla ?? "";
  const esBolivares = !!info?.enBolivares;
  const esCripto = !!info && !info.enBolivares;

  const preset = FRECUENCIAS_PRESET.find((f) => f.id === frecId);
  const frecuenciaDias =
    frecId === "personalizado" ? Number(dias) || 0 : (preset?.dias ?? 0);
  const frecuenciaLabel =
    frecId === "personalizado"
      ? `Cada ${dias || "?"} días`
      : (preset?.label ?? "");

  const nParticipantes = Number(cupo) || 0;
  const aportePersona =
    nParticipantes > 0 ? Number(monto) / nParticipantes : 0;
  const duracionDias = nParticipantes * frecuenciaDias;
  const duracionSemanas = duracionDias > 0 ? Math.round(duracionDias / 7) : 0;

  const puedeSeguir = (() => {
    switch (paso) {
      case 0:
        return tipo !== "";
      case 1:
        return nombre.trim().length >= 2;
      case 2:
        return true;
      case 3:
        return moneda !== "";
      case 4:
        if (!(Number(monto) > 0)) return false;
        if (!esSan) return true;
        return nParticipantes >= 2 && frecuenciaDias >= 1;
      case 5:
        if (esCripto) return wallet.trim().length > 0;
        if (metodoPago === "transferencia")
          return (
            !!banco &&
            !!tipoCuenta &&
            numeroCuenta.trim().length > 0 &&
            titular.trim().length > 0 &&
            cedula.trim().length > 0
          );
        if (metodoPago === "pago_movil")
          return (
            !!banco &&
            titular.trim().length > 0 &&
            telefono.trim().length > 0 &&
            cedula.trim().length > 0
          );
        return false;
      default:
        return true;
    }
  })();

  return (
    <main className="mx-auto flex min-h-full max-w-md flex-col px-5 py-5">
      {/* Encabezado + progreso */}
      <div className="mb-5">
        <div className="flex items-center gap-3">
          {paso > 0 ? (
            <button
              type="button"
              onClick={() => setPaso((p) => p - 1)}
              aria-label="Atrás"
              className="text-muted-foreground"
            >
              <ArrowLeft className="size-5" />
            </button>
          ) : (
            <span className="w-5" />
          )}
          <h1 className="text-lg font-bold">Crear ahorro</h1>
          <span className="ml-auto text-xs text-muted-foreground">
            Paso {paso + 1} de {TOTAL}
          </span>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-brand transition-all"
            style={{ width: `${((paso + 1) / TOTAL) * 100}%` }}
          />
        </div>
      </div>

      <div className="flex flex-1 flex-col">
        <div className="flex-1 space-y-4">
          {/* Paso 0: tipo */}
          {paso === 0 && (
            <div className="space-y-3">
              <p className="text-sm font-medium">
                ¿Qué tipo de ahorro quieres crear?
              </p>
              <button
                type="button"
                onClick={() => setTipo("san")}
                className={cn(
                  "flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition-colors",
                  esSan ? "border-brand bg-brand/5" : "hover:border-brand/40",
                )}
              >
                <RefreshCw className="mt-0.5 size-5 shrink-0 text-brand" />
                <span>
                  <span className="block font-semibold">Susi · San · Bolso</span>
                  <span className="mt-1 inline-block rounded-full bg-brand/10 px-2 py-0.5 text-[11px] font-semibold text-brand">
                    Por turnos
                  </span>
                  <span className="mt-1.5 block text-xs text-muted-foreground">
                    Cada ronda todos aportan a la vez; lo que rota es el cobro:
                    por turno, a una persona le toca el bote completo.
                  </span>
                </span>
              </button>
              <button
                type="button"
                onClick={() => setTipo("vaca")}
                className={cn(
                  "flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition-colors",
                  tipo === "vaca"
                    ? "border-brand bg-brand/5"
                    : "hover:border-brand/40",
                )}
              >
                <Target className="mt-0.5 size-5 shrink-0 text-gold" />
                <span>
                  <span className="block font-semibold">Vaca · Pote</span>
                  <span className="mt-1 inline-block rounded-full bg-gold/15 px-2 py-0.5 text-[11px] font-semibold text-gold">
                    Meta en común
                  </span>
                  <span className="mt-1.5 block text-xs text-muted-foreground">
                    Aportan para reunir entre todas y lograr un objetivo o meta
                    común.
                  </span>
                </span>
              </button>
            </div>
          )}

          {/* Paso 1: título + descripción */}
          {paso === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="nombre-v" className="text-sm font-medium">
                  {esSan
                    ? "¿Qué título le quieres poner a tu san?"
                    : "¿Qué título le quieres poner a tu vaca?"}
                </label>
                <Input
                  id="nombre-v"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder={
                    esSan ? "Ej: San de la oficina" : "Ej: Viaje a la playa"
                  }
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="desc-v" className="text-sm font-medium">
                  Descripción{" "}
                  <span className="font-normal text-muted-foreground">
                    (opcional)
                  </span>
                </label>
                <textarea
                  id="desc-v"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  rows={3}
                  maxLength={300}
                  className="w-full rounded-lg border bg-transparent p-2.5 text-sm"
                  placeholder="Describe para qué lo van a usar, con qué finalidad, reglas que acordaron, etc."
                />
              </div>
            </div>
          )}

          {/* Paso 2: visibilidad */}
          {paso === 2 && (
            <div className="space-y-3">
              <p className="text-sm font-medium">¿Quién puede verlo?</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setVisibilidad("privado")}
                  className={cn(
                    "rounded-xl border p-3 text-sm transition-colors",
                    visibilidad === "privado"
                      ? "border-brand bg-brand/5 text-brand"
                      : "hover:border-brand/40",
                  )}
                >
                  <Lock className="mx-auto mb-1 size-5" />
                  Privado
                  <span className="mt-1 block text-[11px] text-muted-foreground">
                    Solo con invitación
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setVisibilidad("publico")}
                  className={cn(
                    "rounded-xl border p-3 text-sm transition-colors",
                    visibilidad === "publico"
                      ? "border-brand bg-brand/5 text-brand"
                      : "hover:border-brand/40",
                  )}
                >
                  <Globe className="mx-auto mb-1 size-5" />
                  Público
                  <span className="mt-1 block text-[11px] text-muted-foreground">
                    Cualquiera puede unirse
                  </span>
                </button>
              </div>
              {visibilidad === "privado" && (
                <p className="rounded-xl bg-muted/50 p-3 text-xs text-muted-foreground">
                  Al terminar podrás invitar por <b>correo</b>, por{" "}
                  <b>nombre de usuario</b> o compartiendo un <b>enlace/código</b>.
                </p>
              )}
            </div>
          )}

          {/* Paso 3: moneda */}
          {paso === 3 && (
            <div className="space-y-3">
              <div className="relative flex items-center gap-1.5">
                <p className="text-sm font-medium">
                  ¿En qué moneda deseas ahorrar?
                </p>
                <button
                  type="button"
                  onClick={() => setVerTip((v) => !v)}
                  aria-label="Más información"
                  className="text-muted-foreground"
                >
                  <Info className="size-4" />
                </button>
                {verTip && (
                  <div className="absolute left-0 top-7 z-10 w-72 rounded-xl border bg-card p-3 text-xs text-muted-foreground shadow-xl">
                    Es la moneda del plan de ahorro en la que todos aportan
                    juntos. Si eliges <b>Bolívares</b>, el monto se{" "}
                    <b>fija en dólares</b> (BCV o paralelo) y al pagar se calcula
                    en Bs a la <b>tasa del día</b>, para que el ahorro no pierda
                    valor.
                  </div>
                )}
              </div>
              <div className="space-y-2">
                {MONEDAS_RECOLECTA.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMoneda(m)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors",
                      moneda === m
                        ? "border-brand bg-brand/5"
                        : "hover:border-brand/40",
                    )}
                  >
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-[10px] font-bold">
                      {MONEDA_RECOLECTA[m].simbolo}
                    </span>
                    <span className="text-sm font-medium">
                      {MONEDA_RECOLECTA[m].label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Paso 4: detalles según tipo */}
          {paso === 4 && (
            <div className="space-y-4">
              {esSan ? (
                <>
                  <div className="space-y-2">
                    <label htmlFor="cupo-v" className="text-sm font-medium">
                      ¿Cuántas personas participan?
                    </label>
                    <Input
                      id="cupo-v"
                      type="number"
                      inputMode="numeric"
                      min="2"
                      max="50"
                      value={cupo}
                      onChange={(e) => setCupo(e.target.value)}
                      placeholder="Ej: 5"
                    />
                    <p className="text-xs text-muted-foreground">
                      Habrá un turno de cobro por persona.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="monto-v" className="text-sm font-medium">
                      Meta por turno (el bote que recibe quien cobra)
                    </label>
                    <div className="relative">
                      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-brand">
                        {ancla}
                      </span>
                      <Input
                        id="monto-v"
                        type="number"
                        inputMode="decimal"
                        min="0"
                        step="0.01"
                        value={monto}
                        onChange={(e) => setMonto(e.target.value)}
                        className={ancla.length > 2 ? "pl-14" : "pl-10"}
                      />
                    </div>
                    {info?.enBolivares && (
                      <p className="text-xs text-muted-foreground">
                        Se fija en dólares ({moneda === "bs_bcv" ? "BCV" : "paralelo"});
                        al pagar se calcula en Bs a la tasa del día.
                      </p>
                    )}
                  </div>

                  {nParticipantes >= 2 && Number(monto) > 0 && (
                    <div className="rounded-xl bg-brand/5 p-3 text-sm">
                      Cada persona aporta{" "}
                      <b>
                        {ancla} {fmt(aportePersona)}
                      </b>{" "}
                      por turno.
                    </div>
                  )}

                  <div className="space-y-2">
                    <p className="text-sm font-medium">¿Cada cuánto se aporta?</p>
                    <div className="grid grid-cols-4 gap-2">
                      {FRECUENCIAS_PRESET.map((f) => (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => setFrecId(f.id)}
                          className={cn(
                            "rounded-xl border p-2 text-xs transition-colors",
                            frecId === f.id
                              ? "border-brand bg-brand/5 text-brand"
                              : "hover:border-brand/40",
                          )}
                        >
                          {f.label}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => setFrecId("personalizado")}
                        className={cn(
                          "rounded-xl border p-2 text-xs leading-tight transition-colors",
                          frecId === "personalizado"
                            ? "border-brand bg-brand/5 text-brand"
                            : "hover:border-brand/40",
                        )}
                      >
                        Personalizar
                      </button>
                    </div>
                    {frecId === "personalizado" && (
                      <Input
                        type="number"
                        inputMode="numeric"
                        min="1"
                        max="365"
                        value={dias}
                        onChange={(e) => setDias(e.target.value)}
                        placeholder="Cada cuántos días"
                      />
                    )}
                  </div>

                  {duracionDias > 0 && (
                    <div className="flex items-center gap-2 rounded-xl border p-3 text-sm">
                      <CalendarClock className="size-4 shrink-0 text-brand" />
                      <span>
                        Duración estimada:{" "}
                        <b>
                          ~{duracionDias} días (≈{duracionSemanas} semanas)
                        </b>{" "}
                        · {nParticipantes} turnos.
                      </span>
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-2">
                  <label htmlFor="monto-v" className="text-sm font-medium">
                    ¿Cuánto quieren juntar? (meta)
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-brand">
                      {ancla}
                    </span>
                    <Input
                      id="monto-v"
                      type="number"
                      inputMode="decimal"
                      min="0"
                      step="0.01"
                      value={monto}
                      onChange={(e) => setMonto(e.target.value)}
                      className={ancla.length > 2 ? "pl-14" : "pl-10"}
                    />
                  </div>
                  {info?.enBolivares && (
                    <p className="text-xs text-muted-foreground">
                      Se fija en dólares ({moneda === "bs_bcv" ? "BCV" : "paralelo"});
                      al aportar se calcula en Bs a la tasa del día.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Paso 5: método de pago del organizador */}
          {paso === 5 && (
            <div className="space-y-4">
              <div className="flex gap-2 rounded-xl border border-gold/40 bg-gold/5 p-3 text-xs">
                <ShieldAlert className="size-4 shrink-0 text-gold" />
                <span>
                  Los datos deben ser <b>tuyos</b> (titular de la cuenta) y de{" "}
                  <b>persona natural</b>, no de empresas. Usar datos de terceros
                  puede acarrear sanciones.
                </span>
              </div>

              {esCripto ? (
                <div className="space-y-2">
                  <label htmlFor="wallet-v" className="text-sm font-medium">
                    Tu dirección de wallet ({info?.simbolo})
                  </label>
                  <div className="relative">
                    <Wallet className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-brand" />
                    <Input
                      id="wallet-v"
                      value={wallet}
                      onChange={(e) => setWallet(e.target.value)}
                      placeholder="Dirección de Solana"
                      className="pl-9"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Aquí recibirás los aportes. Debe ser tu wallet.
                  </p>
                </div>
              ) : (
                <>
                  <p className="text-sm font-medium">
                    ¿Cómo recibirás los pagos?
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setMetodoPago("transferencia")}
                      className={cn(
                        "flex flex-col items-center gap-1 rounded-xl border p-3 text-sm transition-colors",
                        metodoPago === "transferencia"
                          ? "border-brand bg-brand/5 text-brand"
                          : "hover:border-brand/40",
                      )}
                    >
                      <Banknote className="size-5" />
                      Transferencia
                    </button>
                    <button
                      type="button"
                      onClick={() => setMetodoPago("pago_movil")}
                      className={cn(
                        "flex flex-col items-center gap-1 rounded-xl border p-3 text-sm transition-colors",
                        metodoPago === "pago_movil"
                          ? "border-brand bg-brand/5 text-brand"
                          : "hover:border-brand/40",
                      )}
                    >
                      <Smartphone className="size-5" />
                      Pago móvil
                    </button>
                  </div>

                  {metodoPago === "transferencia" && (
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-sm font-medium">Banco</label>
                        <SelectBanco value={banco} onChange={setBanco} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-sm font-medium">
                          Tipo de cuenta
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {(["corriente", "ahorro"] as const).map((tc) => (
                            <button
                              key={tc}
                              type="button"
                              onClick={() => setTipoCuenta(tc)}
                              className={cn(
                                "rounded-xl border p-2 text-sm capitalize transition-colors",
                                tipoCuenta === tc
                                  ? "border-brand bg-brand/5 text-brand"
                                  : "hover:border-brand/40",
                              )}
                            >
                              {tc}
                            </button>
                          ))}
                        </div>
                      </div>
                      <Input
                        value={numeroCuenta}
                        onChange={(e) => setNumeroCuenta(e.target.value)}
                        inputMode="numeric"
                        placeholder="Número de cuenta (20 dígitos)"
                      />
                      <Input
                        value={titular}
                        onChange={(e) => setTitular(e.target.value)}
                        placeholder="Nombre y apellido del titular"
                      />
                      <Input
                        value={cedula}
                        onChange={(e) => setCedula(e.target.value)}
                        inputMode="numeric"
                        placeholder="Cédula del titular"
                      />
                    </div>
                  )}

                  {metodoPago === "pago_movil" && (
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-sm font-medium">Banco</label>
                        <SelectBanco value={banco} onChange={setBanco} />
                      </div>
                      <Input
                        value={titular}
                        onChange={(e) => setTitular(e.target.value)}
                        placeholder="Nombre y apellido del titular"
                      />
                      <Input
                        value={telefono}
                        onChange={(e) => setTelefono(e.target.value)}
                        inputMode="tel"
                        placeholder="Teléfono (04xx-xxxxxxx)"
                      />
                      <Input
                        value={cedula}
                        onChange={(e) => setCedula(e.target.value)}
                        inputMode="numeric"
                        placeholder="Cédula del titular"
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Paso 6: resumen */}
          {paso === 6 && (
            <div className="space-y-3">
              <p className="text-sm font-medium">Revisa y confirma</p>
              <dl className="space-y-2 rounded-2xl border bg-card p-4 text-sm">
                <Resumen
                  k="Tipo"
                  v={esSan ? "Susi · San · Bolso (turnos)" : "Vaca · Pote (meta)"}
                />
                <Resumen k="Título" v={nombre} />
                {descripcion.trim() && (
                  <Resumen k="Descripción" v={descripcion.trim()} />
                )}
                <Resumen
                  k="Visibilidad"
                  v={visibilidad === "privado" ? "Privado" : "Público"}
                />
                <Resumen k="Moneda" v={info?.label ?? ""} />
                {esSan ? (
                  <>
                    <Resumen k="Participantes" v={`${cupo} personas`} />
                    <Resumen
                      k="Meta por turno"
                      v={`${ancla} ${fmt(Number(monto))}`}
                    />
                    <Resumen
                      k="Aporte por persona"
                      v={`${ancla} ${fmt(aportePersona)}`}
                    />
                    <Resumen k="Frecuencia" v={frecuenciaLabel} />
                    <Resumen
                      k="Duración estimada"
                      v={`~${duracionDias} días (≈${duracionSemanas} sem)`}
                    />
                  </>
                ) : (
                  <Resumen k="Meta" v={`${ancla} ${fmt(Number(monto))}`} />
                )}
                <Resumen
                  k="Recibe en"
                  v={
                    esCripto
                      ? `Wallet ${info?.simbolo}`
                      : `${metodoPago === "transferencia" ? "Transferencia" : "Pago móvil"}${banco ? ` · ${banco}` : ""}`
                  }
                />
              </dl>
              {estado.error && (
                <p className="text-sm text-destructive">{estado.error}</p>
              )}
            </div>
          )}
        </div>

        {/* Navegación */}
        <div className="mt-6">
          {paso < TOTAL - 1 ? (
            <Button
              type="button"
              className="w-full"
              disabled={!puedeSeguir}
              onClick={() => setPaso((p) => p + 1)}
            >
              Siguiente <ArrowRight className="size-4" />
            </Button>
          ) : (
            <form action={accion}>
              <input type="hidden" name="tipo" value={tipo} />
              <input type="hidden" name="nombre" value={nombre} />
              <input type="hidden" name="descripcion" value={descripcion} />
              <input type="hidden" name="visibilidad" value={visibilidad} />
              <input type="hidden" name="moneda" value={moneda} />
              <input type="hidden" name="monto" value={monto} />
              <input
                type="hidden"
                name="frecuencia"
                value={esSan ? frecuenciaLabel : ""}
              />
              <input
                type="hidden"
                name="frecuenciaDias"
                value={esSan ? frecuenciaDias : ""}
              />
              <input
                type="hidden"
                name="cupoMiembros"
                value={esSan ? cupo : ""}
              />
              <input
                type="hidden"
                name="metodoPago"
                value={esCripto ? "wallet" : metodoPago}
              />
              <input type="hidden" name="banco" value={banco} />
              <input type="hidden" name="tipoCuenta" value={tipoCuenta} />
              <input type="hidden" name="numeroCuenta" value={numeroCuenta} />
              <input type="hidden" name="titular" value={titular} />
              <input type="hidden" name="cedula" value={cedula} />
              <input type="hidden" name="telefono" value={telefono} />
              <input type="hidden" name="wallet" value={wallet} />
              <Button type="submit" className="w-full" disabled={pendiente}>
                <Check className="size-4" />{" "}
                {pendiente ? "Creando..." : "Crear ahorro"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}

function Resumen({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="shrink-0 text-muted-foreground">{k}</dt>
      <dd className="text-right font-medium">{v}</dd>
    </div>
  );
}
