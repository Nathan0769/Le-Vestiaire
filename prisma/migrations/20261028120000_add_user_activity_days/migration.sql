-- CreateTable
CREATE TABLE "user_activity_days" (
    "user_id" TEXT NOT NULL,
    "day" DATE NOT NULL,

    CONSTRAINT "user_activity_days_pkey" PRIMARY KEY ("user_id","day")
);

-- CreateIndex
CREATE INDEX "user_activity_days_day_idx" ON "user_activity_days"("day");

-- AddForeignKey
ALTER TABLE "user_activity_days" ADD CONSTRAINT "user_activity_days_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
