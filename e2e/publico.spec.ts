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

test("el registro lleva a la verificación por OTP", async ({ page }) => {
  const correo = `e2e_${Date.now()}@test.local`;
  await page.goto("/registro");
  await page.getByLabel("Correo").fill(correo);
  await page.getByLabel("Contraseña").fill("Fuerte123!");
  await page.getByRole("button", { name: "Crear cuenta" }).click();
  await expect(page).toHaveURL(/\/verificar$/);
  await expect(page.getByText(/código de 6 dígitos/i)).toBeVisible();
});

test("el dashboard sin sesión redirige a login", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login$/);
});
