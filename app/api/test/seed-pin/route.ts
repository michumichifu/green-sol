import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashearPin } from "@/lib/auth/pin";

// Endpoint SOLO para pruebas E2E en desarrollo. Deshabilitado en producción.
export async function POST(req: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "no disponible" }, { status: 404 });
  }
  const body = (await req.json()) as { correo?: string; pin?: string };
  const correo = String(body.correo ?? "").trim();
  const pin = String(body.pin ?? "").trim();
  if (!correo || !pin) {
    return NextResponse.json({ error: "correo y pin requeridos" }, { status: 400 });
  }

  const pinHash = await hashearPin(pin);
  const usuario = await prisma.usuario.upsert({
    where: { correo },
    create: { correo, correoVerificado: true, pinHash },
    update: { correoVerificado: true, pinHash },
  });
  return NextResponse.json({ ok: true, usuarioId: usuario.id });
}
