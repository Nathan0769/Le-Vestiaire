"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { useTranslations } from "next-intl";

const DISMISS_KEY = "ios-app-banner-dismissed-v1";
const APP_STORE_URL = "https://apps.apple.com/fr/app/le-vestiaire-foot/id6808174449";

/**
 * Bandeau "app iOS disponible" en haut de la homepage.
 * - Gaté par NEXT_PUBLIC_APP_STORE_URL : invisible tant que le lien n'est pas
 *   renseigné (rien ne fuite avant la mise en ligne).
 * - Fermeture persistée (localStorage).
 * Design fourni (DA Nuit de Stade), responsive via <style> scopé sur l'id.
 */
export function IosAppBanner() {
  const t = useTranslations("HomePage.iosBanner");
  const url = process.env.NEXT_PUBLIC_APP_STORE_URL || APP_STORE_URL;
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    setHidden(localStorage.getItem(DISMISS_KEY) === "1");
  }, []);

  if (hidden) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
    setHidden(true);
  };

  return (
    <>
      <div id="ios-app-banner" role="banner" style={outer}>
        <div style={inner}>
          <div style={wordmark}>LE VESTIAIRE FOOT</div>
          <div style={separator} />
          <div style={message}>
            <span className="bn-full">{t("message")}</span>
            <span className="bn-short">{t("messageShort")}</span>
          </div>

          <a href={url} target="_blank" rel="noopener noreferrer" style={badge}>
            <span style={appleWrap} aria-hidden>
              <svg viewBox="0 0 384 512" width="15" height="17" fill="currentColor">
                <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
              </svg>
            </span>
            <span>{t("cta")}</span>
          </a>

          <button type="button" aria-label="Fermer" onClick={dismiss} style={closeBtn}>
            ×
          </button>
        </div>
      </div>

      <style>{`
        #ios-app-banner .bn-short { display:none; }
        @media (max-width: 700px) {
          #ios-app-banner > div { padding:8px 44px 8px 16px !important; gap:12px !important; justify-content:flex-start !important; }
          #ios-app-banner > div > div:nth-child(1) { display:none !important; }
          #ios-app-banner > div > div:nth-child(2) { display:none !important; }
          #ios-app-banner > div > div:nth-child(3) { flex:1 !important; }
          #ios-app-banner .bn-full { display:none !important; }
          #ios-app-banner .bn-short { display:inline !important; }
          #ios-app-banner a { height:30px !important; padding:0 10px !important; font-size:11px !important; gap:6px !important; }
          #ios-app-banner a span:first-child svg { width:13px !important; height:15px !important; }
          #ios-app-banner button { right:10px !important; }
        }
      `}</style>
    </>
  );
}

const outer: CSSProperties = {
  position: "fixed",
  left: 0,
  right: 0,
  bottom: 0,
  zIndex: 40,
  width: "100%",
  boxSizing: "border-box",
  background: "#15171f",
  color: "#ffffff",
  boxShadow: "0 -6px 24px -8px rgba(0,0,0,0.5)",
  fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif",
};

const inner: CSSProperties = {
  width: "100%",
  maxWidth: 1440,
  minHeight: 54,
  margin: "0 auto",
  padding: "8px 24px",
  boxSizing: "border-box",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 22,
  position: "relative",
};

const wordmark: CSSProperties = {
  flex: "0 0 auto",
  color: "#C9A84C",
  fontSize: 11,
  lineHeight: 1,
  fontWeight: 800,
  letterSpacing: "2.5px",
  whiteSpace: "nowrap",
};

const separator: CSSProperties = { width: 1, height: 18, background: "#3b3b42", flex: "0 0 auto" };

const message: CSSProperties = {
  color: "#f5f5f6",
  fontSize: 13,
  lineHeight: "18px",
  fontWeight: 500,
  whiteSpace: "nowrap",
};

const badge: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  height: 32,
  padding: "0 12px",
  boxSizing: "border-box",
  background: "#C9A84C",
  color: "#0b0c12",
  borderRadius: 7,
  textDecoration: "none",
  fontSize: 12,
  lineHeight: 1,
  fontWeight: 700,
  whiteSpace: "nowrap",
  flex: "0 0 auto",
};

const appleWrap: CSSProperties = { display: "inline-flex", alignItems: "center" };

const closeBtn: CSSProperties = {
  position: "absolute",
  right: 18,
  top: "50%",
  transform: "translateY(-50%)",
  width: 28,
  height: 28,
  padding: 0,
  border: 0,
  background: "transparent",
  color: "#8e8f96",
  cursor: "pointer",
  fontSize: 21,
  lineHeight: "28px",
  fontWeight: 300,
};
