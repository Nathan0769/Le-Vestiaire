"use client";

import React, { FormEvent, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
//import { AppleIcon } from "../icons/Apple-icon";
import { GoogleIcon } from "../icons/Google-icon";
import { handleGoogleSignIn } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

const formDefaults = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  confirmPassword: "",
};
type FieldErrors = Partial<Record<keyof typeof formDefaults, string>>;

function SocialButtons() {
  return (
    <div className="flex flex-col gap-4">
      {/* <Button variant="outline" className="w-full cursor-pointer" type="button">
        <AppleIcon />
        Continuer avec Apple
      </Button>*/}
      <Button
        variant="outline"
        className="w-full cursor-pointer"
        type="button"
        onClick={handleGoogleSignIn}
      >
        <GoogleIcon />
        Continuer avec Google
      </Button>
    </div>
  );
}

function Separator() {
  return (
    <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
      <span className="bg-card text-muted-foreground relative z-10 px-2">
        Ou continuer avec
      </span>
    </div>
  );
}

export default function SignupPage({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const { signUp, loading } = useAuth();
  const [formData, setFormData] = useState({ ...formDefaults });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleChange = (field: keyof typeof formDefaults, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    setErrorMsg(null);
  };

  const validate = (): boolean => {
    const errors: FieldErrors = {};
    const { firstName, lastName, email, password, confirmPassword } = formData;

    if (!firstName) errors.firstName = "Prénom requis";
    if (!lastName) errors.lastName = "Nom requis";
    if (!email) errors.email = "Email requis";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      errors.email = "Email invalide";
    if (!password) errors.password = "Mot de passe requis";
    else if (password.length < 8) errors.password = "Au moins 8 caractères";
    if (confirmPassword !== password)
      errors.confirmPassword = "Les mots de passe ne correspondent pas";

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!validate()) return;

    try {
      await signUp(formData.email, formData.password);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(msg || "Erreur lors de l’inscription");
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Créer un compte</CardTitle>
          <CardDescription>
            Rejoignez la communauté des collectionneurs de maillots
          </CardDescription>
        </CardHeader>
        <CardContent>
          {errorMsg && (
            <div className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-600">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <SocialButtons />
            <Separator />

            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                {(["firstName", "lastName"] as const).map((f) => (
                  <div key={f} className="grid gap-2">
                    <Label htmlFor={f}>
                      {f === "firstName" ? "Prénom *" : "Nom *"}
                    </Label>
                    <Input
                      id={f}
                      value={formData[f]}
                      onChange={(e) => handleChange(f, e.currentTarget.value)}
                    />
                    {fieldErrors[f] && (
                      <p className="text-xs text-red-600">{fieldErrors[f]}</p>
                    )}
                  </div>
                ))}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.currentTarget.value)}
                  required
                />
                {fieldErrors.email && (
                  <p className="text-xs text-red-600">{fieldErrors.email}</p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="password">Mot de passe *</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) =>
                      handleChange("password", e.currentTarget.value)
                    }
                    required
                    aria-invalid={!!fieldErrors.password}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    onClick={() => setShowPassword((v) => !v)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {fieldErrors.password && (
                  <p className="text-xs text-red-600">{fieldErrors.password}</p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="confirmPassword">
                  Confirmer le mot de passe *
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirm ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      handleChange("confirmPassword", e.currentTarget.value)
                    }
                    required
                    aria-invalid={!!fieldErrors.confirmPassword}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    onClick={() => setShowConfirm((v) => !v)}
                  >
                    {showConfirm ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {fieldErrors.confirmPassword && (
                  <p className="text-xs text-red-600">
                    {fieldErrors.confirmPassword}
                  </p>
                )}
              </div>
            </div>

            <Button
              type="submit"
              className="w-full cursor-pointer"
              disabled={loading}
            >
              {loading ? "Création du compte…" : "Créer mon compte"}
            </Button>

            <p className="text-center text-sm">
              Vous avez déjà un compte ?{" "}
              <Link href="/auth/login" className="underline hover:text-primary">
                Se connecter
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
      <div className="text-muted-foreground text-center text-xs">
        En cliquant sur créer mon compte, vous acceptez nos{" "}
        <a href="/conditions-utilisation" className="underline">
          Conditions d&apos;utilisation
        </a>{" "}
        et{" "}
        <a href="/politique-confidentialite" className="underline">
          Politique de confidentialité
        </a>
        .
      </div>
    </div>
  );
}
