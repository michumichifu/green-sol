-- AlterTable
ALTER TABLE "MetodoPago" DROP COLUMN "tipo",
ADD COLUMN     "alias" TEXT,
ADD COLUMN     "banco" TEXT,
ADD COLUMN     "categoria" TEXT NOT NULL,
ADD COLUMN     "cedula" TEXT,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "metodo" TEXT NOT NULL,
ADD COLUMN     "moneda" TEXT NOT NULL,
ADD COLUMN     "numeroCuenta" TEXT,
ADD COLUMN     "principal" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "telefono" TEXT,
ADD COLUMN     "tipoCuenta" TEXT,
ADD COLUMN     "titular" TEXT,
ADD COLUMN     "wallet" TEXT,
ALTER COLUMN "detalle" DROP NOT NULL;

-- DropEnum
DROP TYPE "TipoMetodoPago";

