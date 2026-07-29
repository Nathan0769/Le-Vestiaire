-- Phase contract de l'expand/contract : la colonne userPhotoUrl (single) n'est
-- plus lue ni ecrite par le code (remplacee par userPhotoUrls[]). Safe a droper
-- une fois le deploiement sans usage de userPhotoUrl live en prod.
ALTER TABLE "user_jerseys" DROP COLUMN "userPhotoUrl";
