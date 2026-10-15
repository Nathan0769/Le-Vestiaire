import type { CustomPatchGroup, CustomPatchOccurrence } from "@/types/patch";

// Regroupe les variantes de saisie libre ("Trophée", "trophee ") sous une même clé.
export function normalizeCustomLabel(label: string): string {
  return label
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function groupCustomPatches(
  occurrences: CustomPatchOccurrence[]
): CustomPatchGroup[] {
  const byKey = new Map<string, CustomPatchOccurrence[]>();
  for (const o of occurrences) {
    const key = normalizeCustomLabel(o.customLabel);
    const arr = byKey.get(key) ?? [];
    arr.push(o);
    byKey.set(key, arr);
  }

  const groups: CustomPatchGroup[] = [];
  for (const [key, items] of byKey) {
    // Map conserve l'ordre d'insertion : en cas d'égalité, la première variante gagne.
    const variantCounts = new Map<string, number>();
    for (const o of items) {
      variantCounts.set(o.customLabel, (variantCounts.get(o.customLabel) ?? 0) + 1);
    }
    let label = items[0].customLabel;
    let best = 0;
    for (const [variant, n] of variantCounts) {
      if (n > best) {
        best = n;
        label = variant;
      }
    }
    groups.push({
      key,
      label,
      variants: [...variantCounts.keys()],
      count: items.length,
      occurrences: items,
    });
  }

  return groups.sort((a, b) => b.count - a.count);
}
