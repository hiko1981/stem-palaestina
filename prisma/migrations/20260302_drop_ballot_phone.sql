-- Remove plaintext phone numbers from ballot_tokens (privacy fix)
-- First clear any existing plaintext phone data
UPDATE "ballot_tokens" SET "phone" = NULL WHERE "phone" IS NOT NULL;
-- Then drop the column entirely
ALTER TABLE "ballot_tokens" DROP COLUMN IF EXISTS "phone";
