export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-full items-center justify-center bg-muted/30 px-4 py-12">
      {children}
    </div>
  );
}
