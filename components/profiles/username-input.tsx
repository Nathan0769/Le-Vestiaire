"use client";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Check, X, Loader2, Pencil } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";

interface UsernameInputProps {
  value: string;
  onChange: (value: string) => void;
  onValidationChange?: (isValid: boolean) => void;
  initialUsername?: string;
}

export function UsernameInput({
  value,
  onChange,
  onValidationChange,
  initialUsername,
}: UsernameInputProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [availability, setAvailability] = useState<{
    available: boolean;
    error?: string;
    isCurrent?: boolean;
  } | null>(null);
  const debouncedUsername = useDebounce(value, 500);

  useEffect(() => {
    // Ne pas vérifier si on n'est pas en mode édition
    if (!isEditing) {
      setAvailability(null);
      onValidationChange?.(true);
      return;
    }

    const checkAvailability = async () => {
      if (!debouncedUsername || debouncedUsername.length < 5) {
        setAvailability(null);
        onValidationChange?.(false);
        return;
      }

      setIsChecking(true);
      try {
        const res = await fetch(
          `/api/user/username/check?username=${encodeURIComponent(
            debouncedUsername
          )}`
        );
        const data = await res.json();

        setAvailability(data);
        onValidationChange?.(data.available);
      } catch (error) {
        console.error("Error checking username:", error);
        setAvailability(null);
        onValidationChange?.(false);
      } finally {
        setIsChecking(false);
      }
    };

    checkAvailability();
  }, [debouncedUsername, onValidationChange, isEditing]);

  const getStatusIcon = () => {
    if (!isEditing) return null;

    if (isChecking) {
      return <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />;
    }
    if (!availability || value.length < 5) {
      return null;
    }
    if (availability.available) {
      return <Check className="w-4 h-4 text-green-600" />;
    }
    return <X className="w-4 h-4 text-red-600" />;
  };

  const getHelperText = () => {
    if (!isEditing) {
      return;
    }

    if (value.length < 5) {
      return "5-20 caractères • Lettres, chiffres, tirets et underscores uniquement";
    }
    if (availability && !availability.available) {
      return availability.error || "Ce pseudo n'est pas disponible";
    }
    if (availability && availability.available) {
      return "✓ Ce pseudo est disponible";
    }
    return "5-20 caractères • Lettres, chiffres, tirets et underscores uniquement";
  };

  const getHelperColor = () => {
    if (!isEditing) return "text-muted-foreground";

    if (value.length < 5) return "text-muted-foreground";
    if (availability && !availability.available) return "text-red-600";
    if (availability && availability.available) return "text-green-600";
    return "text-muted-foreground";
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    onChange(initialUsername || "");
    setAvailability(null);
  };

  const handleConfirm = () => {
    if (availability?.available) {
      setIsEditing(false);
    }
  };

  return (
    <div className="grid gap-2">
      <Label htmlFor="username">Pseudo</Label>
      <div className="relative flex gap-2">
        <div className="relative flex-1">
          <Input
            id="username"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="mon_pseudo"
            maxLength={20}
            className="pr-10"
            disabled={!isEditing}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {getStatusIcon()}
          </div>
        </div>
        {!isEditing ? (
          <Button
            type="button"
            className="cursor-pointer"
            variant="outline"
            size="icon"
            onClick={handleEdit}
          >
            <Pencil className="w-4 h-4" />
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="cursor-pointer"
              size="icon"
              onClick={handleCancel}
            >
              <X className="w-4 h-4" />
            </Button>
            <Button
              type="button"
              variant="default"
              className="cursor-pointer"
              size="icon"
              onClick={handleConfirm}
              disabled={!availability?.available}
            >
              <Check className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
      <p className={`text-sm ${getHelperColor()}`}>{getHelperText()}</p>
    </div>
  );
}
