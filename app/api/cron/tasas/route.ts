import { NextResponse } from "next/server";
import { refrescarTasas, type GrupoTasas } from "@/lib/rates/cache";

export const dynamic = "force-dynamic";

const GRUPOS_VALIDOS = new Set<GrupoTasas>(["todo", "cripto", "bcv"]);

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "no autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const grupoParam = searchParams.get("grupo");
  const grupo: GrupoTasas =
    grupoParam && GRUPOS_VALIDOS.has(grupoParam as GrupoTasas)
      ? (grupoParam as GrupoTasas)
      : "todo";

  const resultado = await refrescarTasas(grupo);
  return NextResponse.json({ ok: true, grupo, resultado });
}
