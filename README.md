# Le Vestiaire

Une application web moderne pour gérer et partager votre collection de maillots de football.

## À propos

**Le Vestiaire** est une plateforme dédiée aux passionnés de maillots de football. Organisez votre collection, créez votre wishlist, découvrez les maillots les mieux notés et connectez-vous avec d'autres collectionneurs.

### Fonctionnalités principales

- **Collection personnalisée** : Ajoutez vos maillots avec tous les détails (taille, condition, prix d'achat, personnalisation, photos)
- **Wishlist** : Créez votre liste de souhaits avec système de priorités
- **Système de notation** : Notez les maillots et découvrez les mieux notés par la communauté
- **Classement** : Participez au leaderboard et débloquez des achievements
- **Réseau social** : Ajoutez des amis et découvrez leurs collections
- **Statistiques** : Visualisez vos statistiques de collection par ligue, valeur totale, etc.
- **Recherche avancée** : Filtrez les maillots par club, saison, type, ligue

## Stack Technique

### Framework & Langage

- **Next.js 15** (App Router) - Framework React pour la production
- **React 19** - Bibliothèque UI
- **TypeScript** - Typage statique

### Base de données & Backend

- **PostgreSQL** - Base de données relationnelle
- **Prisma** - ORM moderne pour TypeScript
- **Supabase** - Backend as a Service
- **Upstash Redis** - Cache et sessions

### Authentification

- **Better Auth** - Solution d'authentification moderne
- **Next Auth** - Authentification supplémentaire

### UI & Styling

- **TailwindCSS 4** - Framework CSS utility-first
- **Radix UI** - Composants accessibles et non stylés
- **Lucide React** & **Tabler Icons** - Icônes
- **Framer Motion** - Animations fluides

### Formulaires & Validation

- **React Hook Form** - Gestion de formulaires performante
- **Zod** - Validation de schémas TypeScript-first

### État & Requêtes

- **TanStack Query (React Query)** - Gestion d'état serveur
- **React Query Devtools** - Outils de développement

### Outils & Analytics

- **Vercel Analytics** - Analytique
- **Vercel Speed Insights** - Performance monitoring
- **ESLint** - Linter JavaScript/TypeScript

## Scripts disponibles

- `npm run dev` - Lance le serveur de développement
- `npm run build` - Compile l'application pour la production
- `npm run start` - Lance le serveur de production
- `npm run lint` - Vérifie le code avec ESLint
- `npx prisma studio` - Ouvre l'interface Prisma Studio
- `npx prisma db seed` - Remplit la base de données avec des données de test

## Structure du projet

```
le-vestiare/
├── app/                      # Routes Next.js (App Router)
│   ├── api/                  # Routes API
│   ├── auth/                 # Pages d'authentification
│   ├── collection/           # Gestion de collection
│   ├── wishlist/             # Liste de souhaits
│   ├── leaderboard/          # Classement
│   ├── friends/              # Réseau social
│   └── settings/             # Paramètres utilisateur
├── components/               # Composants React réutilisables
│   ├── ui/                   # Composants UI de base
│   ├── home/                 # Composants page d'accueil
│   ├── collection/           # Composants collection
│   └── ...
├── lib/                      # Utilitaires et helpers
├── hooks/                    # Custom React hooks
├── types/                    # Types TypeScript
├── prisma/                   # Schéma et migrations Prisma
│   ├── schema.prisma         # Modèle de données
│   └── seed.ts               # Script de seed
├── public/                   # Assets statiques
└── scripts/                  # Scripts utilitaires
```

## Modèle de données

Le projet utilise Prisma avec PostgreSQL. Principaux modèles :

- **User** : Utilisateurs avec profils et préférences
- **Jersey** : Maillots avec détails (club, saison, type, marque)
- **UserJersey** : Collection personnelle (taille, condition, prix, photos)
- **Wishlist** : Liste de souhaits avec priorités
- **Rating** : Notes des maillots par les utilisateurs
- **Club** & **League** : Organisation des équipes et ligues
- **Friendship** : Relations entre utilisateurs
- **Achievement** : Badges et accomplissements

## Déploiement

L'application est optimisée pour un déploiement sur **Vercel** :

1. Connectez votre repository à Vercel
2. Configurez les variables d'environnement
3. Déployez automatiquement à chaque push sur `main`

Pour d'autres plateformes, consultez la [documentation Next.js](https://nextjs.org/docs/app/building-your-application/deploying).

## Contribution

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou une pull request.

## Licence

Ce projet est privé et propriétaire.

## Support

Pour toute question ou assistance, ouvrez une issue sur le repository.

---

Développé avec par l'équipe Le Vestiaire
