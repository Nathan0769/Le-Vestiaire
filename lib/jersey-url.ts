export function getJerseyUrl(
  leagueId: string,
  clubId: string,
  slugOrId: string
): string {
  return `/jerseys/${leagueId}/clubs/${clubId}/jerseys/${slugOrId}`;
}

export function getAbsoluteJerseyUrl(
  leagueId: string,
  clubId: string,
  slugOrId: string
): string {
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL || "https://le-vestiaire-foot.fr";
  return `${baseUrl}${getJerseyUrl(leagueId, clubId, slugOrId)}`;
}
