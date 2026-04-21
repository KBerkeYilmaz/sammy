import { PageHeader } from "~/components/page-header";
import { PipelineTabs } from "./_components/pipeline-tabs";

export default function PipelineLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-full flex-col">
      <PageHeader title="Pipeline">
        <PipelineTabs />
      </PageHeader>
      <div className="flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}
