-- CreateTable
CREATE TABLE "DatosPagoRecolecta" (
    "id" TEXT NOT NULL,
    "recolectaId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "banco" TEXT,
    "tipoCuenta" TEXT,
    "numeroCuenta" TEXT,
    "titular" TEXT,
    "cedula" TEXT,
    "telefono" TEXT,
    "wallet" TEXT,

    CONSTRAINT "DatosPagoRecolecta_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DatosPagoRecolecta_recolectaId_key" ON "DatosPagoRecolecta"("recolectaId");

-- AddForeignKey
ALTER TABLE "DatosPagoRecolecta" ADD CONSTRAINT "DatosPagoRecolecta_recolectaId_fkey" FOREIGN KEY ("recolectaId") REFERENCES "Recolecta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

