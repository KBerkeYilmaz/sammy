import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
      <div className="max-w-md text-center space-y-4 px-6">
        <h2 className="text-4xl font-bold">404</h2>
        <p className="text-sm text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist.
        </p>
        <Link
          href="/"
          className="inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Back to Sammy
        </Link>
      </div>
    </div>
  );
}
