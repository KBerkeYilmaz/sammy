import { PageHeader } from "~/components/page-header";

export default function WorkflowsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <PageHeader title="Workflows" />
      <div className="flex-1 overflow-hidden">{children}</div>
    </div>
  );
}
