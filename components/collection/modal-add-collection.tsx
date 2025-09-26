"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import type { Size, Condition, AddToCollectionData } from "@/types/collection";
import { SIZE_LABELS, CONDITION_LABELS } from "@/types/collection";

interface AddToCollectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: AddToCollectionData) => Promise<void>;
  isLoading: boolean;
}

export function AddToCollectionModal({
  open,
  onOpenChange,
  onSubmit,
  isLoading,
}: AddToCollectionModalProps) {
  const [formData, setFormData] = useState<AddToCollectionData>({
    size: "M" as Size,
    condition: "MINT" as Condition,
    hasTags: false,
    isGift: false,
    isFromMysteryBox: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.size) {
      toast.error("La taille est obligatoire");
      return;
    }

    if (!formData.condition) {
      toast.error("L'état est obligatoire");
      return;
    }

    await onSubmit(formData);
  };

  const handleReset = () => {
    setFormData({
      size: "M" as Size,
      condition: "MINT" as Condition,
      hasTags: false,
      isGift: false,
      isFromMysteryBox: false,
    });
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      handleReset();
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="w-[95vw] max-w-lg max-h-[90dvh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle>Ajouter à ma collection</DialogTitle>
          <DialogDescription>
            Renseignez les informations de votre maillot.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <form
            onSubmit={handleSubmit}
            className="space-y-4"
            id="collection-form"
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="size" className="flex items-center gap-1">
                  Taille <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.size}
                  onValueChange={(value: Size) =>
                    setFormData({ ...formData, size: value })
                  }
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Taille" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(SIZE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="condition" className="flex items-center gap-1">
                  État <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.condition}
                  onValueChange={(value: Condition) =>
                    setFormData({ ...formData, condition: value })
                  }
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="État" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CONDITION_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="purchasePrice">Prix d&apos;achat (€)</Label>
              <Input
                id="purchasePrice"
                type="number"
                step="1"
                min="0"
                placeholder="Ex: 90"
                value={formData.purchasePrice || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    purchasePrice: e.target.value
                      ? parseFloat(e.target.value)
                      : undefined,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="purchaseDate">Date d&apos;achat</Label>
              <Input
                id="purchaseDate"
                type="date"
                value={
                  formData.purchaseDate
                    ? formData.purchaseDate.toISOString().split("T")[0]
                    : ""
                }
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    purchaseDate: e.target.value
                      ? new Date(e.target.value)
                      : undefined,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="personalization">
                Personnalisation (nom, numéro...)
              </Label>
              <Input
                id="personalization"
                placeholder="Ex: MESSI 10"
                value={formData.personalization || ""}
                onChange={(e) =>
                  setFormData({ ...formData, personalization: e.target.value })
                }
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hasTags"
                  checked={formData.hasTags}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, hasTags: !!checked })
                  }
                />
                <Label htmlFor="hasTags">Possède encore les étiquettes</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isGift"
                  checked={formData.isGift}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isGift: !!checked })
                  }
                />
                <Label htmlFor="isGift">Reçu en cadeau</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isFromMysteryBox"
                  checked={formData.isFromMysteryBox}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isFromMysteryBox: !!checked })
                  }
                />
                <Label htmlFor="isFromMysteryBox">
                  Provenant d&apos;une Box Mystère
                </Label>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes personnelles</Label>
              <Textarea
                id="notes"
                placeholder="Ajoutez vos commentaires sur ce maillot..."
                value={formData.notes || ""}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                rows={3}
              />
            </div>
          </form>
        </div>

        <DialogFooter className="px-6 py-4 border-t">
          <Button
            type="button"
            variant="outline"
            className="cursor-pointer"
            onClick={() => handleOpenChange(false)}
            disabled={isLoading}
          >
            Annuler
          </Button>
          <Button
            type="submit"
            form="collection-form"
            disabled={isLoading}
            className="cursor-pointer"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
                <span>Ajout...</span>
              </div>
            ) : (
              <span>Ajouter à ma collection</span>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
