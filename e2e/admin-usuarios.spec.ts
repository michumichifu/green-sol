import { test, expect } from "@playwright/test";

/**
 * Smoke del módulo de gestión de usuarios en el panel super-admin.
 *
 * Estrategia de acceso:
 *   - Llama a /api/test/seed-admin para:
 *       a) sembrar dos usuarios @test.local buscables (deterministas), y
 *       b) crear la sesión como qa@greensol.local (super_admin ya existente).
 *   - Navega al panel /admin, activa la pestaña "Usuarios",
 *     busca uno de los usuarios sembrados, verifica que aparece en la lista
 *     y abre su ficha (modal).
 */

const SUFIJO = `smoke_${Date.now()}`;
const CORREO_U1 = `e2e_admin_u1_${SUFIJO}@test.local`;

test("admin: buscar usuario sembrado y abrir ficha", async ({ page }) => {
  // 1. Sembrar usuarios y autenticar como super_admin
  const res = await page.request.post("/api/test/seed-admin", {
    data: { sufijo: SUFIJO },
  });
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  expect(body.ok).toBe(true);

  // 2. Ir al panel admin
  await page.goto("/admin");
  // El layout verifica que es super_admin; si no, devuelve notFound (404).
  await expect(page).toHaveURL(/\/admin/, { timeout: 10_000 });
  await expect(page.getByRole("heading", { name: /Panel super-admin/i })).toBeVisible();

  // 3. Activar la pestaña "Usuarios"
  await page.getByRole("button", { name: "Usuarios" }).click();

  // 4. Escribir el correo del usuario sembrado en el buscador y buscar
  await page.getByLabel("Buscar usuarios").fill(CORREO_U1);
  await page.getByRole("button", { name: "Buscar" }).click();

  // 5. Verificar que el usuario aparece en la lista
  await expect(page.getByText(CORREO_U1)).toBeVisible({ timeout: 8_000 });

  // 6. Tocar el ícono "Ver ficha" del resultado
  // La fila es un div con la clase bg-card que contiene el correo exacto.
  // Usamos locator con texto exacto para no coincidir con contenedores padre.
  const fila = page
    .locator("div.bg-card")
    .filter({ hasText: CORREO_U1 })
    .first();
  await fila.getByRole("button", { name: "Ver ficha" }).click();

  // 7. Verificar que el modal abre y muestra datos del usuario
  // La ficha carga su contenido de forma asíncrona (server action obtenerFicha).
  const modal = page.getByRole("dialog", { name: "Ficha de usuario" });
  await expect(modal).toBeVisible({ timeout: 8_000 });
  // Esperar a que el spinner de carga desaparezca (la ficha resolvió)
  await expect(modal.locator(".animate-spin")).not.toBeVisible({ timeout: 10_000 });
  // El correo aparece como nombre (primer p) y como subtítulo (segundo p)
  await expect(modal.getByText(CORREO_U1).first()).toBeVisible({ timeout: 10_000 });
});
