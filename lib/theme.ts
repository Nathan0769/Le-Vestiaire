import type { Theme } from "@/types/theme";

export const THEME_LIST: Array<{
  id: Theme;
  name: string;
  icon: string;
  color: string;
  activeColor: string;
  defaultTitle: string;
  defaultMessage: string;
}> = [
  {
    id: "christmas",
    name: "Noël",
    icon: "🎄",
    color: "bg-red-100 text-red-700 border-red-300",
    activeColor: "bg-red-500 text-white border-red-600",
    defaultTitle: "Ma liste de Noël 🎄",
    defaultMessage:
      "Salut ! Voici quelques idées de maillots qui me feraient plaisir 😊",
  },
  {
    id: "birthday",
    name: "Anniversaire",
    icon: "🎂",
    color: "bg-pink-100 text-pink-700 border-pink-300",
    activeColor: "bg-pink-500 text-white border-pink-600",
    defaultTitle: "Ma wishlist d'anniversaire 🎂",
    defaultMessage:
      "C'est bientôt mon anniversaire ! Voici mes envies de maillots 🎉",
  },
  {
    id: "valentine",
    name: "Saint-Valentin",
    icon: "💝",
    color: "bg-rose-100 text-rose-700 border-rose-300",
    activeColor: "bg-rose-500 text-white border-rose-600",
    defaultTitle: "Ma liste pour la Saint-Valentin 💝",
    defaultMessage:
      "Quelques idées de maillots qui me feraient très plaisir ❤️",
  },
  {
    id: "default",
    name: "Classique",
    icon: "⚽",
    color: "bg-blue-100 text-blue-700 border-blue-300",
    activeColor: "bg-blue-500 text-white border-blue-600",
    defaultTitle: "Ma wishlist maillots ⚽",
    defaultMessage:
      "Voici quelques maillots que j'aimerais ajouter à ma collection !",
  },
];

export const THEME_PAGE_CONFIG: Record<
  Theme,
  {
    gradient: string;
    headerGradient: string;
    button: string;
    badge: string;
    border: string;
    cardBorder: string;
  }
> = {
  christmas: {
    gradient: "from-red-50 via-green-50 to-red-50",
    headerGradient: "from-red-500 to-green-500",
    button: "bg-red-600 hover:bg-red-700",
    badge: "bg-red-100 text-red-700 border-red-200",
    border: "border-red-200/50",
    cardBorder: "border-red-100/50 hover:border-red-200",
  },
  birthday: {
    gradient: "from-pink-50 via-purple-50 to-pink-50",
    headerGradient: "from-pink-500 to-purple-500",
    button: "bg-pink-600 hover:bg-pink-700",
    badge: "bg-pink-100 text-pink-700 border-pink-200",
    border: "border-pink-200/50",
    cardBorder: "border-pink-100/50 hover:border-pink-200",
  },
  valentine: {
    gradient: "from-rose-50 via-pink-50 to-rose-50",
    headerGradient: "from-rose-500 to-pink-500",
    button: "bg-rose-600 hover:bg-rose-700",
    badge: "bg-rose-100 text-rose-700 border-rose-200",
    border: "border-rose-200/50",
    cardBorder: "border-rose-100/50 hover:border-rose-200",
  },
  default: {
    gradient: "from-blue-50 via-purple-50 to-blue-50",
    headerGradient: "from-blue-500 to-purple-500",
    button: "bg-blue-600 hover:bg-blue-700",
    badge: "bg-blue-100 text-blue-700 border-blue-200",
    border: "border-blue-200/50",
    cardBorder: "border-blue-100/50 hover:border-blue-200",
  },
};
