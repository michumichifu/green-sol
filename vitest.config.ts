import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
import "dotenv/config";

export default defineConfig({
  test: { environment: "node" },
  resolve: {
    alias: { "@": fileURLToPath(new URL("./", import.meta.url)) },
  },
});
