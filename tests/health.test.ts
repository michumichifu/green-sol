import { describe, it, expect } from "vitest";
import { GET } from "@/app/api/health/route";

describe("GET /api/health", () => {
  it("responde ok:true y db:true cuando la base de datos está accesible", async () => {
    const res = await GET();
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.db).toBe(true);
  });
});
