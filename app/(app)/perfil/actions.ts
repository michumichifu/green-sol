"use server";

import { revalidatePath } from "next/cache";
import type { TipoMetodoPago } from "@prisma/client";
import { prisma } from "@/lib/db";
import { obtenerUsuario } from "@/lib/auth/session";

function str(v: FormDataEntryValue | null): string | null {
  const s = String(v ?? "").trim();
  return s || null;
}

export async function actualizarPerfil(formData: FormData): Promise<void> {
  const usuario = await obtenerUsuario();
  if (!usuario) return;
  try {
    await prisma.usuario.update({
      where: { id: usuario.id },
      data: {
        nombre: str(formData.get("nombre")),
        apellido: str(formData.get("apellido")),
        nombreUsuario: str(formData.get("nombreUsuario")),
      },
    });
  } catch {
    // nombre de usuario duplicado
  }
  revalidatePath("/perfil");
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
