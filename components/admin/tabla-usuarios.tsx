"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  Eye,
  RotateCcw,
  Ban,
  CircleCheck,
  Trash2,
  Search,
  Loader2,
  Lock,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { UsuarioResumen } from "@/lib/admin/usuarios";
import {
  suspenderUsuario,
  restablecerVerificacion,
  eliminarUsuario,
  cambiarRolUsuario,
} from "@/app/admin/usuarios-actions";
import { FichaUsuario } from "./ficha-usuario";

// ─── Tipos ────────────────────────────────────────────────────────────────────

type AccionPendiente =
  | { tipo: "restablecer"; usuario: UsuarioResumen }
  | { tipo: "suspender"; usuario: UsuarioResumen; suspender: boolean }
  | { tipo: "eliminar"; usuario: UsuarioResumen }
  | { tipo: "rol"; usuario: UsuarioResumen; rol: string };

// ─── Insignia de estado ───────────────────────────────────────────────────────

function InsigniaEstado({ u }: { u: UsuarioResumen }) {
  if (u.baneado) {
    return (
      <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-semibold text-destructive">
        Suspendido
      </span>
    );
  }
  if (u.nivelKyc >= 1) {
    return (
      <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-semibold text-brand">
        Verificado
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
      Sin verificar
    </span>
  );
}

// ─── Inicial del usuario ──────────────────────────────────────────────────────

function Avatar({ u }: { u: UsuarioResumen }) {
  const inicial = (u.nombreUsuario ?? u.nombre ?? u.correo)?.[0]?.toUpperCase() ?? "?";
  if (u.fotoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={u.fotoUrl}
        alt={inicial}
        className="size-9 shrink-0 rounded-full object-cover"
      />
    );
  }
  return (
    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand/10 text-sm font-bold text-brand">
      {inicial}
    </div>
  );
}

// ─── Modal de confirmación con credencial ─────────────────────────────────────

function ModalConfirmacion({
  accion,
  onCancelar,
  onConfirmar,
  pending,
  errorServidor,
}: {
  accion: AccionPendiente;
  onCancelar: () => void;
  onConfirmar: (credencial: string) => void;
  pending: boolean;
  errorServidor?: string;
}) {
  const [credencial, setCredencial] = useState("");
  const [errorCred, setErrorCred] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const ETIQUETA: Record<AccionPendiente["tipo"], string> = {
    restablecer: "Restablecer verificación",
    suspender:
      accion.tipo === "suspender" && !accion.suspender
        ? "Reactivar usuario"
        : "Suspender usuario",
    eliminar: "Eliminar usuario",
    rol: "Cambiar rol",
  };
  const nombre =
    accion.usuario.nombreUsuario ?? accion.usuario.nombre ?? accion.usuario.correo;

  // Focus al campo al abrir
  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(t);
  }, []);

  // Cerrar con Escape
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === "Escape") onCancelar();
    }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onCancelar]);

  // Scroll-lock del body
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  function handleConfirmar() {
    if (!credencial.trim()) {
      setErrorCred("Ingresa tu PIN o contraseña.");
      return;
    }
    setErrorCred("");
    onConfirmar(credencial);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
      onClick={onCancelar}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-titulo"
        className="w-full max-w-sm rounded-[1.75rem] border border-border/60 bg-card p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-1 flex items-center gap-2">
          <Lock className="size-4 text-brand" />
          <h2 id="confirm-titulo" className="text-sm font-semibold">
            {ETIQUETA[accion.tipo]}
          </h2>
        </div>
        <p className="mb-4 text-xs text-muted-foreground">
          ¿Confirmas esta acción para{" "}
          <span className="font-medium text-foreground">{nombre}</span>?
          {accion.tipo === "eliminar" && " Esta acción no se puede deshacer."}
        </p>

        {/* Campo de credencial */}
        <div className="mb-4 space-y-1">
          <label htmlFor="cred-modal" className="text-xs font-medium text-foreground">
            Confirma con tu PIN o contraseña
          </label>
          <input
            ref={inputRef}
            id="cred-modal"
            type="password"
            autoComplete="current-password"
            value={credencial}
            onChange={(e) => {
              setCredencial(e.target.value);
              if (errorCred) setErrorCred("");
            }}
            onKeyDown={(e) => e.key === "Enter" && handleConfirmar()}
            placeholder="••••••"
            className={cn(
              "w-full rounded-xl border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/50",
              errorCred && "border-destructive",
            )}
          />
          {(errorCred || errorServidor) && (
            <p className="text-xs text-destructive">{errorCred || errorServidor}</p>
          )}
        </div>

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
            onClick={handleConfirmar}
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
    </div>
  );
}

