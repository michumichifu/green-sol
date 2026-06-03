-- CreateEnum
CREATE TYPE "EstadoSolicitud" AS ENUM ('pendiente', 'aprobada', 'rechazada');

-- CreateTable
CREATE TABLE "Invitacion" (
    "id" TEXT NOT NULL,
    "recolectaId" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "creadaPor" TEXT NOT NULL,
    "expiraEn" TIMESTAMP(3) NOT NULL,
    "revocada" BOOLEAN NOT NULL DEFAULT false,
    "creadaEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Invitacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SolicitudUnion" (
    "id" TEXT NOT NULL,
    "recolectaId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "estado" "EstadoSolicitud" NOT NULL DEFAULT 'pendiente',
    "creadaEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resueltaEn" TIMESTAMP(3),

    CONSTRAINT "SolicitudUnion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Invitacion_codigo_key" ON "Invitacion"("codigo");

-- CreateIndex
CREATE INDEX "Invitacion_recolectaId_idx" ON "Invitacion"("recolectaId");

-- CreateIndex
CREATE INDEX "SolicitudUnion_recolectaId_idx" ON "SolicitudUnion"("recolectaId");

-- CreateIndex
CREATE UNIQUE INDEX "SolicitudUnion_recolectaId_usuarioId_key" ON "SolicitudUnion"("recolectaId", "usuarioId");

-- AddForeignKey
ALTER TABLE "Invitacion" ADD CONSTRAINT "Invitacion_recolectaId_fkey" FOREIGN KEY ("recolectaId") REFERENCES "Recolecta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SolicitudUnion" ADD CONSTRAINT "SolicitudUnion_recolectaId_fkey" FOREIGN KEY ("recolectaId") REFERENCES "Recolecta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SolicitudUnion" ADD CONSTRAINT "SolicitudUnion_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
