import { z } from 'zod';
import { t } from './i18nService.js';
export const ServerErrorPayloadSchema = z.object({
    error: z.string(),
    statusCode: z.number(),
    messageKey: z.string().optional(), // On ajoute la clé de traduction
    messageParams: z.record(z.any()).optional(), // Et les paramètres optionnels
    details: z.any().optional(),
});
export class ClientApiError extends Error {
    httpStatus;
    serverStatusCode;
    errorResponse;
    constructor(message, httpStatus, serverStatusCode, errorResponse) {
        super(message);
        this.name = 'ClientApiError';
        this.httpStatus = httpStatus;
        this.serverStatusCode = serverStatusCode;
        this.errorResponse = errorResponse;
        Object.setPrototypeOf(this, ClientApiError.prototype);
    }
}
export function translateResultMessage(message, params) {
    if (!message)
        return t('msg.error.unknown');
    return t(message, params);
}
/**
 * Gère une réponse de l'API, valide le corps avec le schéma Zod approprié
 * en fonction du code de statut HTTP, et gère les erreurs.
 *
 * @param response L'objet Response de fetch.
 * @param responseSchemas Un objet où les clés sont les codes de statut HTTP et les valeurs sont les schémas Zod.
 * @returns Une promesse qui se résout avec les données validées en cas de succès.
 * @throws Une ClientApiError avec le message du serveur en cas de réponse d'erreur (4xx, 5xx).
 */
export async function handleApiResponse(response, responseSchemas) {
    if (!response.ok) {
        let errorPayload;
        let errorMessage = `Erreur HTTP ${response.status}: ${response.statusText}`;
        try {
            const json = await response.json();
            const errorSchema = responseSchemas[response.status];
            if (errorSchema) {
                const parsedError = errorSchema.safeParse(json);
                if (parsedError.success) {
                    errorPayload = parsedError.data;
                    if (errorPayload && errorPayload.messageKey) {
                        errorMessage = t(errorPayload.messageKey, errorPayload.messageParams);
                    }
                    else {
                        errorMessage = errorPayload?.error || t('msg.error.unknown');
                    }
                }
                else {
                    errorMessage = t('msg.error.malformedResponse');
                    console.error("Zod validation failed on error response:", parsedError.error);
                }
            }
            else {
                errorMessage = json.message || json.error || errorMessage;
            }
        }
        catch (e) {
            errorMessage = t('msg.error.networkError');
        }
        throw new ClientApiError(errorMessage, response.status, errorPayload?.statusCode, errorPayload);
    }
    if (response.status === 204) {
        return undefined;
    }
    const successSchema = responseSchemas[response.status] || responseSchemas[200];
    if (!successSchema) {
        throw new ClientApiError(`Aucun schéma de succès défini pour le statut ${response.status}`, response.status);
    }
    const json = await response.json();
    const result = successSchema.safeParse(json);
    if (!result.success) {
        console.error("Erreur de validation Zod (réponse succès invalide):", result.error.issues);
        throw new ClientApiError("Les données reçues du serveur sont invalides.", response.status);
    }
    return result.data;
}
