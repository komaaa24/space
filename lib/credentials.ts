import crypto from "crypto";

const PREFIX = "enc:v1:";

function getEncryptionKey() {
  const raw = process.env.CREDENTIAL_ENCRYPTION_KEY;
  if (!raw) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("CREDENTIAL_ENCRYPTION_KEY production muhitida majburiy");
    }
    return null;
  }

  const normalized = raw.startsWith("base64:") ? raw.slice("base64:".length) : raw;
  const key = Buffer.from(normalized, "base64");
  if (key.length !== 32) {
    throw new Error("CREDENTIAL_ENCRYPTION_KEY 32 bayt base64 bo'lishi kerak");
  }
  return key;
}

export function encryptCredential(value: string | null | undefined) {
  if (!value) return value ?? null;
  if (value.startsWith(PREFIX)) return value;

  const key = getEncryptionKey();
  if (!key) return value;

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return `${PREFIX}${Buffer.concat([iv, tag, ciphertext]).toString("base64url")}`;
}

export function decryptCredential(value: string | null | undefined) {
  if (!value) return value ?? null;
  if (!value.startsWith(PREFIX)) return value;

  const key = getEncryptionKey();
  if (!key) {
    throw new Error("Encrypted credentialni o'qish uchun CREDENTIAL_ENCRYPTION_KEY kerak");
  }

  const payload = Buffer.from(value.slice(PREFIX.length), "base64url");
  const iv = payload.subarray(0, 12);
  const tag = payload.subarray(12, 28);
  const ciphertext = payload.subarray(28);
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
}
