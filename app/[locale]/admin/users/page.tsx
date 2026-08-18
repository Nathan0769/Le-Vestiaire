"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  username: string | null;
  role: string;
  banned: boolean;
  banReason: string | null;
  createdAt: string;
  _count: {
    collection: number;
    wishlist: number;
    ratings: number;
  };
}

const ROLE_LABELS: Record<string, string> = {
  user: "Utilisateur",
  contributor: "Contributeur",
  admin: "Admin",
  superadmin: "Super Admin",
};

const ROLE_COLORS: Record<string, string> = {
  user: "bg-gray-500 text-white",
  contributor: "bg-blue-500 text-white",
  admin: "bg-purple-500 text-white",
  superadmin: "bg-red-500 text-white",
};

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [changingRole, setChangingRole] = useState<string | null>(null);

  // Charger les utilisateurs
  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/users");
      const data = await response.json();

      if (response.ok) {
        setUsers(data.users);
      } else {
        toast.error(data.error || "Impossible de charger les utilisateurs");
      }
    } catch {
      toast.error("Erreur lors du chargement des utilisateurs");
    } finally {
      setLoading(false);
    }
  }

  async function handleRoleChange(userId: string, newRole: string) {
    try {
      setChangingRole(userId);

      const response = await fetch("/api/admin/users/set-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: newRole }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Rôle modifié avec succès");
        await fetchUsers();
      } else {
        toast.error(data.error || "Impossible de modifier le rôle");
      }
    } catch {
      toast.error("Erreur lors de la modification du rôle");
    } finally {
      setChangingRole(null);
    }
  }

  function RoleSelect({ user }: { user: User }) {
    return (
      <Select
        value={user.role}
        onValueChange={(newRole) => handleRoleChange(user.id, newRole)}
        disabled={changingRole === user.id}
      >
        <SelectTrigger className="w-[160px]">
          <SelectValue>
            {changingRole === user.id ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Modification...
              </span>
            ) : (
              <Badge className={ROLE_COLORS[user.role]}>
                {ROLE_LABELS[user.role]}
              </Badge>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {(["user", "contributor", "admin", "superadmin"] as const).map(
            (role) => (
              <SelectItem key={role} value={role}>
                <Badge className={ROLE_COLORS[role]}>{ROLE_LABELS[role]}</Badge>
              </SelectItem>
            )
          )}
        </SelectContent>
      </Select>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Gestion des utilisateurs</h2>
          <p className="text-muted-foreground">
            {users.length} utilisateur{users.length > 1 ? "s" : ""}
          </p>
        </div>
        <Button onClick={fetchUsers} variant="outline">
          Actualiser
        </Button>
      </div>

      {/* Mobile : cartes */}
      <div className="space-y-3 md:hidden">
        {users.map((user) => (
          <div
            key={user.id}
            className="rounded-lg border bg-card p-4 space-y-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium truncate">{user.name}</span>
                  {user.banned && (
                    <Badge variant="destructive">Banni</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground truncate">
                  {user.email}
                </p>
              </div>
              <RoleSelect user={user} />
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-md bg-muted/50 py-2">
                <p className="text-base font-semibold">
                  {user._count.collection}
                </p>
                <p className="text-xs text-muted-foreground">Collection</p>
              </div>
              <div className="rounded-md bg-muted/50 py-2">
                <p className="text-base font-semibold">
                  {user._count.wishlist}
                </p>
                <p className="text-xs text-muted-foreground">Wishlist</p>
              </div>
              <div className="rounded-md bg-muted/50 py-2">
                <p className="text-base font-semibold">
                  {user._count.ratings}
                </p>
                <p className="text-xs text-muted-foreground">Notes</p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Inscrit le {formatDateTime(user.createdAt)}
            </p>
          </div>
        ))}
      </div>

      {/* Desktop : tableau */}
      <div className="hidden rounded-md border md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Rôle</TableHead>
              <TableHead className="text-center">Collection</TableHead>
              <TableHead className="text-center">Wishlist</TableHead>
              <TableHead className="text-center">Notes</TableHead>
              <TableHead>Inscription</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">
                  {user.name}
                  {user.banned && (
                    <Badge variant="destructive" className="ml-2">
                      Banni
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {user.email}
                </TableCell>
                <TableCell>
                  <RoleSelect user={user} />
                </TableCell>
                <TableCell className="text-center">
                  {user._count.collection}
                </TableCell>
                <TableCell className="text-center">
                  {user._count.wishlist}
                </TableCell>
                <TableCell className="text-center">
                  {user._count.ratings}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDateTime(user.createdAt)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
