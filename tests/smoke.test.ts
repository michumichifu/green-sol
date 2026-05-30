import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

describe("cn helper", () => {
  it("combina clases y resuelve conflictos de tailwind-merge", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
  });
});
