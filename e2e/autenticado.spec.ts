import { test, expect } from "@playwright/test";

test("flujo autenticado: dashboard con tasas y crear un san", async ({
  page,
}) => {
  const correo = `e2e_auth_${Date.now()}@test.local`;

  // Autenticar vía el endpoint de prueba (solo dev). page.request comparte cookies con page.
  const res = await page.request.post("/api/test/sesion", {
    data: { correo },
  });
  expect(res.ok()).toBeTruthy();

  // Dashboard carga (hero de bienvenida)
  await page.goto("/dashboard");
  await expect(
    page.getByRole("heading", { name: /Tu ahorro/ }),
  ).toBeVisible();

  // Crear un san con el asistente por pasos
  await page.goto("/sanes/crear");
  // Paso 1: tipo
  await page.getByRole("button", { name: /Susi/ }).click();
  await page.getByRole("button", { name: /Siguiente/ }).click();
  // Paso 2: título
  await page.getByLabel(/título le quieres poner/).fill("San E2E");
  await page.getByRole("button", { name: /Siguiente/ }).click();
  // Paso 3: visibilidad (privado por defecto)
  await page.getByRole("button", { name: /Siguiente/ }).click();
  // Paso 4: moneda (Solana; el texto exacto evita chocar con "USDC (Solana)")
  await page.getByText("Solana (SOL)").click();
  await page.getByRole("button", { name: /Siguiente/ }).click();
  // Paso 5: detalles del san (participantes → meta por turno → frecuencia)
  await page.getByLabel(/Cuántas personas/).fill("5");
  await page.getByLabel(/Meta por turno/).fill("100");
  await page.getByRole("button", { name: "Mensual" }).click();
  await page.getByRole("button", { name: /Siguiente/ }).click();
  // Paso 6: crear
  await page.getByRole("button", { name: /Crear ahorro/ }).click();
  await expect(page.getByRole("heading", { name: "San E2E" })).toBeVisible();
});
