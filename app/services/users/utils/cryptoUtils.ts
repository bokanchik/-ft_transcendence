import crypto from 'crypto';
import { config } from '../shared/env.js';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

const ENCRYPTION_KEY = crypto.createHash('sha256').update(String(config.CRYPTO_SECRET)).digest('base64').substring(0, 32);

/**
 * Chiffre une chaîne de caractères.
 * @param {string} text - Le texte à chiffrer.
 * @returns {string} La chaîne chiffrée, incluant l'IV et l'auth tag, encodée en base64.
 */
export function encrypt(text: string): string {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);

    const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();

    return Buffer.concat([iv, authTag, encrypted]).toString('base64');
}

/**
 * Déchiffre une chaîne de caractères.
 * @param {string} encryptedText - La chaîne chiffrée (au format de la fonction encrypt).
 * @returns {string} Le texte original déchiffré.
 */
export function decrypt(encryptedText: string): string {
    const data = Buffer.from(encryptedText, 'base64');
    
    const iv = data.subarray(0, IV_LENGTH);
    const authTag = data.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
    const encrypted = data.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);

    return decrypted.toString('utf8');
}