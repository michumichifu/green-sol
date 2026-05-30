"use server";

import { revalidatePath } from "next/cache";
import type { Rol } from "@prisma/client";
import { prisma } from "@/lib/db";
import { obtenerUsuario } from "@/lib/auth/session";
import { guardarConfig, CLAVES_APP } from "@/lib/config";
import { CLAVES_BLACKLIST } from "@/lib/restricciones";

const ROLES: Rol[] = ["usuario", "admin_grupo", "super_admin"];
const CLAVES_SMTP = [
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_USER",
  "SMTP_PASS",
  "SMTP_FROM",
  "SMTP_SECURE",
];

async function esAdmin(): Promise<boolean> {
  const u = await obtenerUsuario();
  return u?.rol === "super_admin";
}

export async function cambiarRol(
  usuarioId: string,
  formData: FormData,
): Promise<void> {
  if (!(await esAdmin())) return;
  const rol = String(formData.get("rol") ?? "") as Rol;
  if (!ROLES.includes(rol)) return;
  await prisma.usuario.update({ where: { id: usuarioId }, data: { rol } });
  revalidatePath("/admin");
}

export async function guardarSmtp(formData: FormData): Promise<void> {
  if (!(await esAdmin())) return;
  for (const clave of CLAVES_SMTP) {
    const valor = String(formData.get(clave) ?? "").trim();
    if (valor) await guardarConfig(clave, valor);
  }
  revalidatePath("/admin");
}

export async function guardarAppConfig(formData: FormData): Promise<void> {
  if (!(await esAdmin())) return;
  for (const clave of CLAVES_APP) {
    // Se guarda siempre (permite vaciar un campo).
    const valor = String(formData.get(clave) ?? "").trim();
    await guardarConfig(clave, valor);
  }
  revalidatePath("/admin");
}

export async function guardarRestricciones(formData: FormData): Promise<void> {
  if (!(await esAdmin())) return;
  await guardarConfig(
    CLAVES_BLACKLIST.nombre,
    String(formData.get("nombre") ?? "").trim(),
  );
  await guardarConfig(
    CLAVES_BLACKLIST.apellido,
    String(formData.get("apellido") ?? "").trim(),
  );
  await guardarConfig(
    CLAVES_BLACKLIST.nombreUsuario,
    String(formData.get("nombreUsuario") ?? "").trim(),
  );
  revalidatePath("/admin");
}
