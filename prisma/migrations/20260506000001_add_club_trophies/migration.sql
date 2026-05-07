ALTER TABLE "clubs" ADD COLUMN IF NOT EXISTS "apiFootballTeamId" INTEGER;

CREATE TABLE IF NOT EXISTS "club_trophies" (
  "id"          TEXT NOT NULL,
  "clubId"      TEXT NOT NULL,
  "competition" TEXT NOT NULL,
  "country"     TEXT NOT NULL,
  "season"      TEXT NOT NULL,
  "place"       TEXT NOT NULL,
  "fetchedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "club_trophies_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "club_trophies_clubId_fkey" FOREIGN KEY ("clubId")
    REFERENCES "clubs"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "club_trophies_clubId_competition_season_place_key"
  ON "club_trophies"("clubId", "competition", "season", "place");

CREATE INDEX IF NOT EXISTS "club_trophies_clubId_season_idx"
  ON "club_trophies"("clubId", "season");
