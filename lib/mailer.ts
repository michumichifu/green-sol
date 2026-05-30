import nodemailer from "nodemailer";

/**
 * Envía un correo. En desarrollo (sin SMTP configurado) lo imprime en consola;
 * en producción usa el SMTP de las variables de entorno.
 */
export async function enviarCorreo(a: string, asunto: string, texto: string) {
  if (!process.env.SMTP_HOST) {
    console.log(
      `\n[CORREO DEV] Para: ${a}\nAsunto: ${asunto}\n${texto}\n`,
    );
    return;
  }
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  await transport.sendMail({
    from: process.env.SMTP_FROM ?? "Green Sol <no-reply@greensol.app>",
    to: a,
    subject: asunto,
    text: texto,
  });
}
