"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface BackButtonProps {
  href?: string;
}

export function BackButton({ href }: BackButtonProps) {
  const router = useRouter();

  const handleClick = () => {
    // router.back() en priorité pour préserver query params de la page précédente.
    // Fallback href si pas d'historique (URL ouverte directement).
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else if (href) {
      router.push(href);
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Retour"
      onClick={handleClick}
    >
      <ArrowLeft className="w-5 h-5" />
    </Button>
  );
}
