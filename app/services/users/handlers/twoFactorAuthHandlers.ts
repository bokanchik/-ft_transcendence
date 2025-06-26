// app/services/users/handlers/twoFactorAuthHandlers.ts
import { FastifyRequest, FastifyReply } from 'fastify';
import * as twoFactorAuthService from '../services/twoFactorAuthService.js';
import * as userService from '../services/userService.js';
import { JWTPayload, UserOnlineStatus } from '../shared/schemas/usersSchemas.js';
import { cookieOptions, jwtToken } from '../shared/auth-plugin/tokens.js';
import { ERROR_KEYS, UnauthorizedError, ForbiddenError } from '../utils/appError.js';
import { authenticator } from 'otplib';
import { decrypt } from '../utils/cryptoUtils.js';

export async function generate2FAHandler(req: FastifyRequest, reply: FastifyReply) {
    const user = req.user as JWTPayload;
    const userDetails = await userService.getUserById(user.id);
    const { qrCodeDataURL } = await twoFactorAuthService.generateTwoFactorSecret(userDetails);
    reply.send({ qrCodeDataURL });
}

export async function verify2FAHandler(req: FastifyRequest, reply: FastifyReply) {
    const user = req.user as JWTPayload;
    const { token } = req.body as { token: string };
    const isValid = await twoFactorAuthService.verifyAndEnableTwoFactor(user.id, token);

    if (isValid) {
        reply.send({ message: '2FA enabled successfully!' });
    } else {
        reply.code(400).send({ error: 'Invalid verification code.' });
    }
}

export async function disable2FAHandler(req: FastifyRequest, reply: FastifyReply) {
    const user = req.user as JWTPayload;
    await twoFactorAuthService.disableTwoFactor(user.id);
    reply.send({ message: '2FA has been disabled.' });
}

export async function login2FAHandler(req: FastifyRequest, reply: FastifyReply) {
    const { token: twoFactorToken } = req.body as { token: string };

    const tempToken = req.cookies.jwt_temp_2fa;
    if (!tempToken) {
        throw new UnauthorizedError(ERROR_KEYS.UNAUTHORIZED, { detail: "2FA session expired or invalid." });
    }

    type TempJWTPayload = JWTPayload & { scope?: string };
    const tempUserPayload = await req.server.jwt.verify<TempJWTPayload>(tempToken);

    if (tempUserPayload.scope !== '2fa-pending') {
        throw new ForbiddenError(ERROR_KEYS.FORBIDDEN);
    }
    
    const userId = tempUserPayload.id;
    const user = await userService.getUserByIdWithSecrets(userId);
    
    if (!user.two_fa_secret) {
        throw new UnauthorizedError(ERROR_KEYS.LOGIN_INVALID_CREDENTIALS, { detail: '2FA is not properly configured for this user.' });
    }

    const decryptedSecret = decrypt(user.two_fa_secret);
    const isValid = authenticator.verify({ token: twoFactorToken, secret: decryptedSecret });

    if (isValid) {
        const tokenPayload: JWTPayload = { id: user.id, username: user.username };
        const jwt = reply.server.jwt.sign(tokenPayload);
        const decodedToken = reply.server.jwt.decode(jwt) as { exp: number };
        await userService.updateUserStatus(user.id, UserOnlineStatus.ONLINE);

        reply.setCookie(jwtToken, jwt, {
            ...cookieOptions,
            expires: new Date(decodedToken.exp * 1000),
        });
        reply.clearCookie('jwt_temp_2fa', { path: '/' });

	    const { password_hash, two_fa_secret, ...userPassLess } = user;
        return reply.send({
            message: "Login with 2FA successful",
            user: userPassLess,
        });
    } else {
        throw new UnauthorizedError(ERROR_KEYS.LOGIN_INVALID_CREDENTIALS);
    }
}