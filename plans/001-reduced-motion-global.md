# 001 — Respecter prefers-reduced-motion globalement

- **Status**: DONE
- **Commit**: d2bbc58
- **Severity**: HIGH
- **Category**: Accessibilité
- **Estimated scope**: 2 fichiers (`components/home/client-wrapper.tsx`, `app/globals.css`), ~25 lignes

## Problème

L'app ne respecte le réglage système "réduire les animations" nulle part. Un `grep -rIn "prefers-reduced-motion\|useReducedMotion"` sur `app/` et `components/` ne retourne aucun résultat. Or il existe :

- Des animations Framer (`motion/react`) qui déplacent des éléments : entrées `initial={{ opacity: 0, y: 20 }}` et fonds animés en boucle dans `components/collection/collection-landing.tsx` et `components/wishlist/wishlist-landing.tsx`.
- Des zooms au survol partout : `hover:scale-105` sur les cards et boutons.

Pour un utilisateur ayant activé "réduire les animations" (souvent pour des raisons médicales : vertiges, troubles vestibulaires, migraines), l'app impose quand même tous les mouvements de position et de zoom. C'est un défaut d'accessibilité, pas un défaut esthétique.

`components/home/client-wrapper.tsx:1` est un Client Component (`"use client"`) qui enveloppe déjà toute l'app sous les providers — c'est le point d'ancrage naturel pour une config Framer globale.

```tsx
/* components/home/client-wrapper.tsx:1-3 — actuel */
"use client";

import "../../app/globals.css";
```

## Target

Deux couches complémentaires : une pour Framer (JS), une pour le CSS/Tailwind (`hover:scale-*`, `transition-all`).

### Couche 1 — Framer via MotionConfig

Envelopper l'arbre de `ClientWrapper` dans `<MotionConfig reducedMotion="user">`. `reducedMotion="user"` fait que Framer, quand `prefers-reduced-motion: reduce` est actif, ignore automatiquement les animations de `transform`/`layout` (position, scale) mais **conserve** les changements d'`opacity`. Aucun composant `motion.*` individuel à modifier.

```tsx
/* target — components/home/client-wrapper.tsx */
import { MotionConfig } from "motion/react";
// ...
return (
  <MotionConfig reducedMotion="user">
    <ThemeProvider ...>
      {/* arbre existant inchangé */}
    </ThemeProvider>
  </MotionConfig>
);
```

### Couche 2 — CSS pour Tailwind/CSS transitions

Ajouter en fin de `app/globals.css` un bloc media qui neutralise les mouvements CSS sans supprimer les fondus/couleurs. On coupe les `transform` de survol et on raccourcit les transitions, on garde opacity/couleur pour la compréhension.

```css
/* target — à ajouter en fin de app/globals.css */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
  /* Neutralise les zooms/déplacements au survol, garde le reste visible */
  .hover\:scale-105:hover,
  .hover\:scale-\[1\.02\]:hover {
    transform: none !important;
  }
}
```

## Repo conventions à suivre

- `motion` est déjà la lib d'animation du projet (`package.json` : `"motion": "^12.23.24"`), importée via `motion/react` (voir `components/ui/spotlight-new.tsx:2`). `MotionConfig` vient du même package.
- Les styles globaux et les blocs `@media` vivent dans `app/globals.css` (fichier unique importé par `client-wrapper.tsx:3`). Ne pas créer de nouveau fichier CSS.
- `ClientWrapper` est déjà le conteneur de tous les providers globaux (`ThemeProvider`, `QueryProvider`, etc.) — `MotionConfig` s'y ajoute comme provider le plus externe.

## Steps

1. Dans `components/home/client-wrapper.tsx`, ajouter l'import : `import { MotionConfig } from "motion/react";` (avec les autres imports en haut du fichier).
2. Dans le `return`, envelopper le `<ThemeProvider ...>` existant (ligne 28) et tout son contenu jusqu'à sa fermeture `</ThemeProvider>` (ligne 74) dans `<MotionConfig reducedMotion="user"> ... </MotionConfig>`. Ne rien changer d'autre à l'arbre.
3. Dans `app/globals.css`, ajouter le bloc `@media (prefers-reduced-motion: reduce)` ci-dessus tout à la fin du fichier (après la ligne 372, après le bloc `.cos-card::before`).

## Boundaries

- Ne PAS modifier les composants `motion.*` individuels (`collection-landing.tsx`, `wishlist-landing.tsx`, `spotlight-new.tsx`, `animated-testimonials.tsx`) — `MotionConfig` les couvre tous.
- Ne PAS supprimer d'animations pour les utilisateurs sans le réglage activé : les deux couches ne s'appliquent QUE sous la media query / le flag `"user"`.
- Ne PAS ajouter de dépendance : `motion` est déjà installé.
- Ne PAS toucher au markup autre que l'ajout du wrapper `MotionConfig`.
- Si `ClientWrapper` ne contient plus la structure décrite (drift depuis le commit `d2bbc58`), STOP et signaler.

## Verification

- **Mécanique** : `pnpm lint` puis `pnpm build` doivent passer sans erreur ni warning nouveau.
- **Feel check** :
  - Ouvrir la page collection (landing) en desktop, réglage système normal : les entrées `y: 20`/`scale` et les zooms au survol fonctionnent comme avant.
  - DevTools > Rendering > "Emulate CSS prefers-reduced-motion: reduce". Recharger : les cartes ne glissent plus / ne zooment plus au survol, mais restent visibles et les fondus d'opacité subsistent. Aucun élément ne disparaît ni ne devient inutilisable.
  - Vérifier qu'un bouton reste cliquable et lisible dans ce mode (pas de contenu masqué par une opacity restée à 0).
- **Done when** : avec reduced-motion émulé, plus aucun mouvement de position/zoom sur collection, wishlist et les cards ; sans le réglage, comportement identique à avant.
