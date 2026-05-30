import nodemailer from "nodemailer";
import { obtenerConfigSmtp } from "@/lib/config";

/**
 * Envía un correo. Toma la configuración SMTP del panel super-admin (base de
 * datos) y, si no existe, de las variables de entorno. Si no hay SMTP en
 * ninguna parte (desarrollo), imprime el correo en consola.
 */
export async function enviarCorreo(a: string, asunto: string, texto: string) {
  const cfg = await obtenerConfigSmtp();
  const host = cfg.SMTP_HOST || process.env.SMTP_HOST;

  if (!host) {
    console.log(`\n[CORREO DEV] Para: ${a}\nAsunto: ${asunto}\n${texto}\n`);
    return;
  }

  const transport = nodemailer.createTransport({
    host,
    port: Number(cfg.SMTP_PORT || process.env.SMTP_PORT || 587),
    secure: (cfg.SMTP_SECURE || process.env.SMTP_SECURE) === "true",
    auth: {
      user: cfg.SMTP_USER || process.env.SMTP_USER,
      pass: cfg.SMTP_PASS || process.env.SMTP_PASS,
    },
  });
  await transport.sendMail({
    from:
      cfg.SMTP_FROM ||
      process.env.SMTP_FROM ||
      "Green Sol <no-reply@greensol.app>",
    to: a,
    subject: asunto,
    text: texto,
  });
}
