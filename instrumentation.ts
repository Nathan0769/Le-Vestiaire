import type { Instrumentation } from "next";

export function register() {}

/**
 * Erreurs non attrapées (routes, Server Components, actions) : remontées dans
 * `error_events`. Les catch des routes appellent `reportError` eux-mêmes.
 */
export const onRequestError: Instrumentation.onRequestError = async (error, request, context) => {
  // Prisma et crypto ne tournent pas sur le runtime edge (middleware). L'import
  // doit rester dans ce bloc : Next ne l'élimine du bundle edge que sous cette
  // condition exacte (un return anticipé le laisse compiler pour edge).
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { reportError } = await import("@/lib/report-error");
    // routePath (« /api/jerseys/[id] ») et non l'URL réelle : une même erreur
    // reste un seul groupe quel que soit le slug.
    const where = `${request.method} ${context.routePath}`;
    const reported =
      error instanceof Error
        ? Object.assign(new Error(`${where}: ${error.message}`), { name: error.name, stack: error.stack })
        : `${where}: ${String(error)}`;
    await reportError(`next.${context.routeType}`, reported);
  }
};
