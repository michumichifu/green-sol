import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { crearSesion } from "@/lib/auth/session";

// Endpoint SOLO para pruebas E2E en desarrollo. Deshabilitado en producción.
export async function POST(req: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "no disponible" }, { status: 404 });
  }
  const body = (await req.json()) as { correo?: string };
  const correo = String(body.correo ?? "").trim();
  if (!correo) {
    return NextResponse.json({ error: "correo requerido" }, { status: 400 });
  }
  const usuario = await prisma.usuario.upsert({
    where: { correo },
    create: { correo, correoVerificado: true },
    update: { correoVerificado: true },
  });
  await crearSesion(usuario.id);
  return NextResponse.json({ ok: true, usuarioId: usuario.id });
}
