"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { label: "Dashboard", href: "/pipeline" },
  { label: "Briefs", href: "/pipeline/briefs" },
  { label: "Settings", href: "/pipeline/settings" },
  { label: "History", href: "/pipeline/history" },
];

export function PipelineTabs() {
  const pathname = usePathname();

  return (
    <nav className="ml-6 flex items-center gap-1">
      {TABS.map((tab) => {
        const isActive =
          tab.href === "/pipeline"
            ? pathname === "/pipeline"
            : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
