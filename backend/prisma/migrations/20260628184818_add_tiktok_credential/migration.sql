-- CreateTable
CREATE TABLE "TiktokCredential" (
    "id" TEXT NOT NULL,
    "openId" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TiktokCredential_pkey" PRIMARY KEY ("id")
);
