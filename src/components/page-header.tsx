import { SidebarTrigger } from "~/components/ui/sidebar";

export function PageHeader({
  title,
  children,
}: {
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1" />
      <div className="h-4 w-px bg-border" />
      <h1 className="text-sm font-semibold">{title}</h1>
      {children}
    </header>
  );
}
