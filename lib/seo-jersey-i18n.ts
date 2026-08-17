// Strings localisées pour le structured data des fiches maillot (Product + FAQ).
// Même approche que translate-jersey-name.ts : dispatch par locale en code, pour
// que les pages it/de/es/pt/nl émettent du JSON-LD dans leur langue et non en FR.

type Locale = "fr" | "en" | "es" | "de" | "it" | "nl" | "pt";

const normalize = (locale: string): Locale =>
  (["fr", "en", "es", "de", "it", "nl", "pt"].includes(locale)
    ? locale
    : "fr") as Locale;

// Mot "maillot" selon la langue (aligné sur translate-jersey-name.ts).
const JERSEY_WORD: Record<Locale, string> = {
  fr: "Maillot",
  en: "Jersey",
  es: "Camiseta",
  de: "Trikot",
  it: "Maglia",
  nl: "Shirt",
  pt: "Camisola",
};

const CATEGORY: Record<Locale, string> = {
  fr: "Maillot de football",
  en: "Football jersey",
  es: "Camiseta de fútbol",
  de: "Fußballtrikot",
  it: "Maglia da calcio",
  nl: "Voetbalshirt",
  pt: "Camisola de futebol",
};

export function localizedJerseyWord(locale: string): string {
  return JERSEY_WORD[normalize(locale)];
}

export function localizedCategory(locale: string): string {
  return CATEGORY[normalize(locale)];
}

interface ProductDescInput {
  typeLower: string;
  clubName: string;
  season: string;
  brand: string;
  collectionCount: number;
}

export function buildJerseyProductDescription(
  locale: string,
  { typeLower, clubName, season, brand, collectionCount }: ProductDescInput
): string {
  const l = normalize(locale);
  const has = collectionCount > 0;
  switch (l) {
    case "en":
      return `${clubName} ${typeLower} jersey for the ${season} season, designed by ${brand}. ${
        has
          ? `${collectionCount} collectors own this jersey.`
          : "Collectible jersey sought after by enthusiasts."
      }`;
    case "es":
      return `Camiseta ${typeLower} del ${clubName} para la temporada ${season}, diseñada por ${brand}. ${
        has
          ? `${collectionCount} coleccionistas poseen esta camiseta.`
          : "Camiseta de colección buscada por los aficionados."
      }`;
    case "de":
      return `${clubName} ${typeLower}-Trikot für die Saison ${season}, entworfen von ${brand}. ${
        has
          ? `${collectionCount} Sammler besitzen dieses Trikot.`
          : "Sammlertrikot, das von Enthusiasten gesucht wird."
      }`;
    case "it":
      return `Maglia ${typeLower} del ${clubName} per la stagione ${season}, disegnata da ${brand}. ${
        has
          ? `${collectionCount} collezionisti possiedono questa maglia.`
          : "Maglia da collezione ricercata dagli appassionati."
      }`;
    case "nl":
      return `${clubName} ${typeLower} shirt voor het seizoen ${season}, ontworpen door ${brand}. ${
        has
          ? `${collectionCount} verzamelaars bezitten dit shirt.`
          : "Verzamelshirt gezocht door liefhebbers."
      }`;
    case "pt":
      return `Camisola ${typeLower} do ${clubName} para a época ${season}, concebida pela ${brand}. ${
        has
          ? `${collectionCount} colecionadores possuem esta camisola.`
          : "Camisola de coleção procurada pelos apaixonados."
      }`;
    default:
      return `Maillot ${typeLower} du ${clubName} pour la saison ${season}, conçu par ${brand}. ${
        has
          ? `${collectionCount} collectionneurs possèdent ce maillot.`
          : "Maillot de collection recherché par les passionnés."
      }`;
  }
}

interface KeywordsInput {
  clubName: string;
  season: string;
  brand: string;
  leagueName: string;
}

