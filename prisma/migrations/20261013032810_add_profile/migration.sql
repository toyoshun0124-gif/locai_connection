-- CreateTable
CREATE TABLE "profile" (
    "userId" TEXT NOT NULL,
    "city" TEXT,
    "shopKind" TEXT,
    "items" TEXT,
    "policy" TEXT,
    "address" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profile_pkey" PRIMARY KEY ("userId")
);

-- AddForeignKey
ALTER TABLE "profile" ADD CONSTRAINT "profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
