-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN     "otpCorreoActivo" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "pinHash" TEXT;
