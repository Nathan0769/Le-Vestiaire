import { JerseyType } from "@prisma/client";

export interface CreateProposalData {
  /** Ignoré : le serveur construit le nom en français (buildFrenchJerseyName). */
  name?: string;
  /** Nom saisi pour un maillot SPECIAL (ex. "Centenaire"). */
  specialName?: string;
  clubId: string;
  season: string;
  type: JerseyType;
  brand: string;
  imageUrl: string;
  description?: string;
}

export interface ProposalWithRelations {
  id: string;
  userId: string;
  name: string;
  clubId: string;
  season: string;
  type: JerseyType;
  brand: string;
  imageUrl: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    name: string;
    email: string;
  };
  club: {
    id: string;
    name: string;
    shortName: string;
    logoUrl: string;
  };
}
