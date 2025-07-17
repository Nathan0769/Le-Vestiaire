import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-muted p-6 md:p-10">
      <div className="w-full max-w-md space-y-4">{children}</div>
      <Link
        href="/"
        className="mt-6 text-sm text-muted-foreground hover:underline"
      >
        ← Revenir à l’accueil
      </Link>
    </div>
  );
}
