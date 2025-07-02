import { authenticator } from 'otplib';
import qrcode from 'qrcode';
import * as userModel from '../models/userModel.js';
import { User, UpdateUserPayload } from '../shared/schemas/usersSchemas.js';
import { ERROR_KEYS, ForbiddenError, NotFoundError } from '../utils/appError.js';
import { encrypt, decrypt } from '../utils/cryptoUtils.js';

/**
 * Génère un nouveau secret et l'URL du QR code pour un utilisateur.
 * @param {User} user - L'objet utilisateur complet.
 * @returns {Promise<{ secret: string, qrCodeDataURL: string }>} Le secret et l'URL du QR code.
 */
export async function generateTwoFactorSecret(user: User): Promise<{ secret: string, qrCodeDataURL: string }> {
    const secret = authenticator.generateSecret();
    const otpauth = authenticator.keyuri(user.email, 'KingPong', secret);

    const encryptedSecret = encrypt(secret);
    await userModel.updateUserInDb(user.id, { two_fa_secret: encryptedSecret });

    const qrCodeDataURL = await qrcode.toDataURL(otpauth);
    return { secret, qrCodeDataURL };
}

/**
 * Vérifie le token fourni par l'utilisateur et, si valide, active la 2FA.
 * @param {number} userId - L'ID de l'utilisateur.
 * @param {string} token - Le token à 6 chiffres.
 * @returns {Promise<boolean>} Vrai si le token est valide.
 * @throws {NotFoundError} Si l'utilisateur ou le secret n'est pas trouvé.
 */
export async function verifyAndEnableTwoFactor(userId: number, token: string): Promise<boolean> {
    const user = await userModel.getUserWithSecretsByIdFromDb(userId);

    if (!user || !user.two_fa_secret) {
        throw new NotFoundError(ERROR_KEYS.USER_NOT_FOUND);
    }
    
    const decryptedSecret = decrypt(user.two_fa_secret);
    const isValid = authenticator.verify({ token, secret: decryptedSecret });

    if (isValid) {
        await userModel.updateUserInDb(userId, { is_two_fa_enabled: true });
        return true;
    }
    return false;
}

/**
 * Désactive la 2FA pour un utilisateur donné.
 * @param {number} userId - L'ID de l'utilisateur.
 * @returns {Promise<void>}
 * @throws {NotFoundError} Si l'utilisateur n'est pas trouvé.
 */
export async function disableTwoFactor(userId: number): Promise<void> {
    const user = await userModel.getUserByIdFromDb(userId);

    if (!user) {
        throw new NotFoundError(ERROR_KEYS.USER_NOT_FOUND);
    }

    await userModel.updateUserInDb(userId, { 
        is_two_fa_enabled: false,
        two_fa_secret: null 
    });
}