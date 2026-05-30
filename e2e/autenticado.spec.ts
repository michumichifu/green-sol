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

  // Crear un san
  await page.goto("/sanes/crear");
  await page.getByLabel("Nombre").fill("San E2E");
  await page.getByLabel(/Aporte por turno/).fill("20");
  await page.getByRole("button", { name: "Crear", exact: true }).click();
  await expect(page.getByRole("heading", { name: "San E2E" })).toBeVisible();
});
