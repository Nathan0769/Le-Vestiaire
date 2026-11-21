/**
 * Noms de clubs tels que les vendeurs eBay les écrivent. Une recherche
 * « Olympique de Marseille 1990/91 » rate les annonces « Marseille 1990/91 » :
 * eBay exige tous les mots. Relevé sur le jeu de référence Terapeak du
 * 2026-11-21 (docs/market/2026-11-21-terapeak/terapeak-names.json), enrichi
 * au fil des trous constatés.
 */

/** Nom catalogue -> nom de recherche eBay. Consulté avant toute autre règle. */
export const EBAY_SEARCH_NAME: Record<string, string> = {
  "Olympique de Marseille": "Marseille",
  "Olympique Lyonnais": "Lyon",
  "Paris Saint-Germain": "PSG",
  "Ajax Amsterdam": "Ajax",
  "AS Nancy-Lorraine": "Nancy",
  "Stade Rennais FC": "Rennes",
  "Stade Rennais": "Rennes",
  "Valence CF": "Valencia",
  "Tottenham Hotspur": "Tottenham",
  "Bayer Leverkusen": "Leverkusen",
  "Tigres UANL": "Tigres",
  "Standard de Liège": "Standard Liege",
  "Royal Charleroi SC": "Charleroi",
  "Betis Deportivo": "Real Betis",
  "West Ham United": "West Ham",
  "Football Bourg-en-Bresse Péronnas 01": "Bourg Peronnas",
  "Athletic Club Bilbao": "Athletic Bilbao",
  "Inter Miami CF": "Inter Miami",
  "Orlando City SC": "Orlando City",
  "Al-Nassr": "Al Nassr",
  "Cap-Vert": "Cape Verde",
  "Toronto FC": "Toronto FC",
  // Dry-run du 2026-11-22 : maillots qui perdaient leur donnée eBay.
  "Atlético de Madrid": "Atletico Madrid",
  "1. FC Cologne": "Koln",
  "Girondins de Bordeaux": "Bordeaux",
  "AC Perugia Calcio": "Perugia",
  "Eintracht Francfort": "Eintracht Frankfurt",
  "Borussia Mönchengladbach": "Monchengladbach",
  "Stade de Reims": "Reims",
  "Stade Brestois 29": "Brest",
  "RC Strasbourg Alsace": "Strasbourg",
  "LOSC Lille": "Lille",
  "Le Havre AC": "Le Havre",
};

/** Préfixes et suffixes de forme juridique retirés quand le reste suffit à reconnaître le club. */
export const CLUB_AFFIXES = ["AS", "RC", "OGC", "AJ", "SC", "US", "RSC", "RCD", "UD", "CF", "SCO", "HSC", "SL", "Calcio"];

/**
 * Autres noms d'un club dans les titres d'annonces, par nom de recherche.
 * Une annonce est gardée si son titre contient le nom de recherche, le nom
 * catalogue ou un de ces alias.
 */
export const CLUB_ALIASES: Record<string, string[]> = {
  PSG: ["paris saint germain", "paris st germain", "paris sg"],
  Marseille: ["om", "olympique marseille", "marsiglia", "marsella"],
  Lyon: ["ol", "olympique lyon", "lione"],
  "Manchester United": ["man utd", "man united", "mufc"],
  "Manchester City": ["man city", "mcfc"],
  Tottenham: ["spurs", "thfc"],
  "Inter Milan": ["inter", "internazionale"],
  "AC Milan": ["milan"],
  Juventus: ["juve"],
  Barcelona: ["barca", "fcb"],
  "Atletico Madrid": ["atletico", "atleti"],
  "Bayern Munich": ["bayern", "bayern munchen", "fc bayern"],
  "Borussia Dortmund": ["dortmund", "bvb"],
  "Real Betis": ["betis"],
  "Athletic Bilbao": ["athletic club", "bilbao"],
  "West Ham": ["whu"],
  Wolverhampton: ["wolves"],
  Newcastle: ["newcastle united", "nufc"],
  Leverkusen: ["bayer leverkusen", "bayer 04"],
  Valencia: ["valencia cf"],
  Ajax: ["afc ajax"],
  "Standard Liege": ["standard"],
  Germany: ["west germany", "deutschland", "germania", "alemania"],
  Netherlands: ["holland", "niederlande", "olanda", "paises bajos"],
  USA: ["usmnt", "united states"],
  "South Korea": ["korea"],
  "Ivory Coast": ["cote d ivoire"],
  Ireland: ["republic of ireland", "eire"],
  "Cape Verde": ["cabo verde"],
  "Inter Miami": ["inter miami cf"],
  "Orlando City": ["orlando"],
  "Bourg Peronnas": ["bourg en bresse"],
  Koln: ["cologne", "koeln", "fc koln"],
  Monchengladbach: ["gladbach", "borussia monchengladbach"],
  "Eintracht Frankfurt": ["frankfurt", "eintracht"],
  Bordeaux: ["girondins"],
  // Sélections : eBay traduit les titres sur ses sites DE, IT, ES (constaté le 2026-11-22).
  Sweden: ["schweden", "svezia", "suecia", "sverige"],
  France: ["frankreich", "francia"],
  Spain: ["spanien", "spagna", "espana"],
  Italy: ["italien", "italia"],
  England: ["inghilterra", "inglaterra"],
  Belgium: ["belgien", "belgio", "belgica"],
  Brazil: ["brasilien", "brasile", "brasil"],
  Argentina: ["argentinien"],
  Croatia: ["kroatien", "croazia", "croacia", "hrvatska"],
  Switzerland: ["schweiz", "svizzera", "suiza"],
  Denmark: ["danemark", "danimarca", "dinamarca"],
  Norway: ["norwegen", "norvegia", "noruega"],
  Scotland: ["schottland", "scozia", "escocia"],
  Wales: ["galles"],
  Mexico: ["mexiko", "messico"],
  Japan: ["giappone", "japon"],
  Morocco: ["marokko", "marocco", "marruecos"],
  Portugal: ["portogallo"],
  Poland: ["polen", "polonia"],
  Austria: ["osterreich", "oesterreich"],
  "Czech Republic": ["czechia", "tschechien", "repubblica ceca"],
};