// ─── Fila de usuario (mobile-first) ──────────────────────────────────────────

function FilaUsuario({
  u,
  onVerFicha,
  onAccion,
  onCambiarRol,
}: {
  u: UsuarioResumen;
  onVerFicha: (id: string) => void;
  onAccion: (a: AccionPendiente) => void;
  onCambiarRol: (u: UsuarioResumen, rol: string) => void;
}) {
  return (
    <div className="rounded-2xl border bg-card">
      {/* ── Fila superior: avatar + identidad + estado/rol ── */}
      <div className="flex items-center gap-3 p-3">
        <Avatar u={u} />

        {/* Identidad — min-w-0 es imprescindible para que truncate funcione */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">
            {u.nombreUsuario ?? u.nombre ?? "—"}
          </p>
          <p className="truncate text-xs text-muted-foreground">{u.correo}</p>
        </div>

        {/* Estado + rol — siempre en una línea, a la derecha */}
        <div className="flex shrink-0 flex-col items-end gap-1">
          <InsigniaEstado u={u} />
          <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
            {u.rol === "super_admin" ? "Super-admin" : "Usuario"}
          </span>
        </div>
      </div>

      {/* ── Fila inferior: selector de rol + acciones ── */}
      <div className="flex items-center gap-2 border-t px-3 py-2">
        <select
          key={u.rol}
          value={u.rol}
          onChange={(e) => onCambiarRol(u, e.target.value)}
          className="min-w-0 flex-1 rounded-lg border bg-background px-2 py-1.5 text-xs sm:flex-none sm:w-auto"
          aria-label="Cambiar rol"
        >
          <option value="usuario">Usuario</option>
          <option value="super_admin">Super-admin</option>
        </select>

        {/* Acciones: 4 iconos con área táctil generosa */}
        <div className="ml-auto flex shrink-0 items-center gap-0.5">
          <button
            type="button"
            aria-label="Ver ficha"
            title="Ver ficha"
            onClick={() => onVerFicha(u.id)}
            className="inline-flex size-10 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Eye className="size-4" />
          </button>
          <button
            type="button"
            aria-label="Restablecer verificación"
            title="Restablecer verificación"
            onClick={() => onAccion({ tipo: "restablecer", usuario: u })}
            className="inline-flex size-10 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <RotateCcw className="size-4" />
          </button>
          {u.baneado ? (
            <button
              type="button"
              aria-label="Reactivar usuario"
              title="Reactivar usuario"
              onClick={() => onAccion({ tipo: "suspender", usuario: u, suspender: false })}
              className="inline-flex size-10 items-center justify-center rounded-lg text-brand hover:bg-brand/10"
            >
              <CircleCheck className="size-4" />
            </button>
          ) : (
            <button
              type="button"
              aria-label="Suspender usuario"
              title="Suspender usuario"
              onClick={() => onAccion({ tipo: "suspender", usuario: u, suspender: true })}
              className="inline-flex size-10 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-destructive"
            >
              <Ban className="size-4" />
            </button>
          )}
          <button
            type="button"
            aria-label="Eliminar usuario"
            title="Eliminar usuario"
            onClick={() => onAccion({ tipo: "eliminar", usuario: u })}
            className="inline-flex size-10 items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Chips de filtro ──────────────────────────────────────────────────────────

const CHIPS = [
  { valor: "todos", etiqueta: "Todos" },
  { valor: "verificados", etiqueta: "Verificados" },
  { valor: "sin_verificar", etiqueta: "Sin verificar" },
  { valor: "suspendidos", etiqueta: "Suspendidos" },
] as const;

// ─── Componente principal ─────────────────────────────────────────────────────

export function TablaUsuarios({
  usuarios,
  total,
  paginas,
  pagina,
  q,
  filtro,
}: {
  usuarios: UsuarioResumen[];
  total: number;
  paginas: number;
  pagina: number;
  q: string;
  filtro: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [busqueda, setBusqueda] = useState(q);
  const [accionPendiente, setAccionPendiente] = useState<AccionPendiente | null>(null);
  const [errorCredModal, setErrorCredModal] = useState("");
  const [fichaAbierta, setFichaAbierta] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function navegar(params: Record<string, string>) {
    const sp = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(params)) {
      if (v) sp.set(k, v);
      else sp.delete(k);
    }
    router.push(`${pathname}?${sp.toString()}`);
  }

  function buscar() {
    navegar({ q: busqueda.trim(), pagina: "1" });
  }

  function cambiarFiltro(valor: string) {
    navegar({ filtro: valor === "todos" ? "" : valor, pagina: "1" });
  }

  function cambiarPagina(nueva: number) {
    navegar({ pagina: String(nueva) });
  }

  function ejecutarAccion(credencial: string) {
    if (!accionPendiente) return;
    const a = accionPendiente;
    // No cerramos el modal aquí: si la credencial es incorrecta el server
    // devolverá un error y lo mostramos sin cerrar.
    startTransition(async () => {
      let resultado: { ok?: true; error?: string };
      if (a.tipo === "restablecer") {
        resultado = await restablecerVerificacion(a.usuario.id, credencial);
      } else if (a.tipo === "suspender") {
        resultado = await suspenderUsuario(a.usuario.id, a.suspender, credencial);
      } else if (a.tipo === "eliminar") {
        resultado = await eliminarUsuario(a.usuario.id, credencial);
      } else {
        resultado = await cambiarRolUsuario(a.usuario.id, a.rol, credencial);
      }
      if ("error" in resultado && resultado.error) {
        if (resultado.error === "Clave o PIN incorrecto.") {
          // Mantener el modal abierto y mostrar el error dentro
          setErrorCredModal(resultado.error);
        } else {
          setAccionPendiente(null);
          setErrorCredModal("");
          toast.error(resultado.error);
        }
      } else {
        setAccionPendiente(null);
        setErrorCredModal("");
        toast.success("Listo.");
        router.refresh();
      }
    });
  }

  function confirmarRol(u: UsuarioResumen, rol: string) {
    if (rol === u.rol) return;
    setAccionPendiente({ tipo: "rol", usuario: u, rol });
  }

  return (
    <div className="space-y-4">
      {/* Buscador */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <label htmlFor="buscar-usuarios" className="sr-only">Buscar usuarios</label>
          <input
            id="buscar-usuarios"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && buscar()}
            placeholder="Buscar por correo, usuario, teléfono o cédula"
            className="w-full rounded-xl border bg-background py-2 pl-8 pr-3 text-sm"
          />
        </div>
        <button
          type="button"
          onClick={buscar}
          aria-label="Buscar"
          className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl border bg-background"
        >
          <Search className="size-4" />
        </button>
      </div>

      {/* Chips de filtro */}
      <div className="flex flex-wrap gap-2">
        {CHIPS.map((c) => {
          const activo = filtro === c.valor;
          return (
            <button
              key={c.valor}
              type="button"
              onClick={() => cambiarFiltro(c.valor)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                activo
                  ? "bg-brand text-white"
                  : "border text-muted-foreground hover:text-foreground",
              )}
            >
              {c.etiqueta}
            </button>
          );
        })}
      </div>

      {/* Conteo */}
      <p className="text-xs text-muted-foreground">
        {total} {total === 1 ? "usuario" : "usuarios"}
      </p>

      {/* Lista */}
      {usuarios.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Sin resultados.
        </p>
      ) : (
        <div className="space-y-2">
          {usuarios.map((u) => (
            <FilaUsuario
              key={u.id}
              u={u}
              onVerFicha={(id) => setFichaAbierta(id)}
              onAccion={(a) => {
                setErrorCredModal("");
                setAccionPendiente(a);
              }}
              onCambiarRol={confirmarRol}
            />
          ))}
        </div>
      )}

      {/* Paginación */}
      {paginas > 1 && (
        <div className="flex items-center justify-between gap-2 pt-1">
          <button
            type="button"
            onClick={() => cambiarPagina(pagina - 1)}
            disabled={pagina <= 1 || pending}
            aria-label="Página anterior"
            className="inline-flex size-8 items-center justify-center rounded-lg border disabled:opacity-40"
          >
            <ChevronLeft className="size-4" />
          </button>
          <span className="text-xs text-muted-foreground">
            Página {pagina} de {paginas}
          </span>
          <button
            type="button"
            onClick={() => cambiarPagina(pagina + 1)}
            disabled={pagina >= paginas || pending}
            aria-label="Página siguiente"
            className="inline-flex size-8 items-center justify-center rounded-lg border disabled:opacity-40"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      )}

      {/* Diálogo de confirmación con credencial */}
      {accionPendiente && (
        <ModalConfirmacion
          accion={accionPendiente}
          onCancelar={() => {
            setAccionPendiente(null);
            setErrorCredModal("");
          }}
          onConfirmar={ejecutarAccion}
          pending={pending}
          errorServidor={errorCredModal}
        />
      )}

      {/* Ficha modal */}
      {fichaAbierta && (
        <FichaUsuario
          id={fichaAbierta}
          onCerrar={() => setFichaAbierta(null)}
          onEliminado={() => {
            setFichaAbierta(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
