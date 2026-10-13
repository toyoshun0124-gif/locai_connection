-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'CHANGE_PROPOSED', 'CONFIRMED', 'DECLINED', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "ReceiveMethod" AS ENUM ('DELIVERY', 'PICKUP');

-- CreateTable
CREATE TABLE "order" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "quantityG" INTEGER NOT NULL,
    "shipDate" DATE NOT NULL,
    "useDate" DATE NOT NULL,
    "receive" "ReceiveMethod" NOT NULL,
    "dishName" TEXT,
    "wantAiHelp" BOOLEAN NOT NULL DEFAULT false,
    "pricePerKg" INTEGER NOT NULL,
    "itemYen" INTEGER NOT NULL,
    "shippingYen" INTEGER NOT NULL,
    "totalYen" INTEGER NOT NULL,
    "replyDeadline" TIMESTAMP(3) NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "order_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "order_listingId_status_idx" ON "order"("listingId", "status");

-- CreateIndex
CREATE INDEX "order_buyerId_createdAt_idx" ON "order"("buyerId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "order_buyerId_idempotencyKey_key" ON "order"("buyerId", "idempotencyKey");

-- AddForeignKey
ALTER TABLE "order" ADD CONSTRAINT "order_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order" ADD CONSTRAINT "order_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
