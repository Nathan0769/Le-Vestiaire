import prisma from "@/lib/prisma";

export async function generateUniqueUsername(name: string): Promise<string> {
  let baseUsername = name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .substring(0, 10);

  if (baseUsername.length < 3) {
    baseUsername = "user";
  }

  if (!(await usernameExists(baseUsername)) && baseUsername.length >= 5) {
    return baseUsername;
  }

  for (let i = 0; i < 100; i++) {
    const suffix = Math.floor(10000 + Math.random() * 90000).toString();
    const username = `${baseUsername}${suffix}`;

    if (username.length >= 5 && username.length <= 20) {
      if (!(await usernameExists(username))) {
        return username;
      }
    }
  }

  return `${baseUsername}${Date.now().toString().slice(-5)}`;
}

export async function usernameExists(username: string): Promise<boolean> {
  const existingUser = await prisma.user.findFirst({
    where: {
      username: {
        equals: username,
        mode: "insensitive",
      },
    },
  });

  return !!existingUser;
}

export function validateUsername(username: string): {
  valid: boolean;
  error?: string;
} {
  username = username.trim();

  if (username.length < 5) {
    return {
      valid: false,
      error: "Le pseudo doit contenir au moins 5 caractères",
    };
  }

  if (username.length > 20) {
    return {
      valid: false,
      error: "Le pseudo ne peut pas dépasser 20 caractères",
    };
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    return {
      valid: false,
      error:
        "Le pseudo ne peut contenir que des lettres, chiffres, tirets et underscores",
    };
  }

  if (!/^[a-zA-Z0-9]/.test(username)) {
    return {
      valid: false,
      error: "Le pseudo doit commencer par une lettre ou un chiffre",
    };
  }

  return { valid: true };
}
