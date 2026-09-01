import http2 from "node:http2";
import jwt from "jsonwebtoken";

/**
 * Envoi de notifications push APNs (HTTP/2 + JWT provider token ES256).
 * Config par env : APNS_KEY_ID, APNS_TEAM_ID, APNS_P8 (contenu de la clé .p8),
 * APNS_BUNDLE_ID (défaut fr.levestiaire.app), APNS_PRODUCTION ("true" = prod).
 * Si non configuré, les envois sont des no-op silencieux.
 */

const KEY_ID = process.env.APNS_KEY_ID;
const TEAM_ID = process.env.APNS_TEAM_ID;
// La clé peut être stockée avec des \n littéraux dans l'env var.
const P8 = process.env.APNS_P8?.replace(/\\n/g, "\n");
const BUNDLE_ID = process.env.APNS_BUNDLE_ID ?? "fr.levestiaire.app";
const HOST =
  process.env.APNS_PRODUCTION === "true"
    ? "https://api.push.apple.com"
    : "https://api.sandbox.push.apple.com";

export function apnsConfigured(): boolean {
  return Boolean(KEY_ID && TEAM_ID && P8);
}

// Le provider token APNs est réutilisable ~1h ; on le régénère toutes les 50 min.
let cachedToken: { value: string; iat: number } | null = null;
function providerToken(): string {
  const now = Math.floor(Date.now() / 1000);
  if (cachedToken && now - cachedToken.iat < 3000) return cachedToken.value;
  const value = jwt.sign({ iss: TEAM_ID, iat: now }, P8 as string, {
    algorithm: "ES256",
    keyid: KEY_ID,
  });
  cachedToken = { value, iat: now };
  return value;
}

export interface ApnsPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
  badge?: number;
}

export interface ApnsResult {
  ok: boolean;
  status: number;
  /** Token à supprimer (410 Unregistered / 400 BadDeviceToken). */
  invalid: boolean;
}

export async function sendApns(
  deviceToken: string,
  payload: ApnsPayload
): Promise<ApnsResult> {
  if (!apnsConfigured()) return { ok: false, status: 0, invalid: false };

  const body = JSON.stringify({
    aps: {
      alert: { title: payload.title, body: payload.body },
      sound: "default",
      ...(payload.badge !== undefined ? { badge: payload.badge } : {}),
    },
    ...(payload.data ?? {}),
  });

  return new Promise<ApnsResult>((resolve) => {
    let settled = false;
    const done = (r: ApnsResult) => {
      if (settled) return;
      settled = true;
      resolve(r);
    };

    const client = http2.connect(HOST);
    client.on("error", () => done({ ok: false, status: 0, invalid: false }));

    const req = client.request({
      ":method": "POST",
      ":path": `/3/device/${deviceToken}`,
      authorization: `bearer ${providerToken()}`,
      "apns-topic": BUNDLE_ID,
      "apns-push-type": "alert",
      "apns-priority": "10",
      "content-type": "application/json",
    });

    let status = 0;
    let data = "";
    req.on("response", (headers) => {
      status = Number(headers[":status"] ?? 0);
    });
    req.setEncoding("utf8");
    req.on("data", (chunk) => {
      data += chunk;
    });
    req.on("end", () => {
      client.close();
      const invalid =
        status === 410 || (status === 400 && data.includes("BadDeviceToken"));
      done({ ok: status === 200, status, invalid });
    });
    req.on("error", () => {
      client.close();
      done({ ok: false, status: 0, invalid: false });
    });

    req.write(body);
    req.end();
  });
}
