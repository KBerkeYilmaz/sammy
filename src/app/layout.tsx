import "~/styles/globals.css";

import { type Metadata } from "next";
import { DM_Sans, JetBrains_Mono } from "next/font/google";
import Link from "next/link";

import { TRPCReactProvider } from "~/trpc/react";

export const metadata: Metadata = {
  title: "SCOUT — Federal Contract Intelligence",
  description: "AI-powered SAM.gov opportunity intelligence by Sammy",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  weight: ["300", "400", "500", "600", "700"],
});

const jbMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jb-mono",
  weight: ["300", "400", "500", "600"],
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`h-full ${dmSans.variable} ${jbMono.variable}`}>
      <body className="h-full flex flex-col">
        <TRPCReactProvider>
          <Topbar />
          {/* flex-1 min-h-0: lets children fill remaining height and scroll internally */}
          <div className="flex flex-col flex-1 min-h-0">{children}</div>
        </TRPCReactProvider>
      </body>
    </html>
  );
}

function Topbar() {
  return (
    <header className="shrink-0 h-12 flex items-center border-b border-border bg-[oklch(0.09_0.008_250)] z-50 px-3 gap-2">
      {/* Brand */}
      <Link href="/" className="flex items-center gap-2 shrink-0 mr-1">
        <svg viewBox="0 0 24 24" fill="none" className="size-5 shrink-0">
          <polygon
            points="12,2 22,7 22,17 12,22 2,17 2,7"
            stroke="oklch(0.78 0.14 68)"
            strokeWidth="1.5"
            fill="oklch(0.78 0.14 68 / 0.08)"
          />
          <circle cx="12" cy="12" r="3" fill="oklch(0.78 0.14 68)" />
        </svg>
        <span className="text-sm font-bold tracking-[0.14em] uppercase text-[oklch(0.78_0.14_68)] hidden sm:block select-none">
          SCOUT
        </span>
      </Link>

      <div className="h-5 w-px bg-border mx-1 hidden sm:block shrink-0" />

      {/* Nav */}
      <nav className="flex items-center gap-0.5">
        <NavLink href="/" label="Scout" />
        <NavLink href="/explore" label="Intel Feed" />
        <NavLink href="/admin" label="Admin" />
      </nav>

      <div className="flex-1" />

      {/* Live indicator */}
      <div className="flex items-center gap-1.5 text-[10px] font-mono text-[oklch(0.72_0.14_195)] select-none">
        <span className="size-1.5 rounded-full bg-[oklch(0.72_0.14_195)] animate-pulse shrink-0" />
        <span className="hidden sm:block tracking-widest">LIVE</span>
      </div>
    </header>
  );
}

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="px-3 py-1.5 rounded-sm text-[11px] font-mono font-medium tracking-widest uppercase text-[oklch(0.52_0.008_250)] hover:text-[oklch(0.78_0.14_68)] hover:bg-[oklch(0.78_0.14_68/0.08)] transition-colors whitespace-nowrap"
    >
      {label}
    </Link>
  );
}
