-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('usuario', 'admin_grupo', 'super_admin');

-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL,
    "correo" TEXT NOT NULL,
    "hashContrasena" TEXT,
    "correoVerificado" BOOLEAN NOT NULL DEFAULT false,
    "rol" "Rol" NOT NULL DEFAULT 'usuario',
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_correo_key" ON "Usuario"("correo");
