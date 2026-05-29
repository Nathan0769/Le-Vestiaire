export function jerseyTypeLabel(
  baseLabel: string,
  type: string,
  variant: number
): string {
  if (type === "GOALKEEPER" && variant > 1) {
    return `${baseLabel} ${variant}`;
  }
  return baseLabel;
}
