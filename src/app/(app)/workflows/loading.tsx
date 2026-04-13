import { Skeleton } from "~/components/ui/skeleton";

export default function WorkflowsLoading() {
  return (
    <div className="flex h-full">
      <div className="w-64 border-r p-4 space-y-3">
        <Skeleton className="h-9 w-full" />
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-lg" />
        ))}
      </div>
      <div className="flex-1 p-4">
        <Skeleton className="h-full w-full rounded-lg" />
      </div>
    </div>
  );
}
