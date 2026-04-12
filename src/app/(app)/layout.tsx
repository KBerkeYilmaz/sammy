import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "~/server/better-auth";
import { db } from "~/server/db";
import { AppSidebar } from "~/app/_components/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
} from "~/components/ui/sidebar";

export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth.api.getSession({ headers: await headers() });

  // Redirect non-onboarded users to the onboarding flow
  if (session?.user) {
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { isOnboarded: true },
    });

    if (user && !user.isOnboarded) {
      redirect("/onboarding");
    }
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  );
}
