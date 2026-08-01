# 002 — Feedback de press + transition ciblée sur Button

- **Status**: DONE
- **Commit**: d2bbc58
- **Severity**: MEDIUM
- **Category**: Physicalité + Performance
- **Estimated scope**: 1 fichier (`components/ui/button.tsx`), 1 ligne modifiée

## Problème

Le composant `Button` — utilisé par tous les boutons de l'app — n'a aucun retour tactile à l'appui, et utilise `transition-all`.

```tsx
/* components/ui/button.tsx:8 — actuel (classes de base du cva) */
"inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all cursor-pointer disabled:pointer-events-none disabled:opacity-50 ..."
```

Deux problèmes :

1. **Aucun état `:active`.** Rien ne se rétracte quand on presse un bouton. Le bouton attend le résultat de l'action pour donner un signe de vie. La règle (AUDIT §3) : les éléments pressables doivent réagir au press avec `transform: scale(0.97)`, subtil (0.95–0.98), en `~160ms ease-out`. C'est le micro-feedback qui rend une UI "vivante".
2. **`transition-all`** (AUDIT §5) anime toute propriété qui change, y compris hors GPU et non désirées. Ici on ne veut animer que la couleur, l'ombre et le transform.

## Target

Sur la string de base du `cva` (`components/ui/button.tsx:8`), remplacer `transition-all` par une transition ciblée et ajouter l'état de press.

```tsx
/* target — remplacer "transition-all" par : */
"transition-[color,background-color,border-color,box-shadow,transform] duration-150 ease-out active:scale-[0.97]"
```

- `scale-[0.97]` : rétraction de 3 % pendant l'appui, dans la fourchette recommandée (0.95–0.98).
- `duration-150` : 150 ms, dans le budget press (100–160 ms).
- `ease-out` : démarre vite, feedback immédiat (jamais `ease-in` sur de l'UI).
- Transition limitée aux propriétés réellement animées (couleurs, ombre, transform) — plus de `all`.

`scale` et `opacity`/couleur restant les seules propriétés animées, tout tourne sur le GPU.

## Repo conventions à suivre

- Le style des composants `ui/` est défini via `class-variance-authority` (`cva`) avec des classes Tailwind dans la string de base — voir `components/ui/button.tsx:7-36`. On modifie cette string de base, pas les variants.
- Tailwind v4 : la syntaxe arbitraire `active:scale-[0.97]` et `transition-[...]` est déjà utilisée ailleurs dans le projet (ex. `components/ui/switch.tsx`). Rester en classes utilitaires, pas de CSS inline.
- Ne pas introduire de token custom `--ease-*` ici : le projet n'en a pas encore (aucun `--ease-*` dans `globals.css`) ; `ease-out` Tailwind suffit pour un press court.

## Steps

1. Ouvrir `components/ui/button.tsx`.
2. Dans la string de base du `cva` (ligne 8), remplacer exactement le token `transition-all` par : `transition-[color,background-color,border-color,box-shadow,transform] duration-150 ease-out active:scale-[0.97]`. Ne rien changer d'autre sur cette ligne, ni aux variants, ni à la logique du composant.

## Boundaries

- Ne PAS toucher aux `variants` (couleurs, tailles) ni au corps de la fonction `Button`.
- Ne PAS ajouter le feedback ailleurs que sur `Button` dans ce plan (les cards `hover:scale` sont couvertes par le plan 003).
- Ne PAS ajouter de dépendance ni de token CSS.
- La réduction de mouvement pour les utilisateurs `prefers-reduced-motion` est gérée globalement par le plan 001 ; ne rien ajouter ici pour ça.
- Si la ligne 8 ne contient plus `transition-all` (drift depuis `d2bbc58`), STOP et signaler.

## Verification

- **Mécanique** : `pnpm lint` puis `pnpm build` passent sans erreur.
- **Feel check** :
  - Lancer l'app, presser n'importe quel bouton (souris maintenue enfoncée) : il se rétracte très légèrement pendant l'appui et revient au relâchement.
  - DevTools > Animations, playback à 10 % : la rétraction est un scale fluide, pas un saut ; l'easing démarre vite.
  - Vérifier qu'un `<Button asChild>` enveloppant un `<Link>` (voir `client-wrapper.tsx:49-59`) reçoit aussi le feedback (le `active:` s'applique via les classes héritées).
  - Émuler `prefers-reduced-motion: reduce` (avec le plan 001 en place) : le scale de press ne doit plus se déclencher.
- **Done when** : tous les boutons de l'app réagissent visiblement au press, `transition-all` n'apparaît plus dans `button.tsx`.
