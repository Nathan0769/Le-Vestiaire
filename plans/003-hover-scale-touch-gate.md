# 003 — Garder les zooms au survol pour les pointeurs fins (tactile)

- **Status**: DONE
- **Commit**: d2bbc58
- **Severity**: MEDIUM
- **Category**: Accessibilité
- **Estimated scope**: 1 fichier (`app/globals.css`), ~6 lignes ; approche globale, pas de refactor par composant

## Problème

Les zooms au survol `hover:scale-105` sont utilisés massivement sur les cards et boutons (ex. `components/collection/collection-landing.tsx:360`, `components/wishlist/wishlist-landing.tsx:279`, boutons CTA lignes 250/265). Sur un écran tactile, il n'y a pas de vrai survol : un tap déclenche un état `:hover` "fantôme" qui **reste collé** (la carte reste zoomée) jusqu'à ce que l'utilisateur tape ailleurs. Résultat : sur mobile, des cartes figées en zoom après un tap.

La règle (AUDIT §6) : les animations de `:hover` doivent être gardées par `@media (hover: hover) and (pointer: fine)` — elles ne s'appliquent qu'aux dispositifs avec un vrai pointeur (souris, trackpad).

```tsx
/* components/collection/collection-landing.tsx:360 — exemple actuel */
className="bg-card border rounded-lg overflow-hidden hover:shadow-lg transition-all hover:scale-105 cursor-pointer group"
```

Le zoom `hover:scale-105` est répété sur de nombreux composants ; les réécrire un par un serait invasif et source d'oubli. Un neutralisant CSS global ciblant l'utilitaire est plus sûr et centralisé.

## Target

Ajouter dans `app/globals.css` une media query qui annule les transforms de survol Tailwind sur les dispositifs SANS pointeur fin (donc tactile), en laissant `hover:shadow-*` et les couleurs intacts.

```css
/* target — à ajouter en fin de app/globals.css */
/* Les zooms au survol ne doivent s'appliquer qu'aux vrais pointeurs.
   Sur tactile, un tap laisse un :hover "collé" qui fige la carte zoomée. */
@media not all and (hover: hover) and (pointer: fine) {
  .hover\:scale-105:hover,
  .hover\:scale-\[1\.02\]:hover,
  .hover\:scale-110:hover {
    transform: none;
  }
}
```

Effet : desktop inchangé (les zooms marchent), tactile propre (plus de carte figée en zoom après un tap, l'ombre au survol éventuelle reste sans effet de blocage).

## Repo conventions à suivre

- Les blocs `@media` et styles globaux vivent dans `app/globals.css` (fichier unique, importé par `components/home/client-wrapper.tsx:3`). Ne pas créer de fichier CSS ni de plugin Tailwind.
- Le projet cible les transforms de survol via des utilitaires Tailwind (`hover:scale-105`), pas via CSS custom — d'où le ciblage des classes échappées (`.hover\:scale-105`) plutôt qu'un refactor de chaque `className`.
- Avant d'écrire les sélecteurs, vérifier quelles valeurs de scale-hover existent réellement : `grep -rInE 'hover:scale-[0-9\[]' app components`. Ajouter au bloc uniquement les classes trouvées (ne pas inventer de valeurs non utilisées).

## Steps

1. Lancer `grep -rInE 'hover:scale-[0-9\[]' app components` et lister les valeurs distinctes de `hover:scale-*` réellement présentes.
2. Dans `app/globals.css`, ajouter en fin de fichier (après le dernier bloc existant) le `@media not all and (hover: hover) and (pointer: fine) { ... }` ci-dessus, en incluant un sélecteur `.hover\:scale-XXX:hover { transform: none; }` pour chaque valeur trouvée à l'étape 1 (échapper les crochets des valeurs arbitraires comme `.hover\:scale-\[1\.02\]`).

## Boundaries

- Ne PAS réécrire les `className` des composants un par un — approche CSS centralisée uniquement.
- Ne PAS neutraliser `hover:shadow-*`, `hover:bg-*` ou les changements de couleur : ils ne "collent" pas de façon gênante et aident au feedback. Seuls les `transform` de zoom sont visés.
- Ne PAS toucher au feedback de press des boutons (plan 002) ni à la config reduced-motion (plan 001).
- Ne PAS ajouter de dépendance.
- Si aucun `hover:scale-*` n'est trouvé à l'étape 1 (drift depuis `d2bbc58`), STOP et signaler au lieu d'ajouter des sélecteurs morts.

## Verification

- **Mécanique** : `pnpm lint` puis `pnpm build` passent sans erreur.
- **Feel check** :
  - Desktop (souris) : survoler une carte de collection/wishlist et un CTA → le zoom `scale-105` fonctionne comme avant.
  - Mobile réel ou DevTools en mode responsive tactile (device toolbar) : taper une carte puis relâcher → la carte ne doit PAS rester agrandie. Naviguer ne laisse aucune carte figée en zoom.
  - Vérifier que l'ombre/les couleurs au survol restantes ne créent pas d'état bloqué visible sur tactile.
- **Done when** : sur tactile, plus aucune carte/bouton ne reste zoomé après un tap ; sur desktop, les zooms au survol sont identiques à avant.
