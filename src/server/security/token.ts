import { randomBytes } from "node:crypto";

const DEFAULT_TOKEN_BYTES = 32;

export function generateShareToken(byteLength = DEFAULT_TOKEN_BYTES): string {
  return randomBytes(byteLength).toString("base64url");
}
