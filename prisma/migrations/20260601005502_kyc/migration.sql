-- CreateEnum
CREATE TYPE "TipoDocumento" AS ENUM ('cedula', 'pasaporte');

-- CreateEnum
CREATE TYPE "Nacionalidad" AS ENUM ('V', 'E');

-- CreateEnum
CREATE TYPE "EstadoKyc" AS ENUM ('pendiente', 'en_revision', 'aprobada', 'rechazada', 'reenvio_solicitado', 'baneada');

-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN     "baneado" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "nivelKyc" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "telefono" TEXT,
ADD COLUMN     "telefonoVerificado" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "VerificacionKyc" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "tipoDocumento" "TipoDocumento",
    "nacionalidad" "Nacionalidad",
    "numeroDocumento" TEXT,
    "docFrenteKey" TEXT,
    "docReversoKey" TEXT,
    "selfieKey" TEXT,
    "videoKey" TEXT,
    "direccion" TEXT,
    "ciudad" TEXT,
    "estadoRegion" TEXT,
    "estado" "EstadoKyc" NOT NULL DEFAULT 'pendiente',
    "motivoRechazo" TEXT,
    "notaInterna" TEXT,
    "revisadoPorId" TEXT,
    "creadaEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revisadaEn" TIMESTAMP(3),

    CONSTRAINT "VerificacionKyc_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VerificacionKyc_usuarioId_idx" ON "VerificacionKyc"("usuarioId");

-- CreateIndex
CREATE INDEX "VerificacionKyc_estado_idx" ON "VerificacionKyc"("estado");

-- AddForeignKey
ALTER TABLE "VerificacionKyc" ADD CONSTRAINT "VerificacionKyc_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificacionKyc" ADD CONSTRAINT "VerificacionKyc_revisadoPorId_fkey" FOREIGN KEY ("revisadoPorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
