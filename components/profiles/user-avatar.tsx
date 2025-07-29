"use client";

import * as React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CameraIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type UserAvatarProps = {
  src?: string;
  name: string;
  size?: "sm" | "md" | "lg";
  editable?: boolean;
  onChange?: (file: File) => void;
  className?: string;
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function UserAvatar({
  src,
  name,
  size = "md",
  editable = false,
  onChange,
  className,
}: UserAvatarProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onChange) onChange(file);
  };

  const sizeClasses = {
    sm: "h-10 w-10",
    md: "h-16 w-16",
    lg: "h-20 w-20",
  };

  return (
    <div className={cn("relative", sizeClasses[size], className)}>
      <Avatar className={cn("rounded-full", sizeClasses[size])}>
        <AvatarImage src={src} />
        <AvatarFallback>{getInitials(name)}</AvatarFallback>
      </Avatar>

      {editable && (
        <>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="absolute bottom-0 right-0 rounded-full bg-background p-1 shadow hover:bg-muted cursor-pointer"
          >
            <CameraIcon className="size-4" />
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </>
      )}
    </div>
  );
}
