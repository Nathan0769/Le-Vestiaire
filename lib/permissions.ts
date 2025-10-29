import { createAccessControl } from "better-auth/plugins/access";

/**
 * Définition des permissions pour Le Vestiaire
 *
 * Rôles:
 * - USER: Utilisateur standard, peut gérer sa collection
 * - CONTRIBUTOR: Peut proposer de nouveaux maillots
 * - ADMIN: Peut approuver/rejeter les propositions et gérer les rôles
 * - SUPERADMIN: Accès complet, peut gérer tous les admins (réservé au propriétaire)
 */

// Définir les permissions personnalisées
export const statement = {
  jersey: ["propose"], // Proposer un nouveau maillot
  proposal: ["list", "view", "approve", "reject"], // Gérer les propositions
  user: ["manageRoles"], // Gérer les rôles des utilisateurs
} as const;

// Créer le contrôleur d'accès
const ac = createAccessControl(statement);

/**
 * Rôle USER (par défaut)
 * - Aucune permission spéciale
 * - Peut gérer sa propre collection (géré par ownership checks)
 */
export const user = ac.newRole({});

/**
 * Rôle CONTRIBUTOR
 * - Peut proposer de nouveaux maillots
 * - Peut voir ses propres propositions
 */
export const contributor = ac.newRole({
  jersey: ["propose"],
  proposal: ["view"], // Peut voir ses propres propositions
});

/**
 * Rôle ADMIN
 * - Toutes les permissions CONTRIBUTOR
 * - Peut approuver/rejeter les propositions
 * - Peut gérer les rôles des utilisateurs (sauf superadmin)
 */
export const admin = ac.newRole({
  jersey: ["propose"],
  proposal: ["list", "view", "approve", "reject"],
  user: ["manageRoles"],
});

/**
 * Rôle SUPERADMIN
 * - Toutes les permissions ADMIN
 * - Peut gérer tous les utilisateurs y compris les admins
 * - Accès complet à toutes les fonctionnalités
 * - Réservé au(x) propriétaire(s) de l'application
 */
export const superadmin = ac.newRole({
  jersey: ["propose"],
  proposal: ["list", "view", "approve", "reject"],
  user: ["manageRoles"],
});

export { ac };
