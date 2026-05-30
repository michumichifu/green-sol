-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN     "monedaPreferida" TEXT,
ADD COLUMN     "onboardingVisto" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "pais" TEXT;

