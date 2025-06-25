// app/services/users/handlers/twoFactorAuthHandlers.ts
import { FastifyRequest, FastifyReply } from 'fastify';
import * as twoFactorAuthService from '../services/twoFactorAuthService.js';
import * as userService from '../services/userService.js';
import { JWTPayload, UserOnlineStatus } from '../shared/schemas/usersSchemas.js';
import { cookieOptions, jwtToken } from '../shared/auth-plugin/tokens.js';
import { ERROR_KEYS, UnauthorizedError } from '../utils/appError.js';
import { authenticator } from 'otplib';

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
    const { token } = req.body as { token: string };
    const userId = req.session.get('2fa_user_id');

    if (!userId) {
        throw new UnauthorizedError(ERROR_KEYS.UNAUTHORIZED);
    }

    const user = await userService.getUserByIdWithSecrets(userId);
    
    if (!user.two_fa_secret) {
        throw new UnauthorizedError(ERROR_KEYS.LOGIN_INVALID_CREDENTIALS, { detail: '2FA is not properly configured for this user.' });
    }

    const isValid = authenticator.verify({ token, secret: user.two_fa_secret });

    if (isValid) {
        req.session.set('userId', user.id);
        req.session.set('2fa_user_id', undefined);

        const tokenPayload: JWTPayload = { id: user.id, username: user.username };
        const jwt = reply.server.jwt.sign(tokenPayload);
        const decodedToken = reply.server.jwt.decode(jwt) as { exp: number };
        await userService.updateUserStatus(user.id, UserOnlineStatus.ONLINE);

        reply.setCookie(jwtToken, jwt, {
            ...cookieOptions,
            expires: new Date(decodedToken.exp * 1000),
        });

	    const { password_hash, two_fa_secret, ...userPassLess } = user;
        return reply.send({ user: userPassLess });
    } else {
        throw new UnauthorizedError(ERROR_KEYS.LOGIN_INVALID_CREDENTIALS);
    }
}