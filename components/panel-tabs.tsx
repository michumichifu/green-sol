"use client";

import { Children, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PanelTabs({
  tabs,
  children,
}: {
  tabs: string[];
  children: ReactNode;
}) {
  const [activo, setActivo] = useState(0);
  const secciones = Children.toArray(children);

  return (
    <div>
      <div className="mb-5 flex gap-1 overflow-x-auto rounded-xl bg-muted p-1 scrollbar-hide">
        {tabs.map((t, i) => (
          <button
            key={t}
            type="button"
            onClick={() => setActivo(i)}
            className={cn(
              "flex-1 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              activo === i
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="animate-in fade-in duration-200">{secciones[activo]}</div>
    </div>
  );
}
