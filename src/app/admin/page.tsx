export default function AdminPage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-2">Admin</h1>
      <p className="text-muted-foreground text-sm mb-6">
        Trigger ingestion and view database stats.
      </p>

      <div className="grid grid-cols-3 gap-4 text-sm">
        <div className="rounded-lg border p-4">
          <p className="text-muted-foreground">Opportunities</p>
          <p className="text-2xl font-bold">—</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-muted-foreground">Chunks</p>
          <p className="text-2xl font-bold">—</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-muted-foreground">Last Sync</p>
          <p className="text-2xl font-bold">—</p>
        </div>
      </div>
    </main>
  );
}
