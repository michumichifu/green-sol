import { describe, it, expect } from "vitest";
import nacl from "tweetnacl";
import bs58 from "bs58";
import { construirMensaje, verificarFirma } from "@/lib/auth/wallet";

const enc = (s: string) => new TextEncoder().encode(s);

describe("verificarFirma", () => {
  it("acepta una firma válida de la misma wallet", () => {
    const kp = nacl.sign.keyPair();
    const address = bs58.encode(kp.publicKey);
    const mensaje = construirMensaje("abc123", "login");
    const firma = nacl.sign.detached(enc(mensaje), kp.secretKey);
    expect(verificarFirma(address, mensaje, firma)).toBe(true);
  });

  it("rechaza la firma de otra wallet", () => {
    const firmante = nacl.sign.keyPair();
    const otra = nacl.sign.keyPair();
    const address = bs58.encode(otra.publicKey);
    const mensaje = construirMensaje("abc123", "login");
    const firma = nacl.sign.detached(enc(mensaje), firmante.secretKey);
    expect(verificarFirma(address, mensaje, firma)).toBe(false);
  });

  it("rechaza si el mensaje fue alterado", () => {
    const kp = nacl.sign.keyPair();
    const address = bs58.encode(kp.publicKey);
    const firma = nacl.sign.detached(enc(construirMensaje("abc123", "login")), kp.secretKey);
    expect(verificarFirma(address, construirMensaje("otro", "login"), firma)).toBe(false);
  });

  it("rechaza una dirección base58 inválida sin lanzar", () => {
    const kp = nacl.sign.keyPair();
    const mensaje = construirMensaje("abc123", "login");
    const firma = nacl.sign.detached(enc(mensaje), kp.secretKey);
    expect(verificarFirma("no-es-base58-válida-!!!", mensaje, firma)).toBe(false);
  });
});
