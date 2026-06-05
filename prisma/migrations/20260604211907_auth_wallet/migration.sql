-- CreateEnum
CREATE TYPE "MetodoRegistro" AS ENUM ('correo', 'wallet');

-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN     "registradoCon" "MetodoRegistro" NOT NULL DEFAULT 'correo',
ADD COLUMN     "walletAddress" TEXT,
ALTER COLUMN "correo" DROP NOT NULL;

-- CreateTable
CREATE TABLE "AuthNonce" (
    "id" TEXT NOT NULL,
    "nonce" TEXT NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "proposito" TEXT NOT NULL,
    "usado" BOOLEAN NOT NULL DEFAULT false,
    "expiraEn" TIMESTAMP(3) NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuthNonce_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AuthNonce_nonce_key" ON "AuthNonce"("nonce");

-- CreateIndex
CREATE INDEX "AuthNonce_walletAddress_idx" ON "AuthNonce"("walletAddress");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_walletAddress_key" ON "Usuario"("walletAddress");

