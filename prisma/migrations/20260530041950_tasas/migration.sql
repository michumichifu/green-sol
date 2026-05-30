-- CreateTable
CREATE TABLE "TasaCache" (
    "id" TEXT NOT NULL,
    "fuente" TEXT NOT NULL,
    "datos" JSONB NOT NULL,
    "actualizado" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TasaCache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TasaCache_fuente_key" ON "TasaCache"("fuente");
