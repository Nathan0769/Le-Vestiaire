import prisma from "@/lib/prisma";
import { slugifyForUsername } from "@/lib/username-slug";
import { containsProfanity } from "@/lib/username-blocklist";

export async function generateSlugBasedUsername(
  name: string | null,
): Promise<string> {
  const base = name ? slugifyForUsername(name) : "";
  if (base.length >= 5) {
    let candidate = base;
    let suffix = 2;
    while (await usernameExists(candidate)) {
      const suffixStr = `-${suffix}`;
      candidate = base.slice(0, 20 - suffixStr.length) + suffixStr;
      suffix += 1;
      if (suffix > 99) return generateUniqueUsername();
    }
    return candidate;
  }
  return generateUniqueUsername();
}

export async function generateUniqueUsername(
  _ignored?: string,
): Promise<string> {
  for (let attempt = 0; attempt < 200; attempt++) {
    const candidate = generateRandomUsername();
    if (!(await usernameExists(candidate))) {
      return candidate;
    }
  }

  const fallback = `${generateRandomUsername()}${Date.now()
    .toString()
    .slice(-4)}`;
  return fallback.slice(0, 20);
}

function generateRandomUsername(): string {
  const adjectives = [
    "swift",
    "brave",
    "calm",
    "bright",
    "royal",
    "vivid",
    "lucky",
    "sharp",
    "rapid",
    "bold",
  ];
  const nouns = [
    "stripe",
    "kit",
    "boots",
    "ball",
    "goal",
    "badge",
    "scarf",
    "fan",
    "club",
    "team",
  ];

  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const digits = Math.floor(1000 + Math.random() * 9000).toString();
  const handle = `${adj}${noun}${digits}`;
  return handle.slice(0, 20);
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

/**
 * Nettoie un pseudo saisi avant validation ET avant enregistrement : retire les
 * espaces (y compris insécables et de largeur nulle) en début et en fin.
 * À appeler une seule fois, à l'entrée de la route : valider une copie nettoyée
 * puis enregistrer la valeur brute laissait passer « pseudo␠ » en base.
 */
export function normalizeUsername(raw: string): string {
  return raw.replace(/^[\s\u200B-\u200D\uFEFF]+|[\s\u200B-\u200D\uFEFF]+$/g, "");
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

  if (containsProfanity(username)) {
    return {
      valid: false,
      error: "Ce pseudo contient un terme non autorisé",
    };
  }

  return { valid: true };
}
