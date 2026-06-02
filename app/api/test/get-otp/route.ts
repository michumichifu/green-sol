import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hash } from "@node-rs/argon2";

// Endpoint SOLO para pruebas E2E en desarrollo. Deshabilitado en producción.
//
// GET ?correo=x@test.local
// Reemplaza cualquier OTP vigente del usuario con un OTP conocido ("123456" con
// un código controlado por el test) y lo devuelve.  Así el test puede leer el
// código sin necesidad de consultar la consola del servidor ni de hacer
// fuerza bruta sobre el hash.
export async function GET(req: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "no disponible" }, { status: 404 });
  }

  const { searchParams } = new URL(req.url);
  const correo = searchParams.get("correo")?.trim().toLowerCase();
  if (!correo) {
    return NextResponse.json({ error: "correo requerido" }, { status: 400 });
  }

  const usuario = await prisma.usuario.findUnique({ where: { correo } });
  if (!usuario) {
    return NextResponse.json(
      { error: "usuario no encontrado" },
      { status: 404 },
    );
  }

  // Invalida OTPs anteriores del usuario para evitar ambigüedad
  await prisma.codigoOtp.updateMany({
    where: {
      usuarioId: usuario.id,
      proposito: "verificacion",
      usado: false,
    },
    data: { usado: true },
  });

  // Planta un OTP conocido con 10 minutos de vigencia
  const codigoConocido = "246810";
  const hashCodigo = await hash(codigoConocido);
  const expiraEn = new Date(Date.now() + 10 * 60_000);
  await prisma.codigoOtp.create({
    data: {
      usuarioId: usuario.id,
      hashCodigo,
      proposito: "verificacion",
      expiraEn,
    },
  });

  return NextResponse.json({ codigo: codigoConocido });
}
