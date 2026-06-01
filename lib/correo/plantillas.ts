/**
 * Plantillas HTML de correo de Green Sol (email-safe: tablas + estilos inline).
 * El layout base aplica la identidad de marca (verde, wordmark). Las imágenes
 * (logo PNG, infografías) se activan con URL pública al desplegar; por ahora el
 * encabezado usa el wordmark en texto para que se vea bien en cualquier cliente.
 */

type BaseOpts = {
  titulo: string;
  cuerpoHtml: string;
  ctaTexto?: string;
  ctaUrl?: string;
  preheader?: string;
};

export function correoBase({
  titulo,
  cuerpoHtml,
  ctaTexto,
  ctaUrl,
  preheader,
}: BaseOpts): string {
  const cta =
    ctaTexto && ctaUrl
      ? `<table cellpadding="0" cellspacing="0" role="presentation" style="margin:24px auto 4px;">
           <tr><td align="center" style="border-radius:10px;background:#0E9F6E;">
             <a href="${ctaUrl}" style="display:inline-block;padding:13px 30px;font-size:15px;font-weight:600;color:#FFFFFF;text-decoration:none;border-radius:10px;">${ctaTexto}</a>
           </td></tr>
         </table>`
      : "";
  const pre = preheader
    ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:#F2F6F4;">${preheader}</div>`
    : "";

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${titulo}</title>
</head>
<body style="margin:0;padding:0;background:#F2F6F4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0B1B14;">
${pre}
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#F2F6F4;padding:32px 16px;">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" role="presentation" style="max-width:560px;width:100%;background:#FFFFFF;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(14,159,110,0.10);">
      <tr><td style="background:linear-gradient(135deg,#0E9F6E,#14C98A);padding:30px 32px;text-align:center;">
        <div style="font-size:22px;font-weight:800;letter-spacing:0.20em;text-transform:uppercase;color:#FFFFFF;">Green Sol</div>
        <div style="margin-top:5px;font-size:12px;color:rgba(255,255,255,0.88);">Ahorro en grupo, claro y con control</div>
      </td></tr>
      <tr><td style="padding:32px;">
        <h1 style="margin:0 0 14px;font-size:20px;font-weight:700;color:#0B1B14;">${titulo}</h1>
        <div style="font-size:15px;line-height:1.6;color:#39463F;">${cuerpoHtml}</div>
        ${cta}
      </td></tr>
      <tr><td style="padding:18px 32px 28px;border-top:1px solid #E8EFEB;text-align:center;">
        <div style="font-size:12px;color:#8A958F;">Green Sol · Solana Vibe Bootcamp · Venezuela</div>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
}

/** Correo de prueba de la configuración SMTP (panel super-admin). */
export function correoPrueba(): {
  asunto: string;
  html: string;
  texto: string;
} {
  return {
    asunto: "Prueba SMTP — Green Sol",
    texto:
      "Este es un correo de prueba de Green Sol. Si lo recibes, el SMTP está configurado correctamente.",
    html: correoBase({
      titulo: "¡Tu SMTP funciona! ✅",
      preheader: "Correo de prueba de Green Sol",
      cuerpoHtml:
        "<p style='margin:0 0 12px;'>Este es un <strong>correo de prueba</strong> enviado desde el panel de Green Sol.</p>" +
        "<p style='margin:0;'>Si lo ves con este diseño, tu servidor SMTP está configurado correctamente y los correos de la app —verificación, OTP y avisos— llegarán así de bien.</p>",
    }),
  };
}
