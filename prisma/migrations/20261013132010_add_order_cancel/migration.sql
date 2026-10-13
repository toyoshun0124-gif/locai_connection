-- AlterTable
ALTER TABLE "order" ADD COLUMN     "cancelledAfterConfirm" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "cancelledBy" "Role";