export function buildJerseyKeywords(
  locale: string,
  { clubName, season, brand, leagueName }: KeywordsInput
): string {
  const l = normalize(locale);
  const word = JERSEY_WORD[l];
  const collectionLabel: Record<Locale, string> = {
    fr: "collection maillot football",
    en: "football jersey collection",
    es: "colección camisetas fútbol",
    de: "fußballtrikot sammlung",
    it: "collezione maglie calcio",
    nl: "voetbalshirt collectie",
    pt: "coleção camisolas futebol",
  };
  const vintageLabel: Record<Locale, string> = {
    fr: "football vintage",
    en: "vintage football",
    es: "fútbol vintage",
    de: "vintage fußball",
    it: "calcio vintage",
    nl: "vintage voetbal",
    pt: "futebol vintage",
  };
  return [
    `${word.toLowerCase()} ${clubName}`,
    `${clubName} ${season}`,
    brand,
    leagueName,
    collectionLabel[l],
    vintageLabel[l],
  ].join(", ");
}

export interface JerseyFaqInput {
  clubName: string;
  clubShortName: string;
  leagueName: string;
  season: string;
  brand: string;
  typeLower: string;
  translatedJerseyName: string;
  collectionCount: number;
  totalRatings: number;
  averageRating?: number;
  cfsPrice?: number;
}

export interface FaqEntry {
  question: string;
  answer: string;
}

