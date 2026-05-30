import { test, expect } from "@playwright/test";

test("la home muestra la marca y el botón lleva a registro", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Green Sol" })).toBeVisible();
  await page.getByRole("link", { name: "Crear cuenta" }).click();
  await expect(page).toHaveURL(/\/registro$/);
  await expect(
    page.getByRole("heading", { name: "Crear cuenta" }),
  ).toBeVisible();
});

test("el registro por fases lleva a la verificación por OTP", async ({
  page,
}) => {
  const correo = `e2e_${Date.now()}@test.local`;
  const usuario = `e2e${Date.now()}`;
  await page.goto("/registro");

  // Paso 1: credenciales
  await page.getByLabel("Correo").fill(correo);
  await page.getByLabel("Contraseña", { exact: true }).fill("Fuerte123!");
  await page.getByLabel("Confirmar contraseña").fill("Fuerte123!");
  await page.getByRole("button", { name: "Continuar" }).click();

  // Paso 2: datos
  await page.getByLabel("Nombre", { exact: true }).fill("Test");
  await page.getByLabel("Apellido").fill("E2E");
  await page.getByLabel("Nombre de usuario").fill(usuario);
  await page.getByLabel("País").selectOption("VE");
  await page.getByRole("button", { name: "Crear cuenta" }).click();

  await expect(page).toHaveURL(/\/verificar$/);
  await expect(page.getByText(/código de 6 dígitos/i)).toBeVisible();
});

test("el dashboard sin sesión redirige a login", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login$/);
});
