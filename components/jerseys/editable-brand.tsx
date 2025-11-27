"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface EditableBrandProps {
  jerseyId: string;
  currentBrand: string;
  isAdmin: boolean;
}

export function EditableBrand({
  jerseyId,
  currentBrand,
  isAdmin,
}: EditableBrandProps) {
  const [open, setOpen] = useState(false);
  const [brand, setBrand] = useState(currentBrand);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleClick = (e: React.MouseEvent) => {
    if (isAdmin && e.shiftKey) {
      e.preventDefault();
      setOpen(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!brand.trim()) {
      toast.error("La marque ne peut pas être vide");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`/api/jerseys/${jerseyId}/brand`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ brand: brand.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de la mise à jour");
      }

      toast.success("La marque du maillot a été modifiée avec succès");

      setOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Impossible de mettre à jour la marque"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <span
        className="text-sm font-semibold text-foreground text-right break-words"
        onClick={handleClick}
      >
        {currentBrand}
      </span>

      {isAdmin && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>Modifier la marque</DialogTitle>
                <DialogDescription>
                  Modifiez la marque du maillot. Cette action est réservée aux
                  administrateurs.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="brand">Marque</Label>
                  <Input
                    id="brand"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    placeholder="Ex: Nike, Adidas, Puma..."
                    disabled={isLoading}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  disabled={isLoading}
                >
                  Annuler
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Enregistrer
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
