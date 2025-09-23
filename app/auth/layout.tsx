export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-muted p-2 md:p-2">
      <div className="w-full max-w-md space-y-4">{children}</div>
    </div>
  );
}
