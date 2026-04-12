"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SidebarTrigger } from "~/components/ui/sidebar";

const TABS = [
  { label: "Dashboard", href: "/pipeline" },
  { label: "Briefs", href: "/pipeline/briefs" },
  { label: "Settings", href: "/pipeline/settings" },
  { label: "History", href: "/pipeline/history" },
];

export default function PipelineLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col">
      <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <div className="h-4 w-px bg-border" />
        <h1 className="text-sm font-semibold">Pipeline</h1>
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
      </header>
      <div className="flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}
