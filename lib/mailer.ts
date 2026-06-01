import nodemailer from "nodemailer";
import { obtenerConfigSmtp } from "@/lib/config";

async function crearTransporte() {
  const cfg = await obtenerConfigSmtp();
  const host = cfg.SMTP_HOST || process.env.SMTP_HOST;
  if (!host) return null;
  const transporte = nodemailer.createTransport({
    host,
    port: Number(cfg.SMTP_PORT || process.env.SMTP_PORT || 587),
    secure: (cfg.SMTP_SECURE || process.env.SMTP_SECURE) === "true",
    auth: {
      user: cfg.SMTP_USER || process.env.SMTP_USER,
      pass: cfg.SMTP_PASS || process.env.SMTP_PASS,
    },
  });
  const from =
    cfg.SMTP_FROM ||
    process.env.SMTP_FROM ||
    "Green Sol <no-reply@greensol.app>";
  return { transporte, from };
}

/**
 * Envía un correo. Toma la configuración SMTP del panel super-admin (base de
 * datos) y, si no existe, de las variables de entorno. Sin SMTP en ninguna
 * parte (desarrollo), imprime el correo en consola.
 */
export async function enviarCorreo(
  a: string,
  asunto: string,
  texto: string,
  html?: string,
) {
  const t = await crearTransporte();
  if (!t) {
    console.log(`\n[CORREO DEV] Para: ${a}\nAsunto: ${asunto}\n${texto}\n`);
    return;
  }
  await t.transporte.sendMail({
    from: t.from,
    to: a,
    subject: asunto,
    text: texto,
    ...(html ? { html } : {}),
  });
}

/**
 * Verifica la conexión y autenticación SMTP sin enviar ningún correo
 * (handshake + login). Útil para el botón "Verificar conexión".
 */
export async function verificarConexionSmtp(): Promise<{
  ok: boolean;
  error?: string;
}> {
  const t = await crearTransporte();
  if (!t) return { ok: false, error: "No hay SMTP configurado (host vacío)." };
  try {
    await t.transporte.verify();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
