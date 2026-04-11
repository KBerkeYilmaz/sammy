import "~/styles/globals.css";

import { type Metadata } from "next";
import { DM_Sans, JetBrains_Mono } from "next/font/google";

import { TRPCReactProvider } from "~/trpc/react";
import { TooltipProvider } from "~/components/ui/tooltip";
import { AppSidebar } from "~/app/_components/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
} from "~/components/ui/sidebar";

export const metadata: Metadata = {
  title: "Sammy — Federal Contract Intelligence",
  description: "AI-powered SAM.gov opportunity intelligence",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  weight: ["400", "500", "600", "700"],
});

const jbMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jb-mono",
  weight: ["400", "500"],
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`h-full ${dmSans.variable} ${jbMono.variable}`}>
      <body className="h-full">
        <TRPCReactProvider>
          <TooltipProvider>
            <SidebarProvider>
              <AppSidebar />
              <SidebarInset>{children}</SidebarInset>
            </SidebarProvider>
          </TooltipProvider>
        </TRPCReactProvider>
      </body>
    </html>
  );
}
