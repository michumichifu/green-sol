"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  RotateCcw,
  Ban,
  CircleCheck,
  Trash2,
  Loader2,
  Lock,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { FichaUsuario as TFichaUsuario } from "@/lib/admin/usuarios";
import type { EstadoKyc } from "@prisma/client";
import {
  obtenerFicha,
  suspenderUsuario,
  restablecerVerificacion,
  eliminarUsuario,
  cambiarRolUsuario,
} from "@/app/admin/usuarios-actions";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtFecha(d: Date | string) {
  return new Date(d).toLocaleString("es-VE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fmtFechaSolo(d: Date | string) {
  return new Date(d).toLocaleDateString("es-VE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function rutaArchivo(key: string): string {
  return `/api/almacen/${key.split("/").map(encodeURIComponent).join("/")}`;
}

const ETIQUETA_ESTADO: Record<EstadoKyc, string> = {
  pendiente: "Pendiente",
  en_revision: "En revisión",
  aprobada: "Aprobada",
  rechazada: "Rechazada",
  reenvio_solicitado: "Reenvío solicitado",
  baneada: "Baneada",
};

function InsigniaKyc({ estado }: { estado: EstadoKyc }) {
  const colores: Record<EstadoKyc, string> = {
    aprobada: "bg-brand/10 text-brand",
    pendiente: "bg-gold/10 text-gold",
    en_revision: "bg-blue-500/10 text-blue-600",
    rechazada: "bg-destructive/10 text-destructive",
    reenvio_solicitado: "bg-gold/10 text-gold",
    baneada: "bg-destructive/10 text-destructive",
  };
  return (
    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", colores[estado])}>
      {ETIQUETA_ESTADO[estado]}
    </span>
  );
}

function Miniatura({ url, etiqueta }: { url: string; etiqueta: string }) {
  return (
    <a href={url} target="_blank" rel="noreferrer" className="space-y-1">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt={etiqueta}
        className="aspect-square w-full rounded-lg border object-cover"
      />
      <p className="text-center text-[10px] text-muted-foreground">{etiqueta}</p>
    </a>
  );
}

function FilaDetalle({ etiqueta, valor }: { etiqueta: string; valor: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-2 py-1">
      <span className="shrink-0 text-xs text-muted-foreground">{etiqueta}</span>
      <span className="min-w-0 text-right text-xs font-medium">{valor}</span>
    </div>
  );
}

// ─── Diálogo de confirmación interno ─────────────────────────────────────────

type AccionInterna =
  | { tipo: "restablecer" }
  | { tipo: "suspender"; suspender: boolean }
  | { tipo: "eliminar" }
  | { tipo: "rol"; rol: string };

function ConfirmInterna({
  accion,
  nombre,
  onCancelar,
  onConfirmar,
  pending,
}: {
  accion: AccionInterna;
  nombre: string;
  onCancelar: () => void;
  onConfirmar: () => void;
  pending: boolean;
}) {
  const ETIQUETA: Record<AccionInterna["tipo"], string> = {
    restablecer: "Restablecer verificación",
    suspender: accion.tipo === "suspender" && !accion.suspender ? "Reactivar usuario" : "Suspender usuario",
    eliminar: "Eliminar usuario",
    rol: "Cambiar rol",
  };
  return (
    <div className="mt-3 space-y-2 rounded-xl border border-brand/40 bg-brand/5 p-3">
      <p className="flex items-center gap-1.5 text-sm font-semibold">
        <Lock className="size-4 text-brand" /> {ETIQUETA[accion.tipo]}
      </p>
      <p className="text-xs text-muted-foreground">
        ¿Confirmas para <span className="font-medium text-foreground">{nombre}</span>?
        {accion.tipo === "eliminar" && " No se puede deshacer."}
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancelar}
          className="flex-1 rounded-xl border py-2 text-xs font-medium"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={onConfirmar}
          disabled={pending}
          className={cn(
            "flex flex-1 items-center justify-center gap-1 rounded-xl py-2 text-xs font-semibold text-white",
            accion.tipo === "eliminar" ? "bg-destructive" : "bg-brand",
            pending && "opacity-60",
          )}
        >
          {pending ? <Loader2 className="size-4 animate-spin" /> : "Confirmar"}
        </button>
      </div>
    </div>
  );
}

// ─── Contenido de la ficha ────────────────────────────────────────────────────

function ContenidoFicha({
  ficha,
  onCerrar,
  onEliminado,
}: {
  ficha: TFichaUsuario;
  onCerrar: () => void;
  onEliminado: () => void;
}) {
  const router = useRouter();
  const [accionPendiente, setAccionPendiente] = useState<AccionInterna | null>(null);
  const [rolSeleccionado, setRolSeleccionado] = useState(ficha.rol);
  const [pending, startTransition] = useTransition();

  const nombre =
    [ficha.nombre, ficha.apellido].filter(Boolean).join(" ") ||
    ficha.nombreUsuario ||
    ficha.correo;
  const inicial = nombre[0]?.toUpperCase() ?? "?";

  const pinBloqueado = ficha.pinBloqueadoHasta && new Date(ficha.pinBloqueadoHasta) > new Date();

  const ver = ficha.verificacion;

  function ejecutar(a: AccionInterna) {
    setAccionPendiente(null);
    startTransition(async () => {
      let resultado: { ok?: true; error?: string };
      if (a.tipo === "restablecer") {
        resultado = await restablecerVerificacion(ficha.id);
      } else if (a.tipo === "suspender") {
        resultado = await suspenderUsuario(ficha.id, a.suspender);
      } else if (a.tipo === "eliminar") {
        resultado = await eliminarUsuario(ficha.id);
      } else {
        resultado = await cambiarRolUsuario(ficha.id, a.rol);
      }
      if ("error" in resultado && resultado.error) {
        toast.error(resultado.error);
      } else {
        toast.success("Listo.");
        if (a.tipo === "eliminar") {
          onEliminado();
        } else {
          router.refresh();
        }
      }
    });
  }

  return (
    <div className="space-y-5 pb-4">
      {/* Identidad */}
      <section className="space-y-3">
        <div className="flex items-center gap-3">
          {ficha.fotoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={ficha.fotoUrl}
              alt={inicial}
              className="size-14 rounded-full object-cover"
            />
          ) : (
            <div className="flex size-14 items-center justify-center rounded-full bg-brand/10 text-xl font-bold text-brand">
              {inicial}
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate text-base font-semibold">{nombre}</p>
            {ficha.nombreUsuario && (
              <p className="truncate text-xs text-brand">@{ficha.nombreUsuario}</p>
            )}
            <p className="truncate text-xs text-muted-foreground">{ficha.correo}</p>
          </div>
        </div>

        <div className="rounded-xl border bg-muted/30 divide-y">
          {ficha.apellido && ficha.nombre && (
            <div className="px-3">
              <FilaDetalle etiqueta="Nombre completo" valor={`${ficha.nombre} ${ficha.apellido}`} />
            </div>
          )}
          <div className="px-3">
            <FilaDetalle
              etiqueta="Teléfono"
              valor={
                ficha.telefono ? (
                  <span>
                    {ficha.telefono}
                    {ficha.telefonoVerificado && (
                      <span className="ml-1 text-brand">✓</span>
                    )}
                  </span>
                ) : (
                  "—"
                )
              }
            />
          </div>
          <div className="px-3">
            <FilaDetalle etiqueta="País" valor={ficha.pais ?? "—"} />
          </div>
          <div className="px-3">
            <FilaDetalle
              etiqueta="Rol"
              valor={ficha.rol === "super_admin" ? "Super-admin" : "Usuario"}
            />
          </div>
          <div className="px-3">
            <FilaDetalle etiqueta="Registro" valor={fmtFechaSolo(ficha.creadoEn)} />
          </div>
          <div className="px-3">
            <FilaDetalle etiqueta="Ingresos" valor={ficha.ingresos} />
          </div>
        </div>
      </section>

      {/* Seguridad */}
      <section className="space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Seguridad
        </h3>
        <div className="rounded-xl border bg-muted/30 divide-y">
          <div className="px-3">
            <FilaDetalle etiqueta="PIN" valor={ficha.tienePin ? "Sí" : "No"} />
          </div>
          <div className="px-3">
            <FilaDetalle etiqueta="Contraseña" valor={ficha.tieneContrasena ? "Sí" : "No"} />
          </div>
          <div className="px-3">
            <FilaDetalle
              etiqueta="OTP por correo"
              valor={ficha.otpCorreoActivo ? "Activo" : "No"}
            />
          </div>
          {pinBloqueado && (
            <div className="px-3">
              <FilaDetalle
                etiqueta="PIN bloqueado hasta"
                valor={
                  <span className="text-destructive">
                    {fmtFecha(ficha.pinBloqueadoHasta!)}
                  </span>
                }
              />
            </div>
          )}
        </div>
      </section>

      {/* KYC */}
      <section className="space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Verificación KYC
        </h3>
        {ver ? (
          <div className="space-y-3 rounded-xl border bg-muted/30 p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground">Estado</span>
              <InsigniaKyc estado={ver.estado} />
            </div>

            {ver.tipoDocumento && (
              <FilaDetalle
                etiqueta="Documento"
                valor={
                  ver.tipoDocumento === "cedula"
                    ? `Cédula ${ver.nacionalidad ?? ""}–${ver.numeroDocumento ?? ""}`
                    : `Pasaporte ${ver.numeroDocumento ?? ""}`
                }
              />
            )}
            {ver.nacionalidad && (
              <FilaDetalle etiqueta="Nacionalidad" valor={ver.nacionalidad} />
            )}
            {ver.direccion && (
              <FilaDetalle etiqueta="Dirección" valor={ver.direccion} />
            )}
            {ver.ciudad && <FilaDetalle etiqueta="Ciudad" valor={ver.ciudad} />}
            {ver.estadoRegion && (
              <FilaDetalle etiqueta="Estado/Región" valor={ver.estadoRegion} />
            )}
            {ver.revisadaEn && (
              <FilaDetalle etiqueta="Revisada" valor={fmtFecha(ver.revisadaEn)} />
            )}
            {ver.motivoRechazo && (
              <div className="rounded-lg bg-destructive/5 p-2 text-xs">
                <span className="font-medium">Motivo:</span> {ver.motivoRechazo}
              </div>
            )}

            {/* Imágenes vía /api/almacen */}
            {(ver.docFrenteKey || ver.docReversoKey || ver.selfieKey || ver.videoKey) && (
              <div className="space-y-2 pt-1">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Documentos
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {ver.docFrenteKey && (
                    <Miniatura url={rutaArchivo(ver.docFrenteKey)} etiqueta="Frente" />
                  )}
                  {ver.docReversoKey && (
                    <Miniatura url={rutaArchivo(ver.docReversoKey)} etiqueta="Reverso" />
                  )}
                  {ver.selfieKey && (
                    <Miniatura url={rutaArchivo(ver.selfieKey)} etiqueta="Selfie" />
                  )}
                </div>
                {ver.videoKey && (
                  <video
                    src={rutaArchivo(ver.videoKey)}
                    controls
                    className="w-full rounded-lg border"
                  />
                )}
              </div>
            )}
          </div>
        ) : (
          <p className="rounded-xl border bg-muted/30 p-3 text-xs text-muted-foreground">
            Sin verificación de identidad.
          </p>
        )}
      </section>

      {/* Métodos de pago */}
      {ficha.metodosPago.length > 0 && (
        <section className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Métodos de pago ({ficha.metodosPago.length})
          </h3>
          <div className="space-y-2">
            {ficha.metodosPago.map((m) => (
              <div key={m.id} className="rounded-xl border bg-muted/30 p-3 space-y-1">
                <p className="text-xs font-semibold">
                  {m.alias ?? m.metodo}{" "}
                  {m.principal && (
                    <span className="ml-1 rounded-full bg-brand/10 px-1.5 py-0.5 text-[9px] font-medium text-brand">
                      Principal
                    </span>
                  )}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {m.categoria} · {m.moneda} · {m.metodo}
                </p>
                {m.titular && (
                  <p className="text-[10px] text-muted-foreground">Titular: {m.titular}</p>
                )}
                {m.cedula && (
                  <p className="text-[10px] text-muted-foreground">Cédula: {m.cedula}</p>
                )}
                {m.banco && (
                  <p className="text-[10px] text-muted-foreground">Banco: {m.banco}</p>
                )}
                {m.numeroCuenta && (
                  <p className="text-[10px] text-muted-foreground">
                    Cuenta: {m.tipoCuenta ? `${m.tipoCuenta} ` : ""}{m.numeroCuenta}
                  </p>
                )}
                {m.telefono && (
                  <p className="text-[10px] text-muted-foreground">Tel: {m.telefono}</p>
                )}
                {m.email && (
                  <p className="text-[10px] text-muted-foreground">Email: {m.email}</p>
                )}
                {m.wallet && (
                  <p className="truncate text-[10px] text-muted-foreground">
                    Wallet: {m.wallet}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Acciones */}
      <section className="space-y-2 border-t pt-4">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Acciones
        </h3>

        {/* Cambiar rol */}
        <div className="flex items-center gap-2">
          <select
            value={rolSeleccionado}
            onChange={(e) => setRolSeleccionado(e.target.value as typeof ficha.rol)}
            className="flex-1 rounded-lg border bg-background px-2 py-1.5 text-xs"
            aria-label="Cambiar rol"
          >
            <option value="usuario">Usuario</option>
            <option value="super_admin">Super-admin</option>
          </select>
          <button
            type="button"
            disabled={rolSeleccionado === ficha.rol || pending}
            onClick={() =>
              setAccionPendiente({ tipo: "rol", rol: rolSeleccionado })
            }
            className="rounded-lg border px-3 py-1.5 text-xs font-medium disabled:opacity-40"
          >
            Cambiar rol
          </button>
        </div>

        {/* Botones de acción */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <button
            type="button"
            disabled={pending}
            onClick={() => setAccionPendiente({ tipo: "restablecer" })}
            className="flex items-center justify-center gap-1.5 rounded-xl border py-2 text-xs font-medium disabled:opacity-40"
          >
            <RotateCcw className="size-3.5" /> Restablecer KYC
          </button>

          {ficha.baneado ? (
            <button
              type="button"
              disabled={pending}
              onClick={() => setAccionPendiente({ tipo: "suspender", suspender: false })}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-brand/40 bg-brand/10 py-2 text-xs font-medium text-brand disabled:opacity-40"
            >
              <CircleCheck className="size-3.5" /> Reactivar
            </button>
          ) : (
            <button
              type="button"
              disabled={pending}
              onClick={() => setAccionPendiente({ tipo: "suspender", suspender: true })}
              className="flex items-center justify-center gap-1.5 rounded-xl border py-2 text-xs font-medium disabled:opacity-40"
            >
              <Ban className="size-3.5" /> Suspender
            </button>
          )}

          <button
            type="button"
            disabled={pending}
            onClick={() => setAccionPendiente({ tipo: "eliminar" })}
            className="col-span-2 flex items-center justify-center gap-1.5 rounded-xl border border-destructive/40 bg-destructive/10 py-2 text-xs font-medium text-destructive disabled:opacity-40 sm:col-span-1"
          >
            <Trash2 className="size-3.5" /> Eliminar
          </button>
        </div>

        {/* Confirmación inline */}
        {accionPendiente && (
          <ConfirmInterna
            accion={accionPendiente}
            nombre={nombre}
            onCancelar={() => setAccionPendiente(null)}
            onConfirmar={() => ejecutar(accionPendiente)}
            pending={pending}
          />
        )}
      </section>
    </div>
  );
}

// ─── Componente principal: FichaUsuario (modal) ───────────────────────────────

export function FichaUsuario({
  id,
  onCerrar,
  onEliminado,
}: {
  id: string;
  onCerrar: () => void;
  onEliminado: () => void;
}) {
  const [ficha, setFicha] = useState<TFichaUsuario | null>(null);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState(false);

  // Carga la ficha al abrir
  useEffect(() => {
    let activo = true;
    setCargando(true);
    setErrorCarga(false);
    obtenerFicha(id)
      .then((f) => {
        if (activo) {
          setFicha(f);
          setCargando(false);
        }
      })
      .catch(() => {
        if (activo) {
          setCargando(false);
          setErrorCarga(true);
        }
      });
    return () => { activo = false; };
  }, [id]);

  // Cerrar con Escape
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === "Escape") onCerrar();
    }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onCerrar]);

  // Scroll-lock del body
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        aria-hidden="true"
        onClick={onCerrar}
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="ficha-titulo"
        className="relative z-10 flex w-full max-w-lg flex-col rounded-[1.75rem] border border-border/60 bg-card shadow-2xl"
        style={{ maxHeight: "90dvh" }}
      >
        {/* Cabecera fija */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-b px-5 py-4">
          <h2 id="ficha-titulo" className="text-sm font-semibold">
            Ficha de usuario
          </h2>
          <button
            type="button"
            aria-label="Cerrar"
            onClick={onCerrar}
            className="inline-flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Cuerpo con scroll */}
        <div className="overflow-y-auto px-5 pt-4">
          {cargando ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : errorCarga ? (
            <p className="py-8 text-center text-sm text-destructive">
              No se pudo cargar la ficha. Inténtalo de nuevo.
            </p>
          ) : !ficha ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Usuario no encontrado.
            </p>
          ) : (
            <ContenidoFicha
              ficha={ficha}
              onCerrar={onCerrar}
              onEliminado={onEliminado}
            />
          )}
        </div>
      </div>
    </div>
  );
}
