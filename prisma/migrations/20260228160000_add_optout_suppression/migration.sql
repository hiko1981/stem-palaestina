-- AlterTable: add opt-out fields to candidates
ALTER TABLE "candidates" ADD COLUMN "opted_out" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "candidates" ADD COLUMN "opted_out_at" TIMESTAMP(3);

-- CreateTable: phone_suppressions
CREATE TABLE "phone_suppressions" (
    "id" SERIAL NOT NULL,
    "phone_hash" TEXT NOT NULL,
    "scope" TEXT NOT NULL DEFAULT 'all',
    "reason" TEXT NOT NULL DEFAULT 'user_request',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "phone_suppressions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "phone_suppressions_phone_hash_key" ON "phone_suppressions"("phone_hash");

-- CreateTable: candidate_invite_phones
CREATE TABLE "candidate_invite_phones" (
    "id" SERIAL NOT NULL,
    "candidate_id" INTEGER NOT NULL,
    "phone_hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "candidate_invite_phones_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "candidate_invite_phones_candidate_id_phone_hash_key" ON "candidate_invite_phones"("candidate_id", "phone_hash");

-- AddForeignKey
ALTER TABLE "candidate_invite_phones" ADD CONSTRAINT "candidate_invite_phones_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "candidates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
