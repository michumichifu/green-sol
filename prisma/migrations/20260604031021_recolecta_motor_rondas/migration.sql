-- AlterTable
ALTER TABLE "Recolecta" ADD COLUMN     "fechaInicio" TIMESTAMP(3),
ADD COLUMN     "organizadorParticipa" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "rondaActual" INTEGER NOT NULL DEFAULT 1;
