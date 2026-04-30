"use client";

import { FormEvent, useState } from "react";
import { cn } from "@/lib/utils";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Link, useRouter } from "@/i18n/routing";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslations } from "next-intl";

interface ResetPasswordFormProps extends React.ComponentProps<"div"> {
  token: string | null;
}

export function ResetPasswordForm({ token, className, ...props }: ResetPasswordFormProps) {
  const t = useTranslations("ResetPassword");
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [succeeded, setSucceeded] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!token) {
    return (
      <div className={cn("flex flex-col gap-6", className)} {...props}>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-muted-foreground">{t("errors.invalidToken")}</p>
            <Link
              href="/auth/login"
              className="mt-4 inline-block text-sm text-primary underline underline-offset-4"
            >
              {t("backToLogin")}
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (password !== passwordConfirm) {
      setErrorMsg(t("errors.passwordMismatch"));
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await authClient.resetPassword({ newPassword: password, token });
      if (error) {
        setErrorMsg(t("errors.invalidToken"));
        return;
      }
      setSucceeded(true);
      setTimeout(() => router.push("/auth/login"), 2000);
    } catch {
      setErrorMsg(t("errors.resetError"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">{t("title")}</CardTitle>
          <CardDescription>{t("subtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          {succeeded ? (
            <div className="flex flex-col gap-4 text-center">
              <p className="text-sm text-muted-foreground">{t("success.message")}</p>
              <Link
                href="/auth/login"
                className="text-sm text-primary underline underline-offset-4"
              >
                {t("backToLogin")}
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="grid gap-6">
                {errorMsg && (
                  <div role="alert" className="text-sm text-red-600">
                    {errorMsg}
                  </div>
                )}
                <div className="grid gap-3">
                  <Label htmlFor="password">{t("form.password")}</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder={t("form.passwordPlaceholder")}
                    value={password}
                    onChange={(e) => setPassword(e.currentTarget.value)}
                    minLength={8}
                    required
                  />
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="passwordConfirm">{t("form.passwordConfirm")}</Label>
                  <Input
                    id="passwordConfirm"
                    type="password"
                    placeholder={t("form.passwordConfirmPlaceholder")}
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.currentTarget.value)}
                    minLength={8}
                    required
                  />
                </div>
                <Button type="submit" className="w-full cursor-pointer" disabled={isLoading}>
                  {isLoading ? t("button.loading") : t("button.submit")}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
