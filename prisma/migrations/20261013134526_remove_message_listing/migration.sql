/*
  Warnings:

  - You are about to drop the column `listingId` on the `message` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "message" DROP CONSTRAINT "message_listingId_fkey";

-- AlterTable
ALTER TABLE "message" DROP COLUMN "listingId";
