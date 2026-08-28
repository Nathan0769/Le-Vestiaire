import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Point d'entrée du login social natif.
 *
 * Ouvert par l'app iOS dans ASWebAuthenticationSession. Renvoie une page qui,
 * DANS LE NAVIGATEUR, initie le sign-in social (POST /sign-in/social). C'est
 * indispensable : le cookie d'état OAuth (`__Secure-better-auth.state`) doit
 * être posé dans le navigateur, pas dans le pot de l'app, sinon le callback
 * Google échoue la vérification d'état.
 *
 * Après consentement Google → callback Better Auth (cookie state présent) →
 * session posée → redirection vers /api/auth/native-bridge → deep link
 * levestiaire://auth?token=… capturé par l'app.
 */
export async function GET(request: Request) {
  const provider = new URL(request.url).searchParams.get("provider") ?? "google";
  const safeProvider = /^[a-z]+$/.test(provider) ? provider : "google";

  const body = JSON.stringify({
    provider: safeProvider,
    callbackURL: "https://le-vestiaire-foot.fr/api/auth/native-bridge",
  });

  const html = `<!doctype html>
<html lang="fr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Connexion…</title>
<style>
  html,body{height:100%;margin:0;font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text",sans-serif;background:#0D0F1A;color:#EEF0F6}
  .c{height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px}
  .s{width:26px;height:26px;border:3px solid rgba(255,255,255,.2);border-top-color:#4A7FD4;border-radius:50%;animation:r .8s linear infinite}
  @keyframes r{to{transform:rotate(360deg)}}
  p{font-size:14px;color:#8A90A8}
</style></head>
<body><div class="c"><div class="s"></div><p id="m">Connexion sécurisée…</p></div>
<script>
  fetch("/api/auth/sign-in/social",{method:"POST",headers:{"Content-Type":"application/json"},body:${JSON.stringify(body)}})
    .then(function(r){return r.json()})
    .then(function(d){ if(d&&d.url){location.href=d.url} else {location.href="levestiaire://auth?error=init"} })
    .catch(function(){ location.href="levestiaire://auth?error=network" });
</script></body></html>`;

  return new NextResponse(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  });
}
