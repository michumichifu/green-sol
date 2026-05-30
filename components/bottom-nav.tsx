"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wallet, CalendarClock, Home, Calculator, User } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/sanes", label: "Ahorro", icon: Wallet },
  { href: "/pagos", label: "Pagos", icon: CalendarClock },
  { href: "/dashboard", label: "Inicio", icon: Home },
  { href: "/calculadora", label: "Calculadora", icon: Calculator },
  { href: "/perfil", label: "Perfil", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="z-30 border-t bg-background/95 backdrop-blur">
      <ul className="mx-auto flex max-w-md items-stretch">
        {items.map(({ href, label, icon: Icon }) => {
          const activo =
            pathname === href || pathname.startsWith(href + "/");
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className={cn(
                  "flex flex-col items-center gap-1 py-2 text-[10px] font-medium transition-colors",
                  activo
                    ? "text-brand"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <span
                  className={cn(
                    "flex size-8 items-center justify-center rounded-full transition-colors",
                    activo && "bg-brand/10",
                  )}
                >
                  <Icon className="size-5" strokeWidth={activo ? 2.4 : 2} />
                </span>
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
