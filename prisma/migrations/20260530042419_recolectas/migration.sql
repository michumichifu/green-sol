-- CreateEnum
CREATE TYPE "TipoRecolecta" AS ENUM ('san', 'vaca');

-- CreateEnum
CREATE TYPE "Visibilidad" AS ENUM ('privado', 'publico');

-- CreateEnum
CREATE TYPE "MetodoRecolecta" AS ENUM ('tradicional', 'cripto');

-- CreateEnum
CREATE TYPE "EstadoRecolecta" AS ENUM ('abierta', 'activa', 'cerrada');

-- CreateTable
CREATE TABLE "Recolecta" (
    "id" TEXT NOT NULL,
    "tipo" "TipoRecolecta" NOT NULL,
    "nombre" TEXT NOT NULL,
    "visibilidad" "Visibilidad" NOT NULL DEFAULT 'privado',
    "metodo" "MetodoRecolecta" NOT NULL DEFAULT 'tradicional',
    "moneda" TEXT NOT NULL DEFAULT 'USD',
    "montoAporte" DOUBLE PRECISION,
    "meta" DOUBLE PRECISION,
    "estado" "EstadoRecolecta" NOT NULL DEFAULT 'abierta',
    "organizadorId" TEXT NOT NULL,
    "creadaEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Recolecta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Participante" (
    "id" TEXT NOT NULL,
    "recolectaId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "unidoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Participante_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Turno" (
    "id" TEXT NOT NULL,
    "recolectaId" TEXT NOT NULL,
    "participanteId" TEXT NOT NULL,
    "posicion" INTEGER NOT NULL,
    "cobrado" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Turno_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Participante_recolectaId_usuarioId_key" ON "Participante"("recolectaId", "usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "Turno_participanteId_key" ON "Turno"("participanteId");

-- AddForeignKey
ALTER TABLE "Recolecta" ADD CONSTRAINT "Recolecta_organizadorId_fkey" FOREIGN KEY ("organizadorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Participante" ADD CONSTRAINT "Participante_recolectaId_fkey" FOREIGN KEY ("recolectaId") REFERENCES "Recolecta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Participante" ADD CONSTRAINT "Participante_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Turno" ADD CONSTRAINT "Turno_recolectaId_fkey" FOREIGN KEY ("recolectaId") REFERENCES "Recolecta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Turno" ADD CONSTRAINT "Turno_participanteId_fkey" FOREIGN KEY ("participanteId") REFERENCES "Participante"("id") ON DELETE CASCADE ON UPDATE CASCADE;
