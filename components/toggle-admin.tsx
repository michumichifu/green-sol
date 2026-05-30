"use client";

import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";

export function ToggleAdmin() {
  const router = useRouter();
  return (
    <div className="flex items-center justify-between rounded-2xl border bg-card p-4 shadow-sm">
      <span className="flex items-center gap-2 text-sm font-medium">
        <ShieldCheck className="size-4 text-brand" /> Modo super-admin
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={false}
        aria-label="Entrar al panel super-admin"
        onClick={() => router.push("/admin")}
        className="relative h-6 w-11 shrink-0 rounded-full bg-muted-foreground/30 transition-colors"
      >
        <span className="absolute left-0.5 top-0.5 size-5 rounded-full bg-white shadow transition-transform" />
      </button>
    </div>
  );
}
