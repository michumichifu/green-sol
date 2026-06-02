import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  // El flujo KYC integral (dos contextos + server actions + modales) puede tardar
  // bajo carga local; un reintento evita falsos negativos por timing.
  retries: 1,
  reporter: "line",
  globalSetup: "./e2e/global-setup.ts",
  globalTeardown: "./e2e/global-teardown.ts",
  use: { baseURL: "http://localhost:3100" },
  webServer: {
    // DATABASE_URL ya apunta a greensol_test — heredado del wrapper scripts/e2e-test.mjs
    command: "next dev -p 3100",
    url: "http://localhost:3100",
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
