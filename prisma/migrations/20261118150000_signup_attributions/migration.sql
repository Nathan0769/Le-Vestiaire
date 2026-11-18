-- CreateTable
CREATE TABLE "signup_attributions" (
    "user_id" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "entry_path" TEXT,
    "referrer_host" TEXT,
    "ref" TEXT,
    "first_path" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "signup_attributions_pkey" PRIMARY KEY ("user_id")
);

-- CreateIndex
CREATE INDEX "signup_attributions_created_at_idx" ON "signup_attributions"("created_at");

-- AddForeignKey
ALTER TABLE "signup_attributions" ADD CONSTRAINT "signup_attributions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

