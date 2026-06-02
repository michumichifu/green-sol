UPDATE "Usuario" SET "rol" = 'usuario' WHERE "rol" = 'admin_grupo';
ALTER TYPE "Rol" RENAME TO "Rol_old";
CREATE TYPE "Rol" AS ENUM ('usuario', 'super_admin');
ALTER TABLE "Usuario" ALTER COLUMN "rol" DROP DEFAULT;
ALTER TABLE "Usuario" ALTER COLUMN "rol" TYPE "Rol" USING ("rol"::text::"Rol");
ALTER TABLE "Usuario" ALTER COLUMN "rol" SET DEFAULT 'usuario';
DROP TYPE "Rol_old";
