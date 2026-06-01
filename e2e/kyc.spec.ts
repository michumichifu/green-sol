import { test, expect } from "@playwright/test";

test("KYC: el usuario abre el asistente de verificación", async ({ page }) => {
  const correo = `e2e_kyc_${Date.now()}@test.local`;
  const res = await page.request.post("/api/test/sesion", { data: { correo } });
  expect(res.ok()).toBeTruthy();

  await page.goto("/configuracion?tab=verificacion");

  // El ítem KYC aparece en la sección Verificación.
  await expect(page.getByText("Verificación de identidad (KYC)")).toBeVisible();

  // Iniciar abre el asistente.
  await page.getByRole("button", { name: /Iniciar/ }).click();
  await expect(page.getByText("Tu documento de identidad")).toBeVisible();

  // Elegir cédula muestra el selector de nacionalidad V/E.
  await page.getByRole("button", { name: "Cédula" }).click();
  await expect(page.getByRole("button", { name: /Venezolano/ })).toBeVisible();
});
