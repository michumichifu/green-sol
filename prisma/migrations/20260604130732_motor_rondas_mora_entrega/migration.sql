-- CreateEnum
CREATE TYPE "TipoMora" AS ENUM ('ninguna', 'fijo', 'porcentaje');

-- AlterTable
ALTER TABLE "Aporte" ADD COLUMN     "ronda" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "Recolecta" ADD COLUMN     "moraTipo" "TipoMora" NOT NULL DEFAULT 'ninguna',
ADD COLUMN     "moraValor" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "Turno" ADD COLUMN     "entregaReferencia" TEXT,
ADD COLUMN     "entregadoEn" TIMESTAMP(3);
