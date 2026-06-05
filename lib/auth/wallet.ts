import nacl from "tweetnacl";
import bs58 from "bs58";

const DOMINIO = "Green Sol";

export type Proposito = "registro" | "login";

/** Mensaje legible que verá el usuario en el popup de su wallet al firmar. */
export function construirMensaje(nonce: string, proposito: Proposito): string {
  const accion = proposito === "registro" ? "Registrarte en" : "Iniciar sesión en";
  return (
    `${accion} ${DOMINIO}.\n\n` +
    `Firma este mensaje para confirmar que esta wallet es tuya. ` +
    `No autoriza ninguna transacción ni gasto.\n\n` +
    `Nonce: ${nonce}`
  );
}

/**
 * Verifica una firma ed25519 contra la dirección base58. No lanza: devuelve
 * false ante cualquier dato inválido (dirección mal formada, firma corrupta…).
 */
export function verificarFirma(
  addressBase58: string,
  mensaje: string,
  firma: Uint8Array,
): boolean {
  try {
    const pubkey = bs58.decode(addressBase58);
    if (pubkey.length !== 32) return false;
    const mensajeBytes = new TextEncoder().encode(mensaje);
    return nacl.sign.detached.verify(mensajeBytes, firma, pubkey);
  } catch {
    return false;
  }
}
