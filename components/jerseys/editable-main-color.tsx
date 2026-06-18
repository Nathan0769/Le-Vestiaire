"use client";

import { useState, type ReactNode } from "react";
import { Loader2, RefreshCw, RotateCcw, Save } from "lucide-react";
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

interface EditableMainColorProps {
  jerseyId: string;
  currentMainColor: string | null;
  clubPrimaryColor: string;
  isSuperAdmin: boolean;
  children: ReactNode;
}

const HEX_REGEX = /^#[0-9a-fA-F]{6}$/;

export function EditableMainColor({
  jerseyId,
  currentMainColor,
  clubPrimaryColor,
  isSuperAdmin,
  children,
}: EditableMainColorProps) {
  const [open, setOpen] = useState(false);
  const [color, setColor] = useState(
    currentMainColor || clubPrimaryColor || "#1f2937"
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const router = useRouter();

  const handleClick = (e: React.MouseEvent) => {
    if (isSuperAdmin && e.shiftKey) {
      e.preventDefault();
      setOpen(true);
    }
  };

  if (!isSuperAdmin) return <>{children}</>;

  const callApi = async (
    body:
      | { mode: "set"; color: string }
      | { mode: "reset" }
      | { mode: "regenerate" }
  ) => {
    const response = await fetch(`/api/jerseys/${jerseyId}/main-color`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Erreur");
    }
    return data;
  };

  const handleSet = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!HEX_REGEX.test(color)) {
      toast.error("Format hex invalide (ex: #1a2b3c)");
      return;
    }

    setIsSaving(true);
    try {
      await callApi({ mode: "set", color });
      toast.success("Couleur mise à jour");
      setOpen(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    try {
      const data = await callApi({ mode: "regenerate" });
      toast.success(
        data.mainColor
          ? `Couleur régénérée : ${data.mainColor}`
          : "Aucune couleur trouvée, fallback club"
      );
      if (data.mainColor) setColor(data.mainColor);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleReset = async () => {
    setIsResetting(true);
    try {
      await callApi({ mode: "reset" });
      toast.success("Couleur réinitialisée (fallback club)");
      setOpen(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setIsResetting(false);
    }
  };

  const isBusy = isSaving || isRegenerating || isResetting;

  return (
    <>
      <span onClick={handleClick} className="contents">
        {children}
      </span>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[440px]">
          <form onSubmit={handleSet}>
            <DialogHeader>
              <DialogTitle>Couleur principale du maillot</DialogTitle>
              <DialogDescription>
                Utilisée pour le bloc flocage dans la collection. Si vide, la
                couleur du club est utilisée en fallback. Réservé aux
                superadmins.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="mainColorPicker">Couleur</Label>
                <div className="flex items-center gap-3">
                  <input
                    id="mainColorPicker"
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value.toLowerCase())}
                    className="h-10 w-16 rounded-md border cursor-pointer"
                    disabled={isBusy}
                  />
                  <Input
                    value={color}
                    onChange={(e) => setColor(e.target.value.toLowerCase())}
                    placeholder="#1a2b3c"
                    className="font-mono flex-1"
                    disabled={isBusy}
                  />
                </div>
              </div>

              <div className="rounded-md border p-3 space-y-2 bg-muted/30">
                <div className="text-xs text-muted-foreground">
                  Couleur actuelle en base :
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span
                    aria-hidden
                    className="inline-block w-5 h-5 rounded-sm border"
                    style={{
                      backgroundColor: currentMainColor || clubPrimaryColor,
                    }}
                  />
                  <span className="font-mono">
                    {currentMainColor || `${clubPrimaryColor} (fallback club)`}
                  </span>
                </div>
              </div>
            </div>

            <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleRegenerate}
                  disabled={isBusy}
                  className="cursor-pointer"
                >
                  {isRegenerating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  <span className="ml-2">Régénérer</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleReset}
                  disabled={isBusy}
                  className="cursor-pointer"
                >
                  {isResetting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RotateCcw className="h-4 w-4" />
                  )}
                  <span className="ml-2">Reset</span>
                </Button>
              </div>
              <Button type="submit" disabled={isBusy} className="cursor-pointer">
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                <span className="ml-2">Enregistrer</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
