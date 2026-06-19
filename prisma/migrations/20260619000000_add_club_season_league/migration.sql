-- CreateTable
CREATE TABLE "club_season_leagues" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "season" TEXT NOT NULL,
    "leagueId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "club_season_leagues_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "club_season_leagues_clubId_idx" ON "club_season_leagues"("clubId");

-- CreateIndex
CREATE INDEX "club_season_leagues_leagueId_idx" ON "club_season_leagues"("leagueId");

-- CreateIndex
CREATE UNIQUE INDEX "club_season_leagues_clubId_season_key" ON "club_season_leagues"("clubId", "season");

-- AddForeignKey
ALTER TABLE "club_season_leagues" ADD CONSTRAINT "club_season_leagues_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "clubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "club_season_leagues" ADD CONSTRAINT "club_season_leagues_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "leagues"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
