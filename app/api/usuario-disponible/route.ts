import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { obtenerUsuario } from "@/lib/auth/session";

const REGEX = /^[a-zA-Z0-9_]+$/;

export async function GET(req: NextRequest) {
  const u = (req.nextUrl.searchParams.get("u") ?? "").trim();
  if (u.length < 3 || u.length > 15 || !REGEX.test(u)) {
    return NextResponse.json({ disponible: false, motivo: "formato" });
  }
  const [existente, sesion] = await Promise.all([
    prisma.usuario.findUnique({
      where: { nombreUsuario: u },
      select: { id: true },
    }),
    obtenerUsuario(),
  ]);
  // Disponible si no existe, o si es el propio usuario (su nombre actual).
  const disponible = !existente || existente.id === sesion?.id;
  return NextResponse.json({ disponible });
}
