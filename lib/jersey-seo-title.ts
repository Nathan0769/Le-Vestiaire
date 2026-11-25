/**
 * Saison écrite dans le titre Google d'une fiche : années complètes séparées
 * par une barre (« 2023/2024 »). Les recherches portent surtout sur l'année
 * seule (« maillot vietnam 2026 ») : « 2023-24 » ne contient pas « 2024 ».
 * Les sélections gardent leur année seule.
 */
export function seasonForTitle(season: string): string {
  const m = season.match(/^(\d{4})-(\d{2}|\d{4})$/);
  if (!m) return season;
  if (m[2].length === 4) return `${m[1]}/${m[2]}`;
  const start = parseInt(m[1], 10);
  let end = Math.floor(start / 100) * 100 + parseInt(m[2], 10);
  if (end < start) end += 100;
  return `${m[1]}/${end}`;
}

/** La saison telle qu'elle peut être écrite dans un nom : 2026-27, 2026/27, 2026-2027, 2026/2027. */
function seasonInName(season: string): RegExp {
  const full = seasonForTitle(season).match(/^(\d{4})\/(\d{4})$/);
  if (!full) return new RegExp(season.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  return new RegExp(`${full[1]}[-/](?:${full[2]}|${full[2].slice(2)})(?!\\d)`);
}

/**
 * Ce que le nom d'un maillot SPECIAL ajoute au titre. La plupart des noms sont
 * génériques (« Maillot Spécial FC Nantes 2017-18 ») ; certains portent
 * l'événement après la saison (« … 2010-11 FA Cup Final ») ou sont un nom
 * propre (« Maillot Totti AS Roma 2017-18 »), repris tel quel en français.
 */
export function specialJerseyTitle(
  name: string,
  season: string
): { event: string | null; customName: string | null } {
  const trimmed = name.trim().replace(/\s+/g, " ");
  const written = trimmed.match(seasonInName(season));
  if (/^Maillot Sp[ée]cial /i.test(trimmed)) {
    const event = written ? trimmed.slice(written.index! + written[0].length).trim() : "";
    return { event: event || null, customName: null };
  }
  if (/^Maillot /i.test(trimmed)) {
    const titleSeason = seasonForTitle(season);
    // Espaces autour de la saison : certains noms la collent (« On Fire2022-23 »)
    const customName = written
      ? trimmed.replace(written[0], ` ${titleSeason} `)
      : `${trimmed} ${titleSeason}`;
    return { event: null, customName: customName.replace(/\s+/g, " ").trim() };
  }
  return { event: null, customName: null };
}
