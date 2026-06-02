import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { crearSesion } from "@/lib/auth/session";

/**
 * Endpoint SOLO para pruebas E2E en desarrollo. Deshabilitado en producción.
 *
 * Siembra hasta 2 usuarios normales @test.local con correos deterministas
 * (listos para ser buscados en el panel), e inicia sesión como
 * qa@greensol.local (super_admin ya sembrado por seed-dev).
 *
 * POST /api/test/seed-admin
 * Body: { sufijo?: string }  — para generar correos únicos por suite
 */
export async function POST(req: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "no disponible" }, { status: 404 });
  }

  const body = (await req.json()) as { sufijo?: string };
  const sufijo = String(body.sufijo ?? "default").replace(/[^a-z0-9_]/gi, "_");

  // Sembrar dos usuarios normales buscables (idempotente)
  const correos = [
    `e2e_admin_u1_${sufijo}@test.local`,
    `e2e_admin_u2_${sufijo}@test.local`,
  ];

  for (const correo of correos) {
    await prisma.usuario.upsert({
      where: { correo },
      create: { correo, correoVerificado: true },
      update: { correoVerificado: true },
    });
  }

  // Iniciar sesión como el super_admin QA
  const admin = await prisma.usuario.findUnique({
    where: { correo: "qa@greensol.local" },
    select: { id: true, rol: true },
  });
  if (!admin || admin.rol !== "super_admin") {
    return NextResponse.json(
      { error: "qa@greensol.local no encontrado o sin rol super_admin — ejecuta npm run seed:dev" },
      { status: 500 },
    );
  }

  await crearSesion(admin.id);

  return NextResponse.json({
    ok: true,
    adminId: admin.id,
    usuariosSembrados: correos,
  });
}
