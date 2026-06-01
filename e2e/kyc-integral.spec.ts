import { test, expect } from "@playwright/test";

// PNG 1x1 válido para simular fotos de documento/selfie.
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "base64",
);
const archivo = (name: string) => ({ name, mimeType: "image/png" as const, buffer: PNG });

test("KYC integral: usuario envía (sin video) y el admin aprueba", async ({ browser }) => {
  const ctxAdmin = await browser.newContext();
  const ctxUser = await browser.newContext();
  const admin = await ctxAdmin.newPage();
  const user = await ctxUser.newPage();
  const correoUser = `e2e_kyc_int_${Date.now()}@test.local`;

  // 1) Admin (QA super-admin) apaga el paso "Video de liveness" para poder
  //    completar el flujo sin cámara (y de paso prueba los toggles).
  await admin.request.post("/api/test/sesion", { data: { correo: "qa@greensol.local" } });
  await admin.goto("/admin");
  await admin.getByRole("button", { name: "Verificaciones" }).click();
  const switchVideo = admin
    .locator("label")
    .filter({ hasText: "Video de liveness" })
    .getByRole("switch");
  if ((await switchVideo.getAttribute("aria-checked")) === "true") {
    await switchVideo.click();
    await expect(switchVideo).toHaveAttribute("aria-checked", "false");
  }

  try {
    // 2) Usuario nuevo envía su verificación (documento + selfie).
    await user.request.post("/api/test/sesion", { data: { correo: correoUser } });
    await user.goto("/configuracion?tab=verificacion");
    await user.getByRole("button", { name: /Iniciar/ }).click();
    await user.getByRole("button", { name: "Cédula" }).click();
    await user.getByRole("button", { name: /Venezolano/ }).click();
    await user.getByPlaceholder(/Número de cédula/).fill("12345678");
    await user.getByTestId("kyc-doc-frente").setInputFiles(archivo("frente.png"));
    await user.getByTestId("kyc-doc-reverso").setInputFiles(archivo("reverso.png"));
    await user.getByRole("button", { name: /Siguiente/ }).click();
    // Paso selfie
    await user.getByTestId("kyc-selfie").setInputFiles(archivo("selfie.png"));
    await user.getByRole("button", { name: /Siguiente/ }).click();
    // Paso revisar → enviar
    await user.getByRole("button", { name: /Enviar verificación/ }).click();
    await expect(user.getByText(/Estamos revisando tu identidad/)).toBeVisible({ timeout: 15_000 });

    // 3) Admin ve la solicitud, carga documentos (URL firmada MinIO), toma y aprueba.
    await admin.reload();
    await admin.getByRole("button", { name: "Verificaciones" }).click();
    const tarjeta = admin.locator("div.bg-card").filter({ hasText: correoUser }).first();
    await expect(tarjeta).toBeVisible();
    await tarjeta.getByRole("button", { name: /Ver documentos/ }).click();
    await expect(tarjeta.getByText("Frente")).toBeVisible({ timeout: 10_000 });
    await tarjeta.getByRole("button", { name: /Tomar para revisar/ }).click();
    await tarjeta.getByRole("button", { name: /^Aprobar/ }).click();
    // Esperar a que la acción termine (la tarjeta sale de "Pendientes").
    await expect(tarjeta).toBeHidden({ timeout: 10_000 });

    // 4) Usuario ve su identidad verificada.
    await user.goto("/configuracion?tab=verificacion");
    await expect(user.getByText(/Tu identidad está verificada/)).toBeVisible({ timeout: 10_000 });
  } finally {
    // Restaurar el toggle de video.
    await admin.goto("/admin");
    await admin.getByRole("button", { name: "Verificaciones" }).click();
    const sw = admin
      .locator("label")
      .filter({ hasText: "Video de liveness" })
      .getByRole("switch");
    if ((await sw.getAttribute("aria-checked")) === "false") {
      await sw.click();
    }
    await ctxAdmin.close();
    await ctxUser.close();
  }
});
