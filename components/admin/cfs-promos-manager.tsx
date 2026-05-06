"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Pencil, Trash2, Plus } from "lucide-react";

interface CfsPromo {
  id: string;
  name: string;
  imageUrl: string;
  price: string;
  promoPrice: string;
  affiliateUrl: string;
  club: string | null;
  brand: string | null;
  isActive: boolean;
  position: number;
  createdAt: string;
}

const EMPTY_FORM = {
  name: "",
  imageUrl: "",
  price: "",
  promoPrice: "",
  affiliateUrl: "",
  club: "",
  brand: "",
  isActive: true,
  position: "0",
};

type FormState = typeof EMPTY_FORM;

export function CfsPromosManager() {
  const [promos, setPromos] = useState<CfsPromo[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  useEffect(() => {
    fetchPromos();
  }, []);

  async function fetchPromos() {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/cfs-promos");
      const data = await res.json();
      if (res.ok) {
        setPromos(data.promos);
      } else {
        toast.error(data.error || "Impossible de charger les promos");
      }
    } catch {
      toast.error("Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }

  function openEdit(promo: CfsPromo) {
    setEditingId(promo.id);
    setForm({
      name: promo.name,
      imageUrl: promo.imageUrl,
      price: promo.price,
      promoPrice: promo.promoPrice,
      affiliateUrl: promo.affiliateUrl,
      club: promo.club ?? "",
      brand: promo.brand ?? "",
      isActive: promo.isActive,
      position: String(promo.position),
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    const payload = {
      name: form.name.trim(),
      imageUrl: form.imageUrl.trim(),
      price: parseFloat(form.price),
      promoPrice: parseFloat(form.promoPrice),
      affiliateUrl: form.affiliateUrl.trim(),
      club: form.club.trim() || null,
      brand: form.brand.trim() || null,
      isActive: form.isActive,
      position: parseInt(form.position, 10) || 0,
    };

    try {
      setSaving(true);
      const url = editingId
        ? `/api/admin/cfs-promos/${editingId}`
        : "/api/admin/cfs-promos";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(editingId ? "Promo modifiée" : "Promo créée");
        setDialogOpen(false);
        await fetchPromos();
      } else {
        toast.error(data.error || "Erreur lors de la sauvegarde");
      }
    } catch {
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(promo: CfsPromo) {
    try {
      const res = await fetch(`/api/admin/cfs-promos/${promo.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !promo.isActive }),
      });

      if (res.ok) {
        await fetchPromos();
      } else {
        toast.error("Impossible de modifier le statut");
      }
    } catch {
      toast.error("Erreur lors de la modification");
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/admin/cfs-promos/${deleteId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Promo supprimée");
        await fetchPromos();
      } else {
        const data = await res.json();
        toast.error(data.error || "Impossible de supprimer");
      }
    } catch {
      toast.error("Erreur lors de la suppression");
    } finally {
      setDeleteId(null);
    }
  }

  const isFormValid =
    form.name.trim() &&
    form.imageUrl.trim() &&
    form.affiliateUrl.trim() &&
    !isNaN(parseFloat(form.price)) &&
    parseFloat(form.price) > 0 &&
    !isNaN(parseFloat(form.promoPrice)) &&
    parseFloat(form.promoPrice) > 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Promos CFS</h2>
          <p className="text-muted-foreground">
            {promos.length} promo{promos.length > 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchPromos} variant="outline">
            Actualiser
          </Button>
          <Button onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            Ajouter
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Pos.</TableHead>
              <TableHead>Nom</TableHead>
              <TableHead>Club</TableHead>
              <TableHead>Marque</TableHead>
              <TableHead className="text-right">Prix</TableHead>
              <TableHead className="text-right">Promo</TableHead>
              <TableHead className="text-center">Statut</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {promos.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                  Aucune promo configurée
                </TableCell>
              </TableRow>
            )}
            {promos.map((promo) => (
              <TableRow key={promo.id}>
                <TableCell className="text-muted-foreground">
                  {promo.position}
                </TableCell>
                <TableCell className="font-medium max-w-[200px] truncate">
                  {promo.name}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {promo.club ?? "—"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {promo.brand ?? "—"}
                </TableCell>
                <TableCell className="text-right text-muted-foreground line-through">
                  {parseFloat(promo.price).toFixed(2)} €
                </TableCell>
                <TableCell className="text-right font-semibold text-green-600">
                  {parseFloat(promo.promoPrice).toFixed(2)} €
                </TableCell>
                <TableCell className="text-center">
                  <button
                    onClick={() => handleToggleActive(promo)}
                    className="cursor-pointer"
                  >
                    <Badge
                      className={
                        promo.isActive
                          ? "bg-green-500 text-white hover:bg-green-600"
                          : "bg-gray-400 text-white hover:bg-gray-500"
                      }
                    >
                      {promo.isActive ? "Actif" : "Inactif"}
                    </Badge>
                  </button>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEdit(promo)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteId(promo.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Dialog création / édition */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Modifier la promo" : "Nouvelle promo"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label htmlFor="name">Nom *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Maillot Arsenal 94/95 Retro"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="club">Club</Label>
                <Input
                  id="club"
                  value={form.club}
                  onChange={(e) => setForm({ ...form, club: e.target.value })}
                  placeholder="Arsenal"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="brand">Marque</Label>
                <Input
                  id="brand"
                  value={form.brand}
                  onChange={(e) => setForm({ ...form, brand: e.target.value })}
                  placeholder="Adidas"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="price">Prix original (€) *</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  placeholder="89.99"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="promoPrice">Prix soldé (€) *</Label>
                <Input
                  id="promoPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.promoPrice}
                  onChange={(e) =>
                    setForm({ ...form, promoPrice: e.target.value })
                  }
                  placeholder="49.99"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="imageUrl">URL image *</Label>
              <Input
                id="imageUrl"
                value={form.imageUrl}
                onChange={(e) =>
                  setForm({ ...form, imageUrl: e.target.value })
                }
                placeholder="https://..."
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="affiliateUrl">URL affiliée *</Label>
              <Input
                id="affiliateUrl"
                value={form.affiliateUrl}
                onChange={(e) =>
                  setForm({ ...form, affiliateUrl: e.target.value })
                }
                placeholder="https://www.classicfootballshirts.co.uk/..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="position">Ordre d&apos;affichage</Label>
                <Input
                  id="position"
                  type="number"
                  min="0"
                  value={form.position}
                  onChange={(e) =>
                    setForm({ ...form, position: e.target.value })
                  }
                  placeholder="0"
                />
              </div>
              <div className="space-y-1">
                <Label>Statut</Label>
                <button
                  type="button"
                  onClick={() =>
                    setForm({ ...form, isActive: !form.isActive })
                  }
                  className="w-full mt-1 cursor-pointer"
                >
                  <Badge
                    className={
                      form.isActive
                        ? "bg-green-500 text-white w-full justify-center py-1.5"
                        : "bg-gray-400 text-white w-full justify-center py-1.5"
                    }
                  >
                    {form.isActive ? "Actif" : "Inactif"}
                  </Badge>
                </button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={saving}
            >
              Annuler
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || !isFormValid}
            >
              {saving ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sauvegarde...
                </span>
              ) : (
                editingId ? "Modifier" : "Créer"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation suppression */}
      <AlertDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer la promo ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