export function buildJerseyFaq(
  locale: string,
  input: JerseyFaqInput
): FaqEntry[] {
  const l = normalize(locale);
  const {
    clubName,
    clubShortName,
    leagueName,
    season,
    brand,
    typeLower,
    translatedJerseyName,
    collectionCount,
    totalRatings,
    averageRating,
    cfsPrice,
  } = input;
  const priceStr = cfsPrice != null ? cfsPrice.toFixed(2) : null;
  const avg = averageRating != null ? averageRating.toFixed(1) : null;

  const entries: FaqEntry[] = [];

  switch (l) {
    case "en":
      entries.push({
        question: `Who makes the ${clubName} ${typeLower} jersey in ${season}?`,
        answer: `The ${clubName} ${typeLower} jersey for the ${season} season is made by ${brand}.`,
      });
      entries.push({
        question: `Which competition does ${clubName} play in during the ${season} season?`,
        answer: `${clubName} plays in the ${leagueName} during the ${season} season.`,
      });
      if (collectionCount > 0)
        entries.push({
          question: `How many collectors own the ${clubShortName} ${season} jersey on Le Vestiaire?`,
          answer: `${collectionCount} collector${
            collectionCount > 1 ? "s own" : " owns"
          } this jersey on the Le Vestiaire platform.`,
        });
      if (avg && totalRatings > 0)
        entries.push({
          question: `What is the community rating of ${translatedJerseyName}?`,
          answer: `${translatedJerseyName} has an average rating of ${avg}/5 based on ${totalRatings} rating${
            totalRatings > 1 ? "s" : ""
          } on Le Vestiaire.`,
        });
      entries.push({
        question: `Where to buy ${translatedJerseyName}?`,
        answer: priceStr
          ? `${translatedJerseyName} is available from ${priceStr}€ on Classic Football Shirts, a specialist in vintage and collectible football shirts.`
          : `${translatedJerseyName} is available on Classic Football Shirts, a specialist in vintage and collectible football shirts.`,
      });
      break;

    case "es":
      entries.push({
        question: `¿Quién fabrica la camiseta ${typeLower} del ${clubName} en ${season}?`,
        answer: `La camiseta ${typeLower} del ${clubName} para la temporada ${season} está fabricada por ${brand}.`,
      });
      entries.push({
        question: `¿En qué competición juega el ${clubName} durante la temporada ${season}?`,
        answer: `El ${clubName} juega en la ${leagueName} durante la temporada ${season}.`,
      });
      if (collectionCount > 0)
        entries.push({
          question: `¿Cuántos coleccionistas poseen la camiseta ${clubShortName} ${season} en Le Vestiaire?`,
          answer: `${collectionCount} coleccionista${
            collectionCount > 1 ? "s poseen" : " posee"
          } esta camiseta en la plataforma Le Vestiaire.`,
        });
      if (avg && totalRatings > 0)
        entries.push({
          question: `¿Cuál es la valoración de la comunidad de ${translatedJerseyName}?`,
          answer: `${translatedJerseyName} tiene una valoración media de ${avg}/5 basada en ${totalRatings} valoracion${
            totalRatings > 1 ? "es" : ""
          } en Le Vestiaire.`,
        });
      entries.push({
        question: `¿Dónde comprar ${translatedJerseyName}?`,
        answer: priceStr
          ? `${translatedJerseyName} está disponible desde ${priceStr}€ en Classic Football Shirts, especialista en camisetas de fútbol vintage y de colección.`
          : `${translatedJerseyName} está disponible en Classic Football Shirts, especialista en camisetas de fútbol vintage y de colección.`,
      });
      break;

    case "de":
      entries.push({
        question: `Wer ist der Ausrüster des ${clubName} ${typeLower}-Trikots ${season}?`,
        answer: `Das ${clubName} ${typeLower}-Trikot für die Saison ${season} wird von ${brand} hergestellt.`,
      });
      entries.push({
        question: `In welchem Wettbewerb spielt ${clubName} in der Saison ${season}?`,
        answer: `${clubName} spielt in der Saison ${season} in der ${leagueName}.`,
      });
      if (collectionCount > 0)
        entries.push({
          question: `Wie viele Sammler besitzen das ${clubShortName} ${season} Trikot auf Le Vestiaire?`,
          answer: `${collectionCount} Sammler besitzen dieses Trikot auf der Plattform Le Vestiaire.`,
        });
      if (avg && totalRatings > 0)
        entries.push({
          question: `Wie ist die Community-Bewertung von ${translatedJerseyName}?`,
          answer: `${translatedJerseyName} hat eine durchschnittliche Bewertung von ${avg}/5 auf Basis von ${totalRatings} Bewertung${
            totalRatings > 1 ? "en" : ""
          } auf Le Vestiaire.`,
        });
      entries.push({
        question: `Wo kann man ${translatedJerseyName} kaufen?`,
        answer: priceStr
          ? `${translatedJerseyName} ist ab ${priceStr}€ bei Classic Football Shirts erhältlich, einem Spezialisten für Vintage- und Sammler-Fußballtrikots.`
          : `${translatedJerseyName} ist bei Classic Football Shirts erhältlich, einem Spezialisten für Vintage- und Sammler-Fußballtrikots.`,
      });
      break;

    case "it":
      entries.push({
        question: `Chi è lo sponsor tecnico della maglia ${typeLower} del ${clubName} nel ${season}?`,
        answer: `La maglia ${typeLower} del ${clubName} per la stagione ${season} è prodotta da ${brand}.`,
      });
      entries.push({
        question: `In quale competizione gioca il ${clubName} nella stagione ${season}?`,
        answer: `Il ${clubName} gioca nella ${leagueName} nella stagione ${season}.`,
      });
      if (collectionCount > 0)
        entries.push({
          question: `Quanti collezionisti possiedono la maglia ${clubShortName} ${season} su Le Vestiaire?`,
          answer: `${collectionCount} collezionist${
            collectionCount > 1 ? "i possiedono" : "a possiede"
          } questa maglia sulla piattaforma Le Vestiaire.`,
        });
      if (avg && totalRatings > 0)
        entries.push({
          question: `Qual è la valutazione della community di ${translatedJerseyName}?`,
          answer: `${translatedJerseyName} ha una valutazione media di ${avg}/5 basata su ${totalRatings} valutazion${
            totalRatings > 1 ? "i" : "e"
          } su Le Vestiaire.`,
        });
      entries.push({
        question: `Dove acquistare ${translatedJerseyName}?`,
        answer: priceStr
          ? `${translatedJerseyName} è disponibile a partire da ${priceStr}€ su Classic Football Shirts, specialista in maglie da calcio vintage e da collezione.`
          : `${translatedJerseyName} è disponibile su Classic Football Shirts, specialista in maglie da calcio vintage e da collezione.`,
      });
      break;

    case "nl":
      entries.push({
        question: `Wie maakt het ${clubName} ${typeLower} shirt in ${season}?`,
        answer: `Het ${clubName} ${typeLower} shirt voor het seizoen ${season} wordt gemaakt door ${brand}.`,
      });
      entries.push({
        question: `In welke competitie speelt ${clubName} in het seizoen ${season}?`,
        answer: `${clubName} speelt in de ${leagueName} in het seizoen ${season}.`,
      });
      if (collectionCount > 0)
        entries.push({
          question: `Hoeveel verzamelaars bezitten het ${clubShortName} ${season} shirt op Le Vestiaire?`,
          answer: `${collectionCount} verzamelaar${
            collectionCount > 1 ? "s bezitten" : " bezit"
          } dit shirt op het platform Le Vestiaire.`,
        });
      if (avg && totalRatings > 0)
        entries.push({
          question: `Wat is de community-beoordeling van ${translatedJerseyName}?`,
          answer: `${translatedJerseyName} heeft een gemiddelde beoordeling van ${avg}/5 op basis van ${totalRatings} beoordeling${
            totalRatings > 1 ? "en" : ""
          } op Le Vestiaire.`,
        });
      entries.push({
        question: `Waar kun je ${translatedJerseyName} kopen?`,
        answer: priceStr
          ? `${translatedJerseyName} is verkrijgbaar vanaf ${priceStr}€ op Classic Football Shirts, specialist in vintage en verzamel-voetbalshirts.`
          : `${translatedJerseyName} is verkrijgbaar op Classic Football Shirts, specialist in vintage en verzamel-voetbalshirts.`,
      });
      break;

    case "pt":
      entries.push({
        question: `Quem é o fabricante da camisola ${typeLower} do ${clubName} em ${season}?`,
        answer: `A camisola ${typeLower} do ${clubName} para a época ${season} é fabricada pela ${brand}.`,
      });
      entries.push({
        question: `Em que competição joga o ${clubName} na época ${season}?`,
        answer: `O ${clubName} joga na ${leagueName} na época ${season}.`,
      });
      if (collectionCount > 0)
        entries.push({
          question: `Quantos colecionadores possuem a camisola ${clubShortName} ${season} no Le Vestiaire?`,
          answer: `${collectionCount} colecionador${
            collectionCount > 1 ? "es possuem" : " possui"
          } esta camisola na plataforma Le Vestiaire.`,
        });
      if (avg && totalRatings > 0)
        entries.push({
          question: `Qual é a avaliação da comunidade de ${translatedJerseyName}?`,
          answer: `${translatedJerseyName} tem uma avaliação média de ${avg}/5 com base em ${totalRatings} avaliaç${
            totalRatings > 1 ? "ões" : "ão"
          } no Le Vestiaire.`,
        });
      entries.push({
        question: `Onde comprar ${translatedJerseyName}?`,
        answer: priceStr
          ? `${translatedJerseyName} está disponível a partir de ${priceStr}€ na Classic Football Shirts, especialista em camisolas de futebol vintage e de coleção.`
          : `${translatedJerseyName} está disponível na Classic Football Shirts, especialista em camisolas de futebol vintage e de coleção.`,
      });
      break;

    default:
      entries.push({
        question: `Qui est l'équipementier du maillot ${typeLower} de ${clubName} en ${season} ?`,
        answer: `Le maillot ${typeLower} de ${clubName} pour la saison ${season} est fabriqué par ${brand}.`,
      });
      entries.push({
        question: `Dans quelle compétition évolue ${clubName} lors de la saison ${season} ?`,
        answer: `${clubName} participe à la ${leagueName} lors de la saison ${season}.`,
      });
      if (collectionCount > 0)
        entries.push({
          question: `Combien de collectionneurs possèdent le maillot ${clubShortName} ${season} sur Le Vestiaire ?`,
          answer: `${collectionCount} ${
            collectionCount > 1
              ? "collectionneurs possèdent"
              : "collectionneur possède"
          } ce maillot sur la plateforme Le Vestiaire.`,
        });
      if (avg && totalRatings > 0)
        entries.push({
          question: `Quelle est la note communautaire du maillot ${translatedJerseyName} ?`,
          answer: `Le maillot ${translatedJerseyName} a une note moyenne de ${avg}/5 basée sur ${totalRatings} évaluation${
            totalRatings > 1 ? "s" : ""
          } sur Le Vestiaire.`,
        });
      entries.push({
        question: `Où acheter le maillot ${translatedJerseyName} ?`,
        answer: priceStr
          ? `Le maillot ${translatedJerseyName} est disponible à partir de ${priceStr}€ sur Classic Football Shirts, spécialiste en maillots de football vintage et de collection.`
          : `Le maillot ${translatedJerseyName} est disponible sur Classic Football Shirts, spécialiste en maillots de football vintage et de collection.`,
      });
      break;
  }

  return entries;
}
