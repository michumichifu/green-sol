import { NextResponse } from "next/server";
import { refrescarTasas } from "@/lib/rates/cache";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "no autorizado" }, { status: 401 });
  }
  const resultado = await refrescarTasas();
  return NextResponse.json({ ok: true, resultado });
}
