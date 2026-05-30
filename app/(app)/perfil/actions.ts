"use server";

import { revalidatePath } from "next/cache";
import type { TipoMetodoPago } from "@prisma/client";
import { prisma } from "@/lib/db";
import { obtenerUsuario } from "@/lib/auth/session";
import { validarRestricciones } from "@/lib/restricciones";

function str(v: FormDataEntryValue | null): string | null {
  const s = String(v ?? "").trim();
  return s || null;
}

export type EstadoPerfil = { error?: string; ok?: boolean };

export async function actualizarPerfil(
  _estado: EstadoPerfil,
  formData: FormData,
): Promise<EstadoPerfil> {
  const usuario = await obtenerUsuario();
  if (!usuario) return { error: "Tu sesión expiró." };

  const nombre = str(formData.get("nombre"));
  const apellido = str(formData.get("apellido"));
  const nombreUsuario = str(formData.get("nombreUsuario"));

  // El super-admin queda exento de la lista negra de palabras.
  if (usuario.rol !== "super_admin") {
    const err = await validarRestricciones({ nombre, apellido, nombreUsuario });
    if (err) return { error: err };
  }

  try {
    await prisma.usuario.update({
      where: { id: usuario.id },
      data: { nombre, apellido, nombreUsuario },
    });
  } catch {
    return { error: "Ese nombre de usuario ya está en uso." };
  }
  revalidatePath("/configuracion");
  revalidatePath("/perfil");
  return { ok: true };
}

const TIPOS: TipoMetodoPago[] = [
  "efectivo",
  "transferencia_bs",
  "pago_movil",
  "wallet_usdt",
  "wallet_solana",
];

export async function agregarMetodoPago(formData: FormData): Promise<void> {
  const usuario = await obtenerUsuario();
  if (!usuario) return;
  const tipo = String(formData.get("tipo") ?? "") as TipoMetodoPago;
  const detalle = str(formData.get("detalle"));
  if (!TIPOS.includes(tipo) || !detalle) return;
  await prisma.metodoPago.create({
    data: { usuarioId: usuario.id, tipo, detalle },
  });
  revalidatePath("/perfil");
}

export async function eliminarMetodoPago(id: string): Promise<void> {
  const usuario = await obtenerUsuario();
  if (!usuario) return;
  await prisma.metodoPago.deleteMany({
    where: { id, usuarioId: usuario.id },
  });
  revalidatePath("/perfil");
}
