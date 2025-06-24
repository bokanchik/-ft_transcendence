import { authenticator } from 'otplib';
import qrcode from 'qrcode';
import * as userModel from '../models/userModel.js';
import { User } from '../shared/schemas/usersSchemas.js';
import { ERROR_KEYS, ForbiddenError, NotFoundError } from '../utils/appError.js';

// Génère un nouveau secret et l'URL du QR code pour un utilisateur
export async function generateTwoFactorSecret(user: User) {
    const secret = authenticator.generateSecret();
    const otpauth = authenticator.keyuri(user.email, 'KingPong', secret);

    // Stocker le secret (temporairement, en attendant la vérification)
    // En production, il faudrait chiffrer ce secret avant de le stocker !
    await userModel.updateUserInDb(user.id, { two_fa_secret: secret });

    const qrCodeDataURL = await qrcode.toDataURL(otpauth);
    return { secret, qrCodeDataURL };
}

// Vérifie le token et active la 2FA
export async function verifyAndEnableTwoFactor(userId: number, token: string): Promise<boolean> {
    const user = await userModel.getUserWithSecretsByIdFromDb(userId);

    if (!user || !user.two_fa_secret) {
        throw new NotFoundError(ERROR_KEYS.USER_NOT_FOUND);
    }
    
    const isValid = authenticator.verify({ token, secret: user.two_fa_secret });

    if (isValid) {
        await userModel.updateUserInDb(userId, { is_two_fa_enabled: true });
        return true;
    }
    return false;
}