"use server";

import { revalidatePath } from "next/cache";
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

  if (nombreUsuario) {
    if (nombreUsuario.length < 3 || nombreUsuario.length > 15) {
      return { error: "El nombre de usuario debe tener entre 3 y 15 caracteres." };
    }
    if (!/^[a-zA-Z0-9_]+$/.test(nombreUsuario)) {
      return { error: "El nombre de usuario solo admite letras, números y guion bajo." };
    }
  }

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

export async function agregarMetodoPago(formData: FormData): Promise<void> {
  const usuario = await obtenerUsuario();
  if (!usuario) return;
  const categoria = str(formData.get("categoria"));
  const moneda = str(formData.get("moneda"));
  const metodo = str(formData.get("metodo"));
  if (!categoria || !moneda || !metodo) return;
  await prisma.metodoPago.create({
    data: {
      usuarioId: usuario.id,
      categoria,
      moneda,
      metodo,
      alias: str(formData.get("alias")),
      titular: str(formData.get("titular")),
      cedula: str(formData.get("cedula")),
      banco: str(formData.get("banco")),
      tipoCuenta: str(formData.get("tipoCuenta")),
      numeroCuenta: str(formData.get("numeroCuenta")),
      telefono: str(formData.get("telefono")),
      email: str(formData.get("email")),
      wallet: str(formData.get("wallet")),
      detalle: str(formData.get("detalle")),
    },
  });
  revalidatePath("/configuracion");
}

export async function eliminarMetodoPago(id: string): Promise<void> {
  const usuario = await obtenerUsuario();
  if (!usuario) return;
  await prisma.metodoPago.deleteMany({
    where: { id, usuarioId: usuario.id },
  });
  revalidatePath("/perfil");
}
