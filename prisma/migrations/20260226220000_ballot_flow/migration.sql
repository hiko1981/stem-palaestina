-- CreateTable: ballot_tokens
CREATE TABLE "ballot_tokens" (
    "id" SERIAL NOT NULL,
    "token" UUID NOT NULL,
    "phone_hash" TEXT NOT NULL,
    "device_id" TEXT,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ballot_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: ballot_tokens unique token
CREATE UNIQUE INDEX "ballot_tokens_token_key" ON "ballot_tokens"("token");

-- CreateIndex: ballot_tokens phone_hash index
CREATE INDEX "ballot_tokens_phone_hash_idx" ON "ballot_tokens"("phone_hash");

-- AlterTable: votes — drop old token_id column, add phone_hash + vote_value
DROP INDEX "votes_token_id_key";
ALTER TABLE "votes" DROP COLUMN "token_id";
ALTER TABLE "votes" ADD COLUMN "phone_hash" TEXT NOT NULL;
ALTER TABLE "votes" ADD COLUMN "vote_value" BOOLEAN NOT NULL;
CREATE UNIQUE INDEX "votes_phone_hash_key" ON "votes"("phone_hash");

-- AlterTable: candidates — add phone_hash column
ALTER TABLE "candidates" ADD COLUMN "phone_hash" TEXT;

-- DropTable: sms_verifications (replaced by ballot_tokens)
DROP TABLE "sms_verifications";
