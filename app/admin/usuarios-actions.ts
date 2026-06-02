"use server";

import { revalidatePath } from "next/cache";
import type { Rol } from "@prisma/client";
import { prisma } from "@/lib/db";
import { obtenerUsuario } from "@/lib/auth/session";
import { credencialValida } from "@/lib/auth/credencial";
import { puedeTransicionar } from "@/lib/kyc/estados";
import { fichaUsuario, type FichaUsuario } from "@/lib/admin/usuarios";

export type ResultadoAccion = { ok: true } | { error: string };

const ROLES_VALIDOS: Rol[] = ["usuario", "super_admin"];

async function obtenerSuperAdmin() {
  const u = await obtenerUsuario();
  if (!u || u.rol !== "super_admin") return null;
  return u;
}

/**
 * Suspende o reactiva una cuenta de usuario.
 * Un super-admin no puede suspenderse a sí mismo.
 * Requiere la credencial (PIN o contraseña) del super-admin en sesión.
 */
export async function suspenderUsuario(
  usuarioId: string,
  suspender: boolean,
  credencial: string,
): Promise<ResultadoAccion> {
  const admin = await obtenerSuperAdmin();
  if (!admin) return { error: "No autorizado." };
  if (!(await credencialValida(admin.id, credencial))) {
    return { error: "Clave o PIN incorrecto." };
  }
  if (usuarioId === admin.id) {
    return { error: "No puedes suspenderte a ti mismo." };
  }
  try {
    await prisma.usuario.update({
      where: { id: usuarioId },
      data: { baneado: suspender },
    });
    revalidatePath("/admin");
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Error al actualizar el usuario." };
  }
}

/**
 * Restablece la verificación de identidad de un usuario:
 * - Pone nivelKyc en 0.
 * - Si tiene una VerificacionKyc reciente con una transición válida hacia
 *   "reenvio_solicitado", la marca con ese estado para que el usuario pueda
 *   reenviar. Si no es posible, solo baja nivelKyc (el banner reaparece igual).
 * Requiere la credencial (PIN o contraseña) del super-admin en sesión.
 */
export async function restablecerVerificacion(
  usuarioId: string,
  credencial: string,
): Promise<ResultadoAccion> {
  const admin = await obtenerSuperAdmin();
  if (!admin) return { error: "No autorizado." };
  if (!(await credencialValida(admin.id, credencial))) {
    return { error: "Clave o PIN incorrecto." };
  }
  try {
    // Busca la verificación más reciente del usuario.
    const verificacion = await prisma.verificacionKyc.findFirst({
      where: { usuarioId },
      orderBy: { creadaEn: "desc" },
    });

    await prisma.$transaction(async (tx) => {
      await tx.usuario.update({
        where: { id: usuarioId },
        data: { nivelKyc: 0 },
      });
      if (
        verificacion &&
        puedeTransicionar(verificacion.estado, "reenvio_solicitado")
      ) {
        await tx.verificacionKyc.update({
          where: { id: verificacion.id },
          data: { estado: "reenvio_solicitado" },
        });
      }
    });

    revalidatePath("/admin");
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Error al restablecer la verificación." };
  }
}

/**
 * Elimina permanentemente un usuario y sus dependientes sin cascade.
 * Protecciones:
 * - No eliminar al propio super-admin en sesión.
 * - No eliminar al único super-admin del sistema.
 * Requiere la credencial (PIN o contraseña) del super-admin en sesión.
 */
export async function eliminarUsuario(
  usuarioId: string,
  credencial: string,
): Promise<ResultadoAccion> {
  const admin = await obtenerSuperAdmin();
  if (!admin) return { error: "No autorizado." };
  if (!(await credencialValida(admin.id, credencial))) {
    return { error: "Clave o PIN incorrecto." };
  }
  if (usuarioId === admin.id) {
    return { error: "No puedes eliminarte a ti mismo." };
  }

  try {
    const objetivo = await prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: { rol: true },
    });
    if (!objetivo) return { error: "Usuario no encontrado." };

    if (objetivo.rol === "super_admin") {
      const totalSuperAdmin = await prisma.usuario.count({
        where: { rol: "super_admin" },
      });
      if (totalSuperAdmin <= 1) {
        return { error: "No puedes eliminar al único super-admin." };
      }
    }

    // Borramos en una transacción: si el delete final falla, no quedan
    // dependientes borrados a medias. Cascade cubre Sesion/CodigoOtp/
    // Notificacion/MetodoPago/VerificacionKyc; el resto se borra a mano.
    await prisma.$transaction([
      prisma.valoracion.deleteMany({
        where: { OR: [{ deUsuarioId: usuarioId }, { aUsuarioId: usuarioId }] },
      }),
      prisma.participante.deleteMany({ where: { usuarioId } }),
      prisma.recolecta.deleteMany({ where: { organizadorId: usuarioId } }),
      prisma.usuario.delete({ where: { id: usuarioId } }),
    ]);

    revalidatePath("/admin");
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Error al eliminar el usuario." };
  }
}

/**
 * Cambia el rol de un usuario devolviendo feedback explícito.
 * Replica las mismas salvaguardas de `cambiarRol` en actions.ts pero
 * retorna {ok}|{error} en lugar de void, para usarse desde cliente.
 * Requiere la credencial (PIN o contraseña) del super-admin en sesión.
 */
export async function cambiarRolUsuario(
  usuarioId: string,
  rol: string,
  credencial: string,
): Promise<ResultadoAccion> {
  const admin = await obtenerSuperAdmin();
  if (!admin) return { error: "No autorizado." };
  if (!(await credencialValida(admin.id, credencial))) {
    return { error: "Clave o PIN incorrecto." };
  }

  if (!(ROLES_VALIDOS as string[]).includes(rol)) {
    return { error: "Rol no válido." };
  }
  const rolTipado = rol as Rol;

  // No degradar el propio rol.
  if (usuarioId === admin.id && rolTipado !== "super_admin") {
    return { error: "No puedes cambiar tu propio rol." };
  }

  try {
    const objetivo = await prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: { rol: true },
    });
    if (!objetivo) return { error: "Usuario no encontrado." };

    // No dejar el sistema sin super-admin.
    if (objetivo.rol === "super_admin" && rolTipado !== "super_admin") {
      const total = await prisma.usuario.count({ where: { rol: "super_admin" } });
      if (total <= 1) {
        return { error: "No puedes quitar el único super-admin." };
      }
    }

    await prisma.usuario.update({ where: { id: usuarioId }, data: { rol: rolTipado } });
    revalidatePath("/admin");
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Error al cambiar el rol." };
  }
}

/**
 * Carga la ficha completa de un usuario. Solo super-admin.
 */
export async function obtenerFicha(id: string): Promise<FichaUsuario | null> {
  const admin = await obtenerSuperAdmin();
  if (!admin) return null;
  return fichaUsuario(id);
}
