-- Postgres traite NULL != NULL par défaut dans les index UNIQUE, donc l'index
-- posts_author_id_type_reference_id_cap_kind_key ne bloque pas les doublons
-- quand capKind est NULL (JERSEY_ADD, ACHIEVEMENT_UNLOCK) ou referenceId NULL
-- (CAP_REACHED). Postgres 15+ propose NULLS NOT DISTINCT.

DROP INDEX "posts_author_id_type_reference_id_cap_kind_key";
CREATE UNIQUE INDEX "posts_author_id_type_reference_id_cap_kind_key"
  ON "posts" ("author_id", "type", "reference_id", "cap_kind") NULLS NOT DISTINCT;
