import { describe, it, expect } from "vitest";
import nacl from "tweetnacl";
import bs58 from "bs58";
import { construirMensaje, verificarFirma } from "@/lib/auth/wallet";
import { esNonceUtilizable } from "@/lib/auth/nonce";

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

describe("esNonceUtilizable", () => {
  const base = {
    usado: false,
    expiraEn: new Date("2026-06-04T12:05:00Z"),
    walletAddress: "WALLET1",
    proposito: "login",
  };
  const ahora = new Date("2026-06-04T12:01:00Z");

  it("acepta un nonce vigente, sin usar, con address y propósito correctos", () => {
    expect(esNonceUtilizable(base, "WALLET1", "login", ahora)).toBe(true);
  });
  it("rechaza null", () => {
    expect(esNonceUtilizable(null, "WALLET1", "login", ahora)).toBe(false);
  });
  it("rechaza si ya se usó", () => {
    expect(esNonceUtilizable({ ...base, usado: true }, "WALLET1", "login", ahora)).toBe(false);
  });
  it("rechaza si expiró", () => {
    const tarde = new Date("2026-06-04T12:10:00Z");
    expect(esNonceUtilizable(base, "WALLET1", "login", tarde)).toBe(false);
  });
  it("rechaza si la address no coincide", () => {
    expect(esNonceUtilizable(base, "OTRA", "login", ahora)).toBe(false);
  });
  it("rechaza si el propósito no coincide", () => {
    expect(esNonceUtilizable(base, "WALLET1", "registro", ahora)).toBe(false);
  });
});
