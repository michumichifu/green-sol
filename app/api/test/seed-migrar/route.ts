import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashContrasena } from "@/lib/auth/password";

/**
 * Endpoint SOLO para pruebas E2E en desarrollo.
 * Crea (o actualiza) un usuario con `hashContrasena` conocida y SIN `pinHash`,
 * simulando un usuario "legacy" que debe migrar a PIN.
 * Deshabilitado en producción.
 */
export async function POST(req: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "no disponible" }, { status: 404 });
  }
  const body = (await req.json()) as {
    correo?: string;
    contrasena?: string;
    nombreUsuario?: string;
  };
  const correo = String(body.correo ?? "").trim().toLowerCase();
  const contrasena = String(body.contrasena ?? "").trim();
  if (!correo || !contrasena) {
    return NextResponse.json(
      { error: "correo y contrasena requeridos" },
      { status: 400 },
    );
  }

  const hash = await hashContrasena(contrasena);
  const usuario = await prisma.usuario.upsert({
    where: { correo },
    create: {
      correo,
      correoVerificado: true,
      hashContrasena: hash,
      pinHash: null,
      nombre: body.nombreUsuario ?? "Test",
      apellido: "Migrar",
      nombreUsuario: body.nombreUsuario ?? `migrar${Date.now().toString().slice(-8)}`,
      pais: "VE",
    },
    update: {
      correoVerificado: true,
      hashContrasena: hash,
      pinHash: null,
    },
  });
  return NextResponse.json({ ok: true, usuarioId: usuario.id });
}
