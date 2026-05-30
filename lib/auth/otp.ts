import { hash, verify } from "@node-rs/argon2";
import type { OtpProposito } from "@prisma/client";
import { prisma } from "@/lib/db";
import { enviarCorreo } from "@/lib/mailer";

const VIGENCIA_MIN = 10;

/** Genera un OTP de 6 dígitos, lo guarda hasheado y lo envía por correo. */
export async function crearYEnviarOtp(
  usuarioId: string,
  correo: string,
  proposito: OtpProposito,
) {
  const codigo = String(
    crypto.getRandomValues(new Uint32Array(1))[0] % 1_000_000,
  ).padStart(6, "0");
  const hashCodigo = await hash(codigo);
  const expiraEn = new Date(Date.now() + VIGENCIA_MIN * 60_000);
  await prisma.codigoOtp.create({
    data: { usuarioId, hashCodigo, proposito, expiraEn },
  });
  await enviarCorreo(
    correo,
    "Tu código de Green Sol",
    `Tu código de verificación es: ${codigo}\nVálido por ${VIGENCIA_MIN} minutos.`,
  );
}

/** Valida el OTP más reciente y vigente; si coincide, lo marca como usado. */
export async function validarOtp(
  usuarioId: string,
  proposito: OtpProposito,
  codigo: string,
): Promise<boolean> {
  const registro = await prisma.codigoOtp.findFirst({
    where: { usuarioId, proposito, usado: false, expiraEn: { gt: new Date() } },
    orderBy: { creadoEn: "desc" },
  });
  if (!registro) return false;
  const ok = await verify(registro.hashCodigo, codigo);
  if (ok) {
    await prisma.codigoOtp.update({
      where: { id: registro.id },
      data: { usado: true },
    });
  }
  return ok;
}
