import { redirect } from "next/navigation";
import { Bug } from "lucide-react";
import { getCurrentUser } from "@/lib/get-current-user";
import { hasPermission } from "@/lib/check-permission";
import prisma from "@/lib/prisma";
import { ResolveErrorButton } from "@/components/admin/errors/resolve-error-button";

export const dynamic = "force-dynamic";

export const metadata = { title: "Erreurs - Administration" };

const dateFormat = new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short" });

export default async function AdminErrorsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");
  if (!user.role || !hasPermission(user.role, { errorEvent: ["list"] })) {
    redirect("/?error=insufficient-permissions");
  }

  const events = await prisma.errorEvent.findMany({
    where: { resolvedAt: null },
    orderBy: { lastSeenAt: "desc" },
    take: 200,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Bug className="w-6 h-6 text-primary" />
        <h2 className="text-2xl font-semibold">Erreurs</h2>
        <span className="text-muted-foreground">{events.length} ouverte{events.length > 1 ? "s" : ""}</span>
      </div>

      {events.length === 0 ? (
        <p className="text-muted-foreground">Aucune erreur ouverte.</p>
      ) : (
        <div className="space-y-3">
          {events.map((e) => (
            <details key={e.id} className="rounded-lg border bg-card p-4">
              <summary className="flex cursor-pointer flex-wrap items-center gap-x-4 gap-y-2">
                <span className="rounded bg-muted px-2 py-0.5 font-mono text-xs">
                  {e.source}
                  {e.appVersion ? ` ${e.appVersion}` : ""}
                </span>
                <span className="font-mono text-sm">{e.context}</span>
                <span className="text-sm font-semibold">×{e.count}</span>
                <span className="ml-auto text-xs text-muted-foreground">
                  vue le {dateFormat.format(e.lastSeenAt)} · depuis le {dateFormat.format(e.firstSeenAt)}
                </span>
                <p className="w-full break-words text-sm">{e.message}</p>
              </summary>
              <div className="mt-3 space-y-3">
                {e.stack && (
                  <pre className="max-h-80 overflow-auto rounded bg-muted p-3 text-xs">{e.stack}</pre>
                )}
                <ResolveErrorButton id={e.id} />
              </div>
            </details>
          ))}
        </div>
      )}
    </div>
  );
}
