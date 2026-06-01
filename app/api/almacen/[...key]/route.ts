import { NextResponse } from "next/server";
import { obtenerUsuario } from "@/lib/auth/session";
import { leerArchivo } from "@/lib/almacenamiento";

// Sirve archivos privados (documentos KYC) leyéndolos del almacén interno
// (MinIO) y entregándolos SOLO al super-admin. Evita exponer MinIO al navegador
// (las URLs firmadas directas no son accesibles desde fuera del VPS).

const CONTENT_TYPE: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webm: "video/webm",
  mp4: "video/mp4",
  pdf: "application/pdf",
};

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ key: string[] }> },
) {
  const u = await obtenerUsuario();
  if (u?.rol !== "super_admin") {
    return new NextResponse("No autorizado", { status: 403 });
  }
  const { key } = await params;
  const ruta = key.map((s) => decodeURIComponent(s)).join("/");
  try {
    const buffer = await leerArchivo(ruta);
    const ext = ruta.split(".").pop()?.toLowerCase() ?? "";
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": CONTENT_TYPE[ext] ?? "application/octet-stream",
        "Cache-Control": "private, max-age=60",
      },
    });
  } catch {
    return new NextResponse("Archivo no encontrado", { status: 404 });
  }
}
