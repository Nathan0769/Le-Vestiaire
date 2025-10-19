import prisma from "@/lib/prisma";

export async function generateUniqueUsername(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _ignored?: string
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
