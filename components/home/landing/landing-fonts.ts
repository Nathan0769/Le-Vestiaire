import { Hanken_Grotesk } from "next/font/google";

// Police d'affichage du hero landing (grotesque black), isolée du reste de
// l'app qui reste en Geist. Exposée via une variable CSS pour cibler les titres.
export const hankenGrotesk = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["400", "600", "700", "900"],
  variable: "--font-hanken",
  display: "swap",
});
