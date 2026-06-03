import { test, expect } from "@playwright/test";

const PIN_E2E = "123456";

test("flujo autenticado: dashboard con tasas y crear un san", async ({
  page,
}) => {
  const correo = `e2e_auth_${Date.now()}@test.local`;

  // Autenticar vía el endpoint de prueba (solo dev). page.request comparte cookies con page.
  const res = await page.request.post("/api/test/sesion", {
    data: { correo },
  });
  expect(res.ok()).toBeTruthy();

  // Asignar un PIN conocido al usuario para que pase la validación al crear.
  const resPin = await page.request.post("/api/test/seed-pin", {
    data: { correo, pin: PIN_E2E },
  });
  expect(resPin.ok()).toBeTruthy();

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
  // Paso 4: moneda (Solana; "SOL (Solana)" no choca con "USDC (Solana)")
  await page.getByText("SOL (Solana)").click();
  await page.getByRole("button", { name: /Siguiente/ }).click();
  // Paso 5: detalles del san (participantes → meta por turno → frecuencia)
  await page.getByLabel(/Cuántas personas/).fill("5");
  await page.getByLabel(/Meta por turno/).fill("100");
  await page.getByRole("button", { name: "Mensual" }).click();
  await page.getByRole("button", { name: /Siguiente/ }).click();
  // Paso 6: elegir el método de pago del perfil (Wallet E2E)
  await page.getByRole("button", { name: /Wallet E2E/ }).click();
  await page.getByRole("button", { name: /Siguiente/ }).click();
  // Paso 7: casilla de responsabilidad + PIN + crear
  await page.getByRole("checkbox").click();
  for (let i = 0; i < PIN_E2E.length; i++) {
    await page.getByTestId(`crear-pin-${i}`).fill(PIN_E2E[i]);
  }
  await page.getByRole("button", { name: /Crear ahorro/ }).click();
  await expect(page.getByRole("heading", { name: "San E2E" })).toBeVisible();

  // === Detalle del san: pestañas Resumen / Miembros / Pagos ===

  // Las tres pestañas deben estar visibles.
  const tabResumen = page.getByRole("button", { name: "Resumen" });
  const tabMiembros = page.getByRole("button", { name: "Miembros" });
  const tabPagos = page.getByRole("button", { name: "Pagos" });
  await expect(tabResumen).toBeVisible();
  await expect(tabMiembros).toBeVisible();
  await expect(tabPagos).toBeVisible();

  // La pestaña Resumen está activa por defecto; muestra el progreso del san.
  await expect(page.getByText(/Ronda \d+ de \d+/)).toBeVisible();

  // Click en "Miembros" → la lista de participantes vive aquí.
  await tabMiembros.click();
  await expect(page.getByText(/Participantes/)).toBeVisible();

  // Click en "Pagos" → como el usuario es el ORGANIZADOR del san recién creado,
  // se muestran las sub-pestañas "Pendientes" y "Aprobados".
  await tabPagos.click();
  await expect(page.getByRole("button", { name: "Pendientes" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Aprobados" })).toBeVisible();

  // La sub-pestaña Pendientes está activa; sin aportes aún → estado vacío.
  await expect(page.getByText("No hay pagos por revisar.")).toBeVisible();

  // === Invitación temporal: el organizador genera un enlace con código corto ===
  await tabResumen.click();
  await page.getByRole("button", { name: /Generar invitación/ }).click();
  // Aparece una invitación con código corto "GS-XXXXXX".
  await expect(page.getByText(/GS-[A-Z0-9]{6}/)).toBeVisible({ timeout: 10_000 });
});
