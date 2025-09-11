"use client";

import { FormEvent, useState } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
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

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const { signIn, loading, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    try {
      await signIn(email, password);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setErrorMsg(message || "Erreur de connexion");
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    try {
      await signInWithGoogle();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setErrorMsg(message || "Erreur de connexion avec Google");
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Content de vous retrouver</CardTitle>
          <CardDescription>
            Se connecter avec votre compte Google
          </CardDescription>
        </CardHeader>
        <CardContent>
          {errorMsg && (
            <div className="mb-4 text-sm text-red-600">{errorMsg}</div>
          )}
          <form onSubmit={handleSubmit}>
            <div className="grid gap-6">
              <div className="flex flex-col gap-4">
                {/*<Button variant="outline" className="w-full cursor-pointer">
                  <AppleIcon />
                  Se connecter avec Apple
                </Button>*/}
                <Button
                  variant="outline"
                  className="w-full cursor-pointer"
                  onClick={handleGoogleSignIn}
                >
                  <GoogleIcon />
                  Se connecter avec Google
                </Button>
              </div>

              <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
                <span className="bg-card text-muted-foreground relative z-10 px-2">
                  Ou continuer avec
                </span>
              </div>

              <div className="grid gap-6">
                <div className="grid gap-3">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.currentTarget.value)}
                    required
                  />
                </div>
                <div className="grid gap-3">
                  <div className="flex items-center">
                    <Label htmlFor="password">Mot de passe</Label>
                    <a
                      href="#"
                      className="ml-auto text-sm underline-offset-4 hover:underline"
                    >
                      Mot de passe oublié ?
                    </a>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.currentTarget.value)}
                    required
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full cursor-pointer"
                  disabled={loading}
                >
                  {loading ? "Chargement…" : "Se connecter"}
                </Button>
              </div>

              <div className="text-center text-sm">
                Vous n&apos;avez pas de compte?{" "}
                <a href="/auth/signUp" className="underline underline-offset-4">
                  Créer un compte
                </a>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
      <div className="text-muted-foreground text-center text-xs">
        En cliquant sur continuer, vous acceptez nos{" "}
        <a href="#" className="underline">
          Conditions d&apos;utilisation
        </a>{" "}
        et{" "}
        <a href="#" className="underline">
          Politique de confidentialité
        </a>
        .
      </div>
    </div>
  );
}
