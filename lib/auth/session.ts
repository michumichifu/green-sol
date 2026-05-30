import { cookies } from "next/headers";
import { prisma } from "@/lib/db";

const COOKIE = "greensol_session";
const DIAS = 30;

export async function crearSesion(usuarioId: string) {
  const expiraEn = new Date(Date.now() + DIAS * 86_400_000);
  const sesion = await prisma.sesion.create({ data: { usuarioId, expiraEn } });
  (await cookies()).set(COOKIE, sesion.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiraEn,
    path: "/",
  });
}

export async function obtenerUsuario() {
  const id = (await cookies()).get(COOKIE)?.value;
  if (!id) return null;
  const sesion = await prisma.sesion.findUnique({
    where: { id },
    include: { usuario: true },
  });
  if (!sesion || sesion.expiraEn < new Date()) return null;
  return sesion.usuario;
}

export async function cerrarSesion() {
  const store = await cookies();
  const id = store.get(COOKIE)?.value;
  if (id) await prisma.sesion.deleteMany({ where: { id } });
  store.delete(COOKIE);
}
