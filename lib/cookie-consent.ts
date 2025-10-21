"use client";

/**
 * Utilitaires pour gérer le consentement des cookies (RGPD/CNIL)
 */

const COOKIE_CONSENT_NAME = "cookieConsent";
const COOKIE_CONSENT_ANALYTICS = "cookieConsentAnalytics";

/**
 * Vérifie si l'utilisateur a donné son consentement pour les cookies
 */
export function hasConsent(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie.includes(`${COOKIE_CONSENT_NAME}=true`);
}

/**
 * Vérifie si l'utilisateur a accepté les cookies analytics
 */
export function hasAnalyticsConsent(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie.includes(`${COOKIE_CONSENT_ANALYTICS}=true`);
}

/**
 * Définit le consentement pour les cookies
 */
export function setConsent(analytics: boolean): void {
  const expires = "expires=Fri, 31 Dec 9999 23:59:59 GMT";

  // Cookie de consentement général
  document.cookie = `${COOKIE_CONSENT_NAME}=true; ${expires}; path=/; SameSite=Lax`;

  // Cookie spécifique pour les analytics
  if (analytics) {
    document.cookie = `${COOKIE_CONSENT_ANALYTICS}=true; ${expires}; path=/; SameSite=Lax`;
  } else {
    // Supprime le cookie analytics si refusé
    document.cookie = `${COOKIE_CONSENT_ANALYTICS}=false; ${expires}; path=/; SameSite=Lax`;
  }
}

/**
 * Supprime tous les cookies de consentement (pour réinitialiser)
 */
export function clearConsent(): void {
  document.cookie = `${COOKIE_CONSENT_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
  document.cookie = `${COOKIE_CONSENT_ANALYTICS}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;

  // Recharge la page pour afficher à nouveau la bannière
  if (typeof window !== "undefined") {
    window.location.reload();
  }
}

/**
 * Refuse tous les cookies non-essentiels
 */
export function declineConsent(): void {
  const expires = "expires=Fri, 31 Dec 9999 23:59:59 GMT";
  document.cookie = `${COOKIE_CONSENT_NAME}=true; ${expires}; path=/; SameSite=Lax`;
  document.cookie = `${COOKIE_CONSENT_ANALYTICS}=false; ${expires}; path=/; SameSite=Lax`;
}
