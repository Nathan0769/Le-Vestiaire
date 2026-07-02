import * as compute from "./compute";

export const ACHIEVEMENT_TRIGGERS = [
  "collection.add",
  "collection.remove",
  "wishlist.add",
  "social.friend",
  "social.rating",
  "profile.update",
  "contribution.proposal_accepted",
  "contribution.description_accepted",
  "auth.login",
] as const;

export type AchievementTrigger = (typeof ACHIEVEMENT_TRIGGERS)[number];

export type AchievementCategoryValue =
  | "COLLECTION"
  | "DIVERSITY"
  | "SOCIAL"
  | "LEADERBOARD"
  | "LOYALTY"
  | "RARITY"
  | "CONTRIBUTION";

export type AchievementTier = "BRONZE" | "SILVER" | "GOLD" | "PLATINUM";

export interface AchievementDefinition {
  category: AchievementCategoryValue;
  tier?: AchievementTier;
  threshold: number;
  triggers: readonly AchievementTrigger[];
  hidden?: boolean;
  i18nKey: string;
  computeProgress: (userId: string) => Promise<number>;
}

export const ACHIEVEMENTS: Record<string, AchievementDefinition> = {
  // ---------- COLLECTION ----------
  "collection.first": {
    category: "COLLECTION",
    tier: "BRONZE",
    threshold: 1,
    triggers: ["collection.add"],
    i18nKey: "achievements.definitions.collection.first",
    computeProgress: compute.getUserJerseyCount,
  },
  "collection.10": {
    category: "COLLECTION",
    tier: "BRONZE",
    threshold: 10,
    triggers: ["collection.add"],
    i18nKey: "achievements.definitions.collection.10",
    computeProgress: compute.getUserJerseyCount,
  },
  "collection.25": {
    category: "COLLECTION",
    tier: "SILVER",
    threshold: 25,
    triggers: ["collection.add"],
    i18nKey: "achievements.definitions.collection.25",
    computeProgress: compute.getUserJerseyCount,
  },
  "collection.50": {
    category: "COLLECTION",
    tier: "SILVER",
    threshold: 50,
    triggers: ["collection.add"],
    i18nKey: "achievements.definitions.collection.50",
    computeProgress: compute.getUserJerseyCount,
  },
  "collection.100": {
    category: "COLLECTION",
    tier: "GOLD",
    threshold: 100,
    triggers: ["collection.add"],
    i18nKey: "achievements.definitions.collection.100",
    computeProgress: compute.getUserJerseyCount,
  },
  "collection.250": {
    category: "COLLECTION",
    tier: "PLATINUM",
    threshold: 250,
    triggers: ["collection.add"],
    i18nKey: "achievements.definitions.collection.250",
    computeProgress: compute.getUserJerseyCount,
  },
  "collection.value.1k": {
    category: "COLLECTION",
    tier: "SILVER",
    threshold: 1000,
    triggers: ["collection.add"],
    i18nKey: "achievements.definitions.collection.value.1k",
    computeProgress: compute.getUserCollectionValue,
  },
  "collection.value.10k": {
    category: "COLLECTION",
    tier: "GOLD",
    threshold: 10000,
    triggers: ["collection.add"],
    i18nKey: "achievements.definitions.collection.value.10k",
    computeProgress: compute.getUserCollectionValue,
  },

  // ---------- DIVERSITY ----------
  "diversity.clubs.5": {
    category: "DIVERSITY",
    tier: "BRONZE",
    threshold: 5,
    triggers: ["collection.add"],
    i18nKey: "achievements.definitions.diversity.clubs.5",
    computeProgress: compute.getUserUniqueClubs,
  },
  "diversity.clubs.20": {
    category: "DIVERSITY",
    tier: "SILVER",
    threshold: 20,
    triggers: ["collection.add"],
    i18nKey: "achievements.definitions.diversity.clubs.20",
    computeProgress: compute.getUserUniqueClubs,
  },
  "diversity.clubs.50": {
    category: "DIVERSITY",
    tier: "GOLD",
    threshold: 50,
    triggers: ["collection.add"],
    i18nKey: "achievements.definitions.diversity.clubs.50",
    computeProgress: compute.getUserUniqueClubs,
  },
  "diversity.leagues.3": {
    category: "DIVERSITY",
    tier: "BRONZE",
    threshold: 3,
    triggers: ["collection.add"],
    i18nKey: "achievements.definitions.diversity.leagues.3",
    computeProgress: compute.getUserUniqueLeagues,
  },
  "diversity.leagues.10": {
    category: "DIVERSITY",
    tier: "GOLD",
    threshold: 10,
    triggers: ["collection.add"],
    i18nKey: "achievements.definitions.diversity.leagues.10",
    computeProgress: compute.getUserUniqueLeagues,
  },
  "diversity.vintage.pre2000": {
    category: "DIVERSITY",
    tier: "SILVER",
    threshold: 5,
    triggers: ["collection.add"],
    i18nKey: "achievements.definitions.diversity.vintage.pre2000",
    computeProgress: compute.getUserVintageCount,
  },

  // ---------- FANDOM (same club, tiered) ----------
  "collection.same_club.5": {
    category: "COLLECTION",
    tier: "BRONZE",
    threshold: 5,
    triggers: ["collection.add"],
    i18nKey: "achievements.definitions.collection.same_club.5",
    computeProgress: compute.getUserMaxJerseysPerClub,
  },
  "collection.same_club.15": {
    category: "COLLECTION",
    tier: "SILVER",
    threshold: 15,
    triggers: ["collection.add"],
    i18nKey: "achievements.definitions.collection.same_club.15",
    computeProgress: compute.getUserMaxJerseysPerClub,
  },
  "collection.same_club.30": {
    category: "COLLECTION",
    tier: "GOLD",
    threshold: 30,
    triggers: ["collection.add"],
    i18nKey: "achievements.definitions.collection.same_club.30",
    computeProgress: compute.getUserMaxJerseysPerClub,
  },

  // ---------- SOCIAL ----------
  "social.friend.first": {
    category: "SOCIAL",
    tier: "BRONZE",
    threshold: 1,
    triggers: ["social.friend"],
    i18nKey: "achievements.definitions.social.friend.first",
    computeProgress: compute.getUserFriendCount,
  },
  "social.friend.10": {
    category: "SOCIAL",
    tier: "SILVER",
    threshold: 10,
    triggers: ["social.friend"],
    i18nKey: "achievements.definitions.social.friend.10",
    computeProgress: compute.getUserFriendCount,
  },
  "social.rating.first": {
    category: "SOCIAL",
    tier: "BRONZE",
    threshold: 1,
    triggers: ["social.rating"],
    i18nKey: "achievements.definitions.social.rating.first",
    computeProgress: compute.getUserRatingCount,
  },
  "social.rating.50": {
    category: "SOCIAL",
    tier: "SILVER",
    threshold: 50,
    triggers: ["social.rating"],
    i18nKey: "achievements.definitions.social.rating.50",
    computeProgress: compute.getUserRatingCount,
  },
  "social.profile.complete": {
    category: "SOCIAL",
    tier: "BRONZE",
    threshold: 1,
    triggers: ["profile.update", "collection.add", "auth.login"],
    i18nKey: "achievements.definitions.social.profile.complete",
    computeProgress: compute.getUserProfileComplete,
  },

  // ---------- LOYALTY ----------
  "loyalty.1year": {
    category: "LOYALTY",
    tier: "SILVER",
    threshold: 365,
    triggers: ["auth.login", "collection.add"],
    i18nKey: "achievements.definitions.loyalty.1year",
    computeProgress: compute.getUserAccountAgeDays,
  },
  "loyalty.2year": {
    category: "LOYALTY",
    tier: "GOLD",
    threshold: 730,
    triggers: ["auth.login", "collection.add"],
    i18nKey: "achievements.definitions.loyalty.2year",
    computeProgress: compute.getUserAccountAgeDays,
  },

  // ---------- RARITY ----------
  "rarity.pre1990": {
    category: "RARITY",
    tier: "SILVER",
    threshold: 1,
    triggers: ["collection.add"],
    i18nKey: "achievements.definitions.rarity.pre1990",
    computeProgress: compute.getUserPre1990Count,
  },
  "rarity.goalkeeper": {
    category: "RARITY",
    tier: "BRONZE",
    threshold: 1,
    triggers: ["collection.add"],
    i18nKey: "achievements.definitions.rarity.goalkeeper",
    computeProgress: compute.getUserGoalkeeperCount,
  },

  // ---------- CONTRIBUTION ----------
  "contribution.proposal.first": {
    category: "CONTRIBUTION",
    tier: "BRONZE",
    threshold: 1,
    triggers: ["contribution.proposal_accepted"],
    i18nKey: "achievements.definitions.contribution.proposal.first",
    computeProgress: compute.getUserAcceptedProposalCount,
  },
  "contribution.proposal.10": {
    category: "CONTRIBUTION",
    tier: "SILVER",
    threshold: 10,
    triggers: ["contribution.proposal_accepted"],
    i18nKey: "achievements.definitions.contribution.proposal.10",
    computeProgress: compute.getUserAcceptedProposalCount,
  },
  "contribution.description.first": {
    category: "CONTRIBUTION",
    tier: "BRONZE",
    threshold: 1,
    triggers: ["contribution.description_accepted"],
    i18nKey: "achievements.definitions.contribution.description.first",
    computeProgress: compute.getUserAcceptedDescriptionCount,
  },

  // ---------- SPECIAL (hidden) ----------
  "special.founder": {
    category: "LOYALTY",
    tier: "PLATINUM",
    threshold: 1,
    triggers: ["auth.login", "collection.add"],
    hidden: true,
    i18nKey: "achievements.definitions.special.founder",
    computeProgress: compute.getUserIsFounder,
  },
};
