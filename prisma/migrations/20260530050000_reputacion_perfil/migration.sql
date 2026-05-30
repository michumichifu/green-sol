-- CreateEnum
CREATE TYPE "TipoMetodoPago" AS ENUM ('efectivo', 'transferencia_bs', 'pago_movil', 'wallet_usdt', 'wallet_solana');

-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN     "apellido" TEXT,
ADD COLUMN     "fotoUrl" TEXT,
ADD COLUMN     "nombre" TEXT,
ADD COLUMN     "nombreUsuario" TEXT;

-- CreateTable
CREATE TABLE "MetodoPago" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "tipo" "TipoMetodoPago" NOT NULL,
    "detalle" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MetodoPago_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Valoracion" (
    "id" TEXT NOT NULL,
    "recolectaId" TEXT NOT NULL,
    "deUsuarioId" TEXT NOT NULL,
    "aUsuarioId" TEXT NOT NULL,
    "voto" INTEGER NOT NULL,
    "comentario" TEXT,
    "creadaEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Valoracion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Valoracion_recolectaId_deUsuarioId_aUsuarioId_key" ON "Valoracion"("recolectaId", "deUsuarioId", "aUsuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_nombreUsuario_key" ON "Usuario"("nombreUsuario");

-- AddForeignKey
ALTER TABLE "MetodoPago" ADD CONSTRAINT "MetodoPago_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Valoracion" ADD CONSTRAINT "Valoracion_recolectaId_fkey" FOREIGN KEY ("recolectaId") REFERENCES "Recolecta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Valoracion" ADD CONSTRAINT "Valoracion_deUsuarioId_fkey" FOREIGN KEY ("deUsuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Valoracion" ADD CONSTRAINT "Valoracion_aUsuarioId_fkey" FOREIGN KEY ("aUsuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

