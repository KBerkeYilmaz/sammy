import { Skeleton } from "~/components/ui/skeleton";

export default function PipelineLoading() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-7 w-52" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-32" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, col) => (
          <div key={col} className="space-y-3">
            <Skeleton className="h-5 w-20" />
            {Array.from({ length: 3 }).map((_, row) => (
              <Skeleton key={row} className="h-28 w-full rounded-lg" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
