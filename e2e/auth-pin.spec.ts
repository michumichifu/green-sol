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
 * Siembra un usuario legacy con contraseña conocida y SIN pinHash.
 * Simula cuentas creadas antes de la migración a PIN.
 */
async function sembrarUsuarioLegacy(
  page: import("@playwright/test").Page,
  correo: string,
  contrasena: string,
) {
  const res = await page.request.post("/api/test/seed-migrar", {
    data: { correo, contrasena },
  });
  expect(res.ok()).toBeTruthy();
}

/**
 * Obtiene (y planta) un OTP conocido para el correo dado.
 * El endpoint invalida OTPs anteriores y crea uno con código "246810".
 */
async function obtenerOtp(
  page: import("@playwright/test").Page,
  correo: string,
): Promise<string> {
  const res = await page.request.get(
    `/api/test/get-otp?correo=${encodeURIComponent(correo)}`,
  );
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  return body.codigo as string;
}

/**
 * Rellena un CampoPin identificado por su testId base (p. ej. "registro-pin").
 */
async function rellenarPinPor(
  page: import("@playwright/test").Page,
  testIdBase: string,
  pin: string,
) {
  await page.getByTestId(`${testIdBase}-0`).click();
  for (const digit of pin) {
    await page.keyboard.press(digit);
    await page.waitForTimeout(60);
  }
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

// ─── flujo de migración contraseña → PIN ────────────────────────────────────

test("migración: login sin PIN redirige a /migrar-pin con ?u=identificador", async ({ page }) => {
  const correo = `e2e_migrar_redir_${Date.now()}@test.local`;
  const contrasena = "Clave1234!";

  await sembrarUsuarioLegacy(page, correo, contrasena);

  await page.goto("/login");
  await page.getByLabel("Correo o usuario").fill(correo);
  await page.getByRole("button", { name: /Siguiente/ }).click();

  // Paso 2: intentar entrar con cualquier PIN
  await expect(page.getByRole("heading", { name: "Ingresa tu PIN" })).toBeVisible();
  await rellenarPin(page, "246810");

  // Debe redirigir a /migrar-pin con el identificador en la URL
  await expect(page).toHaveURL(
    new RegExp(`/migrar-pin\\?u=${encodeURIComponent(correo)}`),
    { timeout: 10_000 },
  );
  await expect(page.getByRole("heading", { name: "Crea tu PIN" })).toBeVisible();
});

test("migración: contraseña correcta + PIN nuevo → queda logueado", async ({ page }) => {
  const correo = `e2e_migrar_ok_${Date.now()}@test.local`;
  const contrasena = "ClaveSegura99!";
  const pinNuevo = "357913";

  await sembrarUsuarioLegacy(page, correo, contrasena);

  // Ir a /login → redirigir a /migrar-pin
  await page.goto("/login");
  await page.getByLabel("Correo o usuario").fill(correo);
  await page.getByRole("button", { name: /Siguiente/ }).click();
  await expect(page.getByRole("heading", { name: "Ingresa tu PIN" })).toBeVisible();
  await rellenarPin(page, "246810");
  await expect(page).toHaveURL(/\/migrar-pin/, { timeout: 10_000 });

  // Rellenar formulario de migración
  await page.getByTestId("migrar-contrasena").fill(contrasena);
  await rellenarPinPor(page, "migrar-pin", pinNuevo);
  await rellenarPinPor(page, "migrar-pin-conf", pinNuevo);
  await page.getByRole("button", { name: /Crear PIN y entrar/ }).click();

  // Debe quedar logueado en dashboard u onboarding
  await expect(page).toHaveURL(/\/(dashboard|onboarding)$/, { timeout: 12_000 });
});

test("migración: contraseña incorrecta muestra error", async ({ page }) => {
  const correo = `e2e_migrar_err_${Date.now()}@test.local`;
  const contrasena = "ClaveReal77!";
  const pinNuevo = "468024";

  await sembrarUsuarioLegacy(page, correo, contrasena);

  // Ir directamente a /migrar-pin
  await page.goto(`/migrar-pin?u=${encodeURIComponent(correo)}`);
  await expect(page.getByRole("heading", { name: "Crea tu PIN" })).toBeVisible();

  await page.getByTestId("migrar-contrasena").fill("ClaveEquivocada1!");
  await rellenarPinPor(page, "migrar-pin", pinNuevo);
  await rellenarPinPor(page, "migrar-pin-conf", pinNuevo);
  await page.getByRole("button", { name: /Crear PIN y entrar/ }).click();

  await expect(page.getByTestId("migrar-error")).toContainText(/Contraseña incorrecta/, {
    timeout: 8_000,
  });
  // Los campos PIN deben quedar vacíos tras el reset
  await expect(page.getByTestId("migrar-pin-0")).toHaveValue("");
});

// ─── flujo de registro completo ─────────────────────────────────────────────

test("registro completo: correo → OTP → PIN → datos → completado → login", async ({
  page,
}) => {
  const correo = `e2e_reg_${Date.now()}@test.local`;
  const usuario = `reg${Date.now().toString().slice(-9)}`;
  const pin = "357913";

  // ── Paso 1: correo ──────────────────────────────────────────────────────
  await page.goto("/registro");
  await expect(
    page.getByRole("heading", { name: "Crea tu cuenta gratis" }),
  ).toBeVisible();
  await page.getByLabel("Correo").fill(correo);
  await page.getByRole("button", { name: "Siguiente" }).click();

  // ── Paso OTP: /verificar ────────────────────────────────────────────────
  await expect(page).toHaveURL(/\/verificar$/, { timeout: 10_000 });
  await expect(page.getByText(/código de 6 dígitos/i)).toBeVisible();

  // Planta un OTP conocido y obtiene el código
  const codigo = await obtenerOtp(page, correo);

  await page.getByLabel("Código").fill(codigo);
  await page.getByRole("button", { name: "Verificar" }).click();

  // ── Paso 2: PIN ─────────────────────────────────────────────────────────
  await expect(page).toHaveURL(/\/registro$/, { timeout: 10_000 });
  await expect(page.getByRole("heading", { name: "Crea tu PIN (clave)" })).toBeVisible();

  await rellenarPinPor(page, "registro-pin", pin);
  await rellenarPinPor(page, "registro-pin-conf", pin);
  await page.getByRole("button", { name: "Continuar" }).click();

  // ── Paso 3: datos ────────────────────────────────────────────────────────
  await expect(
    page.getByRole("heading", { name: "Cuéntanos de ti" }),
  ).toBeVisible({ timeout: 8_000 });

  await page.getByLabel("Nombre", { exact: true }).fill("Test");
  await page.getByLabel("Apellido").fill("E2E");
  await page.getByLabel("Nombre de usuario").fill(usuario);
  await page.getByLabel("País").selectOption("VE");
  await page.getByRole("button", { name: "Crear cuenta" }).click();

  // ── Pantalla de completado ───────────────────────────────────────────────
  await expect(page).toHaveURL(/\/registro\/completado$/, { timeout: 10_000 });
  await expect(
    page.getByRole("heading", { name: /tu cuenta está lista/i }),
  ).toBeVisible();

  // El modal de biometría debe aparecer
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "Entendido" }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();

  // ── Login con el PIN recién creado ───────────────────────────────────────
  await page.getByRole("link", { name: "Iniciar sesión" }).click();
  await expect(page).toHaveURL(/\/login$/, { timeout: 5_000 });

  await page.getByLabel("Correo o usuario").fill(correo);
  await page.getByRole("button", { name: /Siguiente/ }).click();

  await expect(page.getByRole("heading", { name: "Ingresa tu PIN" })).toBeVisible();
  await rellenarPinPor(page, "login-pin", pin);

  await expect(page).toHaveURL(/\/(dashboard|onboarding)$/, { timeout: 10_000 });
});
