/**
 * AES-256-GCM encryption for storing user LLM API keys.
 *
 * Requires ENCRYPTION_KEY env var: 64 hex characters (= 32 bytes).
 * Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
 *
 * Encrypted format: iv(24 hex) + authTag(32 hex) + ciphertext(hex)
 * Keys are NEVER decrypted on the client — only inside server actions and API routes.
 */

import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

const ALGORITHM = 'aes-256-gcm'

function getKey(): Buffer {
  const hex = process.env.ENCRYPTION_KEY
  if (!hex || hex.length !== 64) {
    throw new Error(
      'ENCRYPTION_KEY must be a 64-character hex string. ' +
        'Generate with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
    )
  }
  return Buffer.from(hex, 'hex')
}

export function encrypt(plaintext: string): string {
  const key = getKey()
  const iv = randomBytes(12) // 96-bit IV — recommended for GCM
  const cipher = createCipheriv(ALGORITHM, key, iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()
  return iv.toString('hex') + authTag.toString('hex') + encrypted.toString('hex')
}

export function decrypt(ciphertext: string): string {
  const key = getKey()
  const iv = Buffer.from(ciphertext.slice(0, 24), 'hex')
  const authTag = Buffer.from(ciphertext.slice(24, 56), 'hex')
  const encrypted = Buffer.from(ciphertext.slice(56), 'hex')
  const decipher = createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)
  return decipher.update(encrypted).toString('utf8') + decipher.final('utf8')
}
