import type { NotificationType } from "@prisma/client";
import { defaultLocale, isLocale, type Locale } from "@/i18n/locales";

/**
 * Type de push : les NotificationType stockés + FOLLOW_REQUEST_RECEIVED, qui est
 * un type virtuel (non stocké en base, synthétisé depuis les demandes en attente).
 */
export type PushType = NotificationType | "FOLLOW_REQUEST_RECEIVED";

type PushTextKey =
  | "NEW_FOLLOWER"
  | "FOLLOW_REQUEST_RECEIVED"
  | "FOLLOW_REQUEST_APPROVED"
  | "POST_LIKED"
  | "POST_COMMENTED"
  | "COMMENT_REPLIED";

interface PushText {
  title: string;
  /** Corps du push, `{actor}` remplacé par le pseudo de l'acteur. */
  body: string;
}

// Textes des push par langue. Un push part sans requête de l'app : la langue est
// celle enregistrée avec le token de l'appareil (`PushToken.locale`).
const TEXTS: Record<Locale, Record<PushTextKey, PushText> & { fallback: string }> = {
  fr: {
    NEW_FOLLOWER: { title: "Nouvel abonné", body: "{actor} a commencé à te suivre" },
    FOLLOW_REQUEST_RECEIVED: { title: "Demande d'abonnement", body: "{actor} souhaite te suivre" },
    FOLLOW_REQUEST_APPROVED: { title: "Demande acceptée", body: "{actor} a accepté ta demande" },
    POST_LIKED: { title: "Nouveau like", body: "{actor} a aimé ta publication" },
    POST_COMMENTED: { title: "Nouveau commentaire", body: "{actor} a commenté ta publication" },
    COMMENT_REPLIED: { title: "Nouvelle réponse", body: "{actor} a répondu à ton commentaire" },
    fallback: "Tu as une nouvelle notification",
  },
  en: {
    NEW_FOLLOWER: { title: "New follower", body: "{actor} started following you" },
    FOLLOW_REQUEST_RECEIVED: { title: "Follow request", body: "{actor} wants to follow you" },
    FOLLOW_REQUEST_APPROVED: { title: "Request accepted", body: "{actor} accepted your follow request" },
    POST_LIKED: { title: "New like", body: "{actor} liked your post" },
    POST_COMMENTED: { title: "New comment", body: "{actor} commented on your post" },
    COMMENT_REPLIED: { title: "New reply", body: "{actor} replied to your comment" },
    fallback: "You have a new notification",
  },
  es: {
    NEW_FOLLOWER: { title: "Nuevo seguidor", body: "{actor} ha empezado a seguirte" },
    FOLLOW_REQUEST_RECEIVED: { title: "Solicitud de seguimiento", body: "{actor} quiere seguirte" },
    FOLLOW_REQUEST_APPROVED: { title: "Solicitud aceptada", body: "{actor} ha aceptado tu solicitud" },
    POST_LIKED: { title: "Nuevo me gusta", body: "A {actor} le ha gustado tu publicación" },
    POST_COMMENTED: { title: "Nuevo comentario", body: "{actor} ha comentado tu publicación" },
    COMMENT_REPLIED: { title: "Nueva respuesta", body: "{actor} ha respondido a tu comentario" },
    fallback: "Tienes una nueva notificación",
  },
  de: {
    NEW_FOLLOWER: { title: "Neuer Follower", body: "{actor} folgt dir jetzt" },
    FOLLOW_REQUEST_RECEIVED: { title: "Follower-Anfrage", body: "{actor} möchte dir folgen" },
    FOLLOW_REQUEST_APPROVED: { title: "Anfrage angenommen", body: "{actor} hat deine Anfrage angenommen" },
    POST_LIKED: { title: "Neues Like", body: "{actor} gefällt dein Beitrag" },
    POST_COMMENTED: { title: "Neuer Kommentar", body: "{actor} hat deinen Beitrag kommentiert" },
    COMMENT_REPLIED: { title: "Neue Antwort", body: "{actor} hat auf deinen Kommentar geantwortet" },
    fallback: "Du hast eine neue Benachrichtigung",
  },
  pt: {
    NEW_FOLLOWER: { title: "Novo seguidor", body: "{actor} começou a seguir-te" },
    FOLLOW_REQUEST_RECEIVED: { title: "Pedido para seguir", body: "{actor} quer seguir-te" },
    FOLLOW_REQUEST_APPROVED: { title: "Pedido aceite", body: "{actor} aceitou o teu pedido" },
    POST_LIKED: { title: "Novo gosto", body: "{actor} gostou da tua publicação" },
    POST_COMMENTED: { title: "Novo comentário", body: "{actor} comentou a tua publicação" },
    COMMENT_REPLIED: { title: "Nova resposta", body: "{actor} respondeu ao teu comentário" },
    fallback: "Tens uma nova notificação",
  },
  nl: {
    NEW_FOLLOWER: { title: "Nieuwe volger", body: "{actor} volgt je nu" },
    FOLLOW_REQUEST_RECEIVED: { title: "Volgverzoek", body: "{actor} wil je volgen" },
    FOLLOW_REQUEST_APPROVED: { title: "Verzoek geaccepteerd", body: "{actor} heeft je verzoek geaccepteerd" },
    POST_LIKED: { title: "Nieuwe like", body: "{actor} vindt je bericht leuk" },
    POST_COMMENTED: { title: "Nieuwe reactie", body: "{actor} heeft op je bericht gereageerd" },
    COMMENT_REPLIED: { title: "Nieuw antwoord", body: "{actor} heeft op je reactie geantwoord" },
    fallback: "Je hebt een nieuwe melding",
  },
  it: {
    NEW_FOLLOWER: { title: "Nuovo follower", body: "{actor} ha iniziato a seguirti" },
    FOLLOW_REQUEST_RECEIVED: { title: "Richiesta di follow", body: "{actor} vuole seguirti" },
    FOLLOW_REQUEST_APPROVED: { title: "Richiesta accettata", body: "{actor} ha accettato la tua richiesta" },
    POST_LIKED: { title: "Nuovo like", body: "A {actor} piace il tuo post" },
    POST_COMMENTED: { title: "Nuovo commento", body: "{actor} ha commentato il tuo post" },
    COMMENT_REPLIED: { title: "Nuova risposta", body: "{actor} ha risposto al tuo commento" },
    fallback: "Hai una nuova notifica",
  },
};

/**
 * Titre et corps d'un push dans la langue de l'appareil destinataire.
 * Langue absente (ancien token) ou inconnue : français.
 */
export function buildPushMessage(
  type: PushType,
  actor: string,
  locale: string | null | undefined,
): { title: string; body: string } {
  const texts = TEXTS[locale && isLocale(locale) ? locale : defaultLocale];
  const text = (texts as Partial<Record<PushType, PushText>>)[type];
  if (!text) return { title: "Le Vestiaire", body: texts.fallback };
  return { title: text.title, body: text.body.replace("{actor}", actor) };
}
