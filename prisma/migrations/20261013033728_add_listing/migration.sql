-- CreateEnum
CREATE TYPE "ListingStatus" AS ENUM ('OPEN', 'CLOSED');

-- CreateTable
CREATE TABLE "listing" (
    "id" TEXT NOT NULL,
    "producerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "pricePerKg" INTEGER NOT NULL,
    "quantityG" INTEGER NOT NULL,
    "minOrderG" INTEGER NOT NULL,
    "unitG" INTEGER NOT NULL,
    "delivery" BOOLEAN NOT NULL,
    "pickup" BOOLEAN NOT NULL,
    "shippingYen" INTEGER NOT NULL,
    "replyDays" INTEGER NOT NULL,
    "shipDates" DATE[],
    "status" "ListingStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "listing_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "listing_producerId_createdAt_idx" ON "listing"("producerId", "createdAt");

-- CreateIndex
CREATE INDEX "listing_status_name_idx" ON "listing"("status", "name");

-- AddForeignKey
ALTER TABLE "listing" ADD CONSTRAINT "listing_producerId_fkey" FOREIGN KEY ("producerId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
