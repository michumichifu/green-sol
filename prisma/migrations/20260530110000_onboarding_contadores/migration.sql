-- AlterTable
ALTER TABLE "Usuario" DROP COLUMN "onboardingVisto",
ADD COLUMN     "ingresos" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "onboardingCerrado" INTEGER NOT NULL DEFAULT 0;

