-- CreateTable
CREATE TABLE "device_participations" (
    "id" SERIAL NOT NULL,
    "device_id" TEXT NOT NULL,
    "phone_hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "device_participations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "device_participations_device_id_key" ON "device_participations"("device_id");
