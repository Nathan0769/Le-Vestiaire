"use client";

import { ExternalLink } from "lucide-react";

interface ShopOfferBadgeProps {
  shopName: string;
  /** Phrase traduite lue par les lecteurs d'écran ("Dispo -45% chez Le Parc à Maillots"). */
  ariaLabel: string;
  price: number;
  compareAtPrice: number | null;
  discount: number;
  onClick: (e: React.MouseEvent) => void;
}

// Un badge par boutique qui a le maillot : le nom reste visible quand plusieurs s'empilent.
export function ShopOfferBadge({ shopName, ariaLabel, price, compareAtPrice, discount, onClick }: ShopOfferBadgeProps) {
  const inPromo = discount > 0 && compareAtPrice !== null;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className={`pointer-events-auto w-full flex items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 cursor-pointer transition-transform hover:scale-[1.02] shadow-md ${
        inPromo
          ? "bg-green-600 text-white hover:bg-green-700"
          : "bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200"
      }`}
    >
      <div className="flex items-baseline gap-1.5 min-w-0">
        <span className="text-sm font-bold shrink-0">{price.toFixed(2)}€</span>
        {inPromo && (
          <span className="text-[10px] font-bold bg-white/20 rounded px-1 py-0.5 shrink-0">-{discount}%</span>
        )}
        <span className="text-[10px] opacity-80 truncate">{shopName}</span>
      </div>
      <ExternalLink className="w-3 h-3 shrink-0" />
    </button>
  );
}
