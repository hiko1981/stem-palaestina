-- CreateTable
CREATE TABLE "admin_users" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "name" TEXT,
    "role" TEXT NOT NULL DEFAULT 'admin',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_devices" (
    "id" SERIAL NOT NULL,
    "admin_user_id" INTEGER NOT NULL,
    "device_id" TEXT NOT NULL,
    "label" TEXT,
    "registered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_used_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "admin_devices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_invites" (
    "id" SERIAL NOT NULL,
    "token" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "invited_by" INTEGER NOT NULL,
    "used_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_invites_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "admin_users_email_key" ON "admin_users"("email");

-- CreateIndex
CREATE INDEX "admin_devices_device_id_idx" ON "admin_devices"("device_id");

-- CreateIndex
CREATE UNIQUE INDEX "admin_devices_admin_user_id_device_id_key" ON "admin_devices"("admin_user_id", "device_id");

-- CreateIndex
CREATE UNIQUE INDEX "admin_invites_token_key" ON "admin_invites"("token");

-- AddForeignKey
ALTER TABLE "admin_devices" ADD CONSTRAINT "admin_devices_admin_user_id_fkey" FOREIGN KEY ("admin_user_id") REFERENCES "admin_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_invites" ADD CONSTRAINT "admin_invites_invited_by_fkey" FOREIGN KEY ("invited_by") REFERENCES "admin_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
