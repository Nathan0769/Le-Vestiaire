/**
 * Forme d'une réponse JSON : chaque chemin (« .stats.collectionCount »,
 * « [].jersey.club.name ») associé à ses types, triés et joints par « | ».
 * Sert aux tests de contrat web ↔ iOS : les valeurs changent d'un run à
 * l'autre, la forme non. « absent » = clé que certains éléments d'un tableau
 * n'ont pas.
 */
export type ContractShape = Record<string, string>;

function typeOf(value: unknown): string {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  return typeof value;
}

function collect(value: unknown, path: string, out: Map<string, Set<string>>) {
  const add = (p: string, t: string) => {
    if (!out.has(p)) out.set(p, new Set());
    out.get(p)!.add(t);
  };
  add(path, typeOf(value));

  if (Array.isArray(value)) {
    const itemPath = `${path}[]`;
    for (const item of value) collect(item, itemPath, out);
    const objects = value.filter(
      (v): v is Record<string, unknown> => typeOf(v) === "object"
    );
    const keys = new Set(objects.flatMap((o) => Object.keys(o)));
    for (const key of keys) {
      if (objects.some((o) => !(key in o))) add(`${itemPath}.${key}`, "absent");
    }
  } else if (typeOf(value) === "object") {
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      collect(child, `${path}.${key}`, out);
    }
  }
}

export function contractShape(value: unknown): ContractShape {
  const out = new Map<string, Set<string>>();
  collect(value, "", out);
  return Object.fromEntries(
    [...out.entries()]
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([path, types]) => [path, [...types].sort().join("|")])
  );
}

/**
 * Changements qui casseraient le décodage de l'app : chemin retiré, ou type
 * qu'elle n'a jamais reçu (ex. un champ qui devient null). Un champ ajouté ou
 * un type plus étroit passe : Swift ignore les clés inconnues.
 */
export function breakingChanges(expected: ContractShape, actual: ContractShape): string[] {
  const changes: string[] = [];
  for (const [path, expectedTypes] of Object.entries(expected)) {
    const allowed = new Set(expectedTypes.split("|"));
    const actualTypes = actual[path];
    if (actualTypes === undefined) {
      if (!allowed.has("absent")) changes.push(`${path} : retiré (${expectedTypes})`);
      continue;
    }
    if (actualTypes.split("|").some((t) => !allowed.has(t))) {
      changes.push(`${path} : ${expectedTypes} -> ${actualTypes}`);
    }
  }
  return changes;
}
