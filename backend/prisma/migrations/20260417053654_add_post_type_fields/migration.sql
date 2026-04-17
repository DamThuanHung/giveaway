-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "area" DOUBLE PRECISION,
ADD COLUMN     "bedrooms" INTEGER,
ADD COLUMN     "postType" TEXT NOT NULL DEFAULT 'item',
ADD COLUMN     "priceUnit" TEXT,
ADD COLUMN     "serviceArea" TEXT,
ADD COLUMN     "subType" TEXT;

-- CreateIndex
CREATE INDEX "Post_postType_idx" ON "Post"("postType");
