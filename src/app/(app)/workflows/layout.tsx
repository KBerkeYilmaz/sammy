import { SidebarTrigger } from "~/components/ui/sidebar";

export default function WorkflowsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <div className="h-4 w-px bg-border" />
        <h1 className="text-sm font-semibold">Workflows</h1>
      </header>
      <div className="flex-1 overflow-hidden">{children}</div>
    </div>
  );
}
