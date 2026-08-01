# Plans d'amélioration des animations

Générés par le skill `improve-animations` (audit du commit `d2bbc58`). Chaque plan est autonome : un exécuteur sans contexte peut l'appliquer. Read-only côté audit — l'application du code se fait séparément.

## Plans

| # | Titre | Sévérité | Statut |
|---|---|---|---|
| 001 | Respecter prefers-reduced-motion globalement | HIGH | DONE |
| 002 | Feedback de press + transition ciblée sur Button | MEDIUM | DONE |
| 003 | Garder les zooms au survol pour les pointeurs fins (tactile) | MEDIUM | DONE |

## Ordre d'exécution recommandé

1. **001** d'abord : pose la config reduced-motion globale dont 002 et 003 dépendent pour leur feel check.
2. **002** ensuite : plus fort impact ressenti (tous les boutons deviennent réactifs), 1 seule ligne.
3. **003** enfin : corrige le bug tactile mobile.

## Dépendances

- 002 et 003 ajoutent des animations (`active:scale`, zooms de survol) qui doivent être neutralisées sous reduced-motion. Le plan **001** couvre ça globalement — l'appliquer en premier évite d'avoir à re-vérifier l'accessibilité dans 002/003.
- 001 et 003 modifient tous deux la fin de `app/globals.css` : si appliqués séparément, veiller à ne pas dupliquer de bloc `@media`.

## Findings non retenus dans ces plans (backlog)

- **LOW** — `toggle-dark-mode.tsx:22-23` : icônes en `scale-0` (apparition depuis le néant) + `transition-all`.
- **LOW** — barres de progression (`achievement-progress-bar.tsx:14`, `community-tab.tsx:351`) : `transition-all` anime `width` (hors GPU).
- **LOW** — grille showcase de `collection-landing.tsx` : entrées sans stagger (30-80ms).
- **Missed opportunity** — swaps d'état (filtres, onglets) qui téléportent : crossfade court à envisager.
- **Missed opportunity** — vérifier que popovers/dropdowns Radix partent du trigger (`transform-origin`) et pas du centre.
