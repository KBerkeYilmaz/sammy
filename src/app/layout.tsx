import "~/styles/globals.css";

import { type Metadata } from "next";
import { DM_Sans, JetBrains_Mono, Rajdhani } from "next/font/google";
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
  weight: ["300", "400", "500", "600"],
});

const jbMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jb-mono",
  weight: ["300", "400", "500", "600"],
});

const rajdhani = Rajdhani({
  subsets: ["latin"],
  variable: "--font-rajdhani",
  weight: ["400", "500", "600", "700"],
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${jbMono.variable} ${rajdhani.variable}`}
    >
      <body className="flex min-h-screen flex-col">
        <TRPCReactProvider>
          <Topbar />
          <div className="flex flex-1 flex-col">{children}</div>
        </TRPCReactProvider>
      </body>
    </html>
  );
}

function Topbar() {
  return (
    <header className="sticky top-0 z-50 flex-shrink-0 border-b border-border bg-[oklch(0.09_0.008_250)/95] backdrop-blur-sm">
      {/* Classification strip */}
      <div className="scout-classification-bar text-[10px] font-mono tracking-widest uppercase">
        <span className="text-[oklch(0.78_0.14_68)] font-semibold">
          SAMMY INTEL PLATFORM
        </span>
        <span className="text-[oklch(0.52_0.008_250)]">
          POWERED BY SAM.GOV · AWS BEDROCK
        </span>
      </div>

      {/* Main nav bar */}
      <div className="flex h-12 items-center gap-6 px-4">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
          {/* Logo mark */}
          <div className="relative size-7 flex items-center justify-center">
            <svg viewBox="0 0 28 28" fill="none" className="size-7">
              <polygon
                points="14,2 26,8 26,20 14,26 2,20 2,8"
                stroke="oklch(0.78 0.14 68)"
                strokeWidth="1.5"
                fill="oklch(0.78 0.14 68 / 0.08)"
              />
              <polygon
                points="14,7 21,11 21,17 14,21 7,17 7,11"
                fill="oklch(0.78 0.14 68)"
                opacity="0.6"
              />
              <circle cx="14" cy="14" r="2.5" fill="oklch(0.78 0.14 68)" />
            </svg>
          </div>
          <div>
            <div
              className="text-base font-bold tracking-[0.12em] uppercase leading-none"
              style={{ fontFamily: "var(--font-rajdhani)" }}
            >
              <span style={{ color: "oklch(0.78 0.14 68)" }}>SCOUT</span>
            </div>
            <div className="text-[9px] font-mono tracking-widest uppercase leading-none mt-0.5 text-[oklch(0.52_0.008_250)]">
              GovCon Intel
            </div>
          </div>
        </Link>

        {/* Divider */}
        <div className="h-6 w-px bg-border mx-1" />

        {/* Nav links */}
        <nav className="flex items-center gap-1">
          <NavLink href="/" label="SCOUT" sub="chat" />
          <NavLink href="/explore" label="INTEL FEED" sub="opportunities" />
          <NavLink href="/admin" label="ADMIN" sub="ingest" />
        </nav>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Status */}
        <div className="hidden sm:flex items-center gap-4 text-[10px] font-mono">
          <span className="scout-status-live tracking-widest">LIVE</span>
          <span className="text-[oklch(0.52_0.008_250)] tracking-widest">
            SAM.GOV
          </span>
        </div>
      </div>
    </header>
  );
}

function NavLink({
  href,
  label,
  sub,
}: {
  href: string;
  label: string;
  sub: string;
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col items-center px-3 py-1.5 rounded-sm hover:bg-[oklch(0.78_0.14_68/0.08)] transition-colors"
    >
      <span
        className="text-[11px] font-semibold tracking-[0.1em] uppercase leading-none text-[oklch(0.65_0.008_250)] group-hover:text-[oklch(0.78_0.14_68)] transition-colors"
        style={{ fontFamily: "var(--font-rajdhani)" }}
      >
        {label}
      </span>
      <span className="text-[8px] font-mono tracking-widest uppercase leading-none mt-0.5 text-[oklch(0.38_0.008_250)] group-hover:text-[oklch(0.52_0.008_250)] transition-colors">
        {sub}
      </span>
    </Link>
  );
}
