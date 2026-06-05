import { prisma } from "@/lib/db";
import type {
  Rol,
  TipoDocumento,
  Nacionalidad,
  EstadoKyc,
} from "@prisma/client";

// ─── Tipos exportados ───────────────────────────────────────────────────────

export type UsuarioResumen = {
  id: string;
  correo: string | null;
  nombreUsuario: string | null;
  nombre: string | null;
  apellido: string | null;
  fotoUrl: string | null;
  rol: Rol;
  nivelKyc: number;
  baneado: boolean;
  creadoEn: Date;
};

export type ResultadoBusqueda = {
  usuarios: UsuarioResumen[];
  total: number;
  paginas: number;
  pagina: number;
};

export type FichaUsuario = {
  id: string;
  correo: string | null;
  nombre: string | null;
  apellido: string | null;
  nombreUsuario: string | null;
  fotoUrl: string | null;
  pais: string | null;
  telefono: string | null;
  telefonoVerificado: boolean;
  rol: Rol;
  nivelKyc: number;
  baneado: boolean;
  otpCorreoActivo: boolean;
  pinBloqueadoHasta: Date | null;
  creadoEn: Date;
  ingresos: number;
  // seguridad — nunca se exponen los hashes crudos
  tienePin: boolean;
  tieneContrasena: boolean;
  metodosPago: {
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
    detalle: string | null;
    principal: boolean;
    creadoEn: Date;
  }[];
  verificacion: {
    tipoDocumento: TipoDocumento | null;
    nacionalidad: Nacionalidad | null;
    numeroDocumento: string | null;
    docFrenteKey: string | null;
    docReversoKey: string | null;
    selfieKey: string | null;
    videoKey: string | null;
    direccion: string | null;
    ciudad: string | null;
    estadoRegion: string | null;
    estado: EstadoKyc;
    motivoRechazo: string | null;
    revisadaEn: Date | null;
    revisadoPorId: string | null;
    creadaEn: Date;
  } | null;
};

// ─── Parámetros ──────────────────────────────────────────────────────────────

type FiltroUsuario = "todos" | "verificados" | "sin_verificar" | "suspendidos";

type ParamsBuscar = {
  q?: string;
  pagina?: number;
  filtro?: FiltroUsuario;
  porPagina?: number;
};

// ─── buscarUsuarios ──────────────────────────────────────────────────────────

export async function buscarUsuarios({
  q = "",
  pagina = 1,
  filtro = "todos",
  porPagina = 20,
}: ParamsBuscar = {}): Promise<ResultadoBusqueda> {
  // Condición de búsqueda por texto
  const condQ =
    q.trim().length > 0
      ? {
          OR: [
            { correo: { contains: q, mode: "insensitive" as const } },
            { nombreUsuario: { contains: q, mode: "insensitive" as const } },
            { telefono: { contains: q, mode: "insensitive" as const } },
            {
              verificaciones: {
                some: {
                  numeroDocumento: {
                    contains: q,
                    mode: "insensitive" as const,
                  },
                },
              },
            },
          ],
        }
      : undefined;

  // Condición de filtro por estado
  const condFiltro =
    filtro === "verificados"
      ? { nivelKyc: { gte: 1 } }
      : filtro === "sin_verificar"
        ? { nivelKyc: { lt: 1 } }
        : filtro === "suspendidos"
          ? { baneado: true }
          : undefined;

  // Combinar con AND
  const where =
    condQ && condFiltro
      ? { AND: [condQ, condFiltro] }
      : condQ
        ? condQ
        : condFiltro
          ? condFiltro
          : {};

  const [usuarios, total] = await Promise.all([
    prisma.usuario.findMany({
      where,
      orderBy: { creadoEn: "desc" },
      skip: (pagina - 1) * porPagina,
      take: porPagina,
      select: {
        id: true,
        correo: true,
        nombreUsuario: true,
        nombre: true,
        apellido: true,
        fotoUrl: true,
        rol: true,
        nivelKyc: true,
        baneado: true,
        creadoEn: true,
      },
    }),
    prisma.usuario.count({ where }),
  ]);

  return {
    usuarios,
    total,
    paginas: Math.max(1, Math.ceil(total / porPagina)),
    pagina,
  };
}

// ─── fichaUsuario ─────────────────────────────────────────────────────────────

export async function fichaUsuario(id: string): Promise<FichaUsuario | null> {
  const raw = await prisma.usuario.findUnique({
    where: { id },
    select: {
      id: true,
      correo: true,
      nombre: true,
      apellido: true,
      nombreUsuario: true,
      fotoUrl: true,
      pais: true,
      telefono: true,
      telefonoVerificado: true,
      rol: true,
      nivelKyc: true,
      baneado: true,
      otpCorreoActivo: true,
      pinBloqueadoHasta: true,
      creadoEn: true,
      ingresos: true,
      // para derivar booleanos — no se devuelven al caller
      pinHash: true,
      hashContrasena: true,
      metodosPago: {
        select: {
          id: true,
          categoria: true,
          moneda: true,
          metodo: true,
          alias: true,
          titular: true,
          cedula: true,
          banco: true,
          tipoCuenta: true,
          numeroCuenta: true,
          telefono: true,
          email: true,
          wallet: true,
          detalle: true,
          principal: true,
          creadoEn: true,
        },
      },
      verificaciones: {
        orderBy: { creadaEn: "desc" },
        take: 1,
        select: {
          tipoDocumento: true,
          nacionalidad: true,
          numeroDocumento: true,
          docFrenteKey: true,
          docReversoKey: true,
          selfieKey: true,
          videoKey: true,
          direccion: true,
          ciudad: true,
          estadoRegion: true,
          estado: true,
          motivoRechazo: true,
          revisadaEn: true,
          revisadoPorId: true,
          creadaEn: true,
        },
      },
    },
  });

  if (!raw) return null;

  // Desestructurar para aislar los hashes
  const { pinHash, hashContrasena, verificaciones, ...campos } = raw;

  return {
    ...campos,
    tienePin: pinHash !== null,
    tieneContrasena: hashContrasena !== null,
    verificacion: verificaciones[0] ?? null,
  };
}
