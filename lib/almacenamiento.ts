import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  CreateBucketCommand,
  HeadBucketCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { mkdir, writeFile, readFile, unlink } from "node:fs/promises";
import { join, dirname } from "node:path";

/**
 * Almacenamiento de archivos privados (documentos KYC).
 *
 * Camino principal: MinIO/S3 (vars S3_*). El navegador NUNCA habla con MinIO:
 * sube al servidor (Server Action) y el servidor reenvía aquí. Las URLs firmadas
 * solo se usan para LECTURA temporal (que el super-admin vea documentos).
 *
 * Fallback: si faltan las vars S3_*, guarda en disco en `.almacen/` (fuera de
 * `public/`), para no bloquear el desarrollo sin MinIO. En ese modo la "URL
 * firmada" es una ruta interna servida por el route handler autenticado.
 */

const endpoint = process.env.S3_ENDPOINT;
const accessKeyId = process.env.S3_ACCESS_KEY;
const secretAccessKey = process.env.S3_SECRET_KEY;
const bucket = process.env.S3_BUCKET ?? "greensol-kyc";
const region = process.env.S3_REGION ?? "us-east-1";
const forcePathStyle = process.env.S3_FORCE_PATH_STYLE === "true";

const usaS3 = Boolean(endpoint && accessKeyId && secretAccessKey);

const cliente = usaS3
  ? new S3Client({
      endpoint,
      region,
      forcePathStyle,
      credentials: { accessKeyId: accessKeyId!, secretAccessKey: secretAccessKey! },
    })
  : null;

const DIR_LOCAL = join(process.cwd(), ".almacen");

let bucketListo = false;
/** Crea el bucket si no existe (solo en modo S3). Idempotente. */
export async function asegurarBucket(): Promise<void> {
  if (!cliente || bucketListo) return;
  try {
    await cliente.send(new HeadBucketCommand({ Bucket: bucket }));
  } catch {
    await cliente.send(new CreateBucketCommand({ Bucket: bucket }));
  }
  bucketListo = true;
}

/** Sube un archivo y devuelve su KEY (no una URL). */
export async function subirArchivo(
  key: string,
  cuerpo: Buffer,
  contentType: string,
): Promise<string> {
  if (cliente) {
    await asegurarBucket();
    await cliente.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: cuerpo,
        ContentType: contentType,
      }),
    );
  } else {
    const ruta = join(DIR_LOCAL, key);
    await mkdir(dirname(ruta), { recursive: true });
    await writeFile(ruta, cuerpo);
  }
  return key;
}

/** URL temporal de LECTURA de un objeto privado (default 300 s). */
export async function urlFirmadaLectura(
  key: string,
  expiraSeg = 300,
): Promise<string> {
  if (cliente) {
    return getSignedUrl(
      cliente,
      new GetObjectCommand({ Bucket: bucket, Key: key }),
      { expiresIn: expiraSeg },
    );
  }
  // Fallback disco: el route handler /api/almacen valida la sesión.
  return `/api/almacen/${encodeURIComponent(key)}`;
}

/** Lee un archivo del almacén (usado por el route handler en modo disco). */
export async function leerArchivo(key: string): Promise<Buffer> {
  if (cliente) {
    const r = await cliente.send(
      new GetObjectCommand({ Bucket: bucket, Key: key }),
    );
    const bytes = await r.Body!.transformToByteArray();
    return Buffer.from(bytes);
  }
  return readFile(join(DIR_LOCAL, key));
}

/** Borra un archivo del almacén. */
export async function borrarArchivo(key: string): Promise<void> {
  if (cliente) {
    await cliente.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
  } else {
    await unlink(join(DIR_LOCAL, key)).catch(() => {});
  }
}

/** True si el almacenamiento usa MinIO/S3; false si usa disco local. */
export const almacenamientoEsS3 = usaS3;
