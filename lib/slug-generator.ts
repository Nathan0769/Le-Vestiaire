export function generateJerseySlug(
  clubShortName: string,
  type: string,
  season: string
): string {
  const typeLabels: Record<string, string> = {
    HOME: "domicile",
    AWAY: "exterieur",
    THIRD: "third",
    FOURTH: "fourth",
    GOALKEEPER: "gardien",
    SPECIAL: "special",
  };

  const typeSlug = typeLabels[type.toUpperCase()] || type.toLowerCase();
  const seasonSlug = season.replace(/\//g, "-");

  const parts = ["maillot", clubShortName, typeSlug, seasonSlug];

  return parts
    .join(" ")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function isSlug(param: string): boolean {
  if (param.startsWith("maillot-")) return true;

  if (/^[a-z0-9]{25,27}$/i.test(param)) return false;

  return param.includes("-") && param.split("-").length >= 4;
}
