-- AlterTable
ALTER TABLE "order" ADD COLUMN     "buyerReadAt" TIMESTAMP(3),
ADD COLUMN     "producerReadAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "message" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "listingId" TEXT,

    CONSTRAINT "message_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "message_orderId_createdAt_idx" ON "message"("orderId", "createdAt");

-- AddForeignKey
ALTER TABLE "message" ADD CONSTRAINT "message_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message" ADD CONSTRAINT "message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message" ADD CONSTRAINT "message_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "listing"("id") ON DELETE SET NULL ON UPDATE CASCADE;
