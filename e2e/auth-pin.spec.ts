import { test, expect } from "@playwright/test";

// ─── helpers ────────────────────────────────────────────────────────────────

async function sembrarUsuarioConPin(
  page: import("@playwright/test").Page,
  correo: string,
  pin: string,
) {
  const res = await page.request.post("/api/test/seed-pin", {
    data: { correo, pin },
  });
  expect(res.ok()).toBeTruthy();
}

/**
 * Rellena los 6 dígitos del CampoPin haciendo click en el primer dígito
 * y tipeando el resto. CampoPin mueve el foco al siguiente input tras cada
 * dígito. Como `onCompleto` dispara `requestSubmit` al terminar el 6.º dígito,
 * este helper NO espera el resultado: deja que el test lo haga.
 */
async function rellenarPin(
  page: import("@playwright/test").Page,
  pin: string,
) {
  await page.getByTestId("login-pin-0").click();
  for (const digit of pin) {
    await page.keyboard.press(digit);
    await page.waitForTimeout(80);
  }
}

// ─── tests ──────────────────────────────────────────────────────────────────

test("login con PIN correcto llega al dashboard/onboarding", async ({ page }) => {
  const correo = `e2e_pin_${Date.now()}@test.local`;
  const pin = "246810";

  await sembrarUsuarioConPin(page, correo, pin);

  // Paso 1: ingresar correo
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Bienvenido de vuelta" })).toBeVisible();
  await page.getByLabel("Correo o usuario").fill(correo);
  await page.getByRole("button", { name: /Siguiente/ }).click();

  // Paso 2: ingresar PIN — onCompleto dispara el form automáticamente
  await expect(page.getByRole("heading", { name: "Ingresa tu PIN" })).toBeVisible();
  await rellenarPin(page, pin);

  // La acción debe redirigir a dashboard u onboarding (nuevo usuario)
  await expect(page).toHaveURL(/\/(dashboard|onboarding)$/, { timeout: 10_000 });
});

test("login con PIN incorrecto muestra error y resetea el campo", async ({ page }) => {
  const correo = `e2e_pin_err_${Date.now()}@test.local`;
  const pinCorrecto = "135791";
  const pinMal = "999999";

  await sembrarUsuarioConPin(page, correo, pinCorrecto);

  // Paso 1: correo
  await page.goto("/login");
  await page.getByLabel("Correo o usuario").fill(correo);
  await page.getByRole("button", { name: /Siguiente/ }).click();

  // Paso 2: PIN incorrecto — onCompleto auto-envía
  await expect(page.getByRole("heading", { name: "Ingresa tu PIN" })).toBeVisible();
  await rellenarPin(page, pinMal);

  // El error aparece y el campo PIN queda vacío (reseteado por el action wrapper)
  await expect(page.getByText(/PIN incorrecto|intentos/i)).toBeVisible({ timeout: 8_000 });
  // El primer dígito del PIN debe estar vacío tras el reset
  await expect(page.getByTestId("login-pin-0")).toHaveValue("");
});

test("paso 1 muestra wizard: identificador + botón Siguiente, sin campo PIN", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Bienvenido de vuelta" })).toBeVisible();
  await expect(page.getByLabel("Correo o usuario")).toBeVisible();
  await expect(page.getByRole("button", { name: /Siguiente/ })).toBeVisible();
  // El campo PIN NO debe ser visible en el paso 1
  await expect(page.getByTestId("login-pin-0")).not.toBeVisible();
});

test("identificador se conserva al volver del paso 2 al paso 1", async ({ page }) => {
  await page.goto("/login");
  const correoTest = "usuario@example.com";
  await page.getByLabel("Correo o usuario").fill(correoTest);
  await page.getByRole("button", { name: /Siguiente/ }).click();

  // Está en paso 2
  await expect(page.getByRole("heading", { name: "Ingresa tu PIN" })).toBeVisible();

  // Volver al paso 1
  await page.getByRole("button", { name: /Volver al paso anterior/ }).click();

  // El identificador sigue presente
  await expect(page.getByLabel("Correo o usuario")).toHaveValue(correoTest);
});
