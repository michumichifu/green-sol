import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { obtenerUsuario } from "@/lib/auth/session";

export async function GET() {
  const usuario = await obtenerUsuario();
  if (!usuario) return NextResponse.json({ metodos: [] });
  const metodos = await prisma.metodoPago.findMany({
    where: { usuarioId: usuario.id },
    orderBy: { creadoEn: "desc" },
    select: {
      id: true,
      categoria: true,
      moneda: true,
      metodo: true,
      alias: true,
      titular: true,
      banco: true,
      wallet: true,
    },
  });
  return NextResponse.json({ metodos });
}
