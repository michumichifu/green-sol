-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN     "pinBloqueadoHasta" TIMESTAMP(3),
ADD COLUMN     "pinIntentos" INTEGER NOT NULL DEFAULT 0;
