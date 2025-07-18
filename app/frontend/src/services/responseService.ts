import { z } from 'zod';
import { t } from './i18nService.js';

export const ServerErrorPayloadSchema = z.object({
	error: z.string(),
	statusCode: z.number(),
	messageKey: z.string().optional(),
	messageParams: z.record(z.any()).optional(),
	details: z.any().optional(),
});

export type ServerErrorPayload = z.infer<typeof ServerErrorPayloadSchema>;

export class ClientApiError extends Error {
	public httpStatus: number;
	public serverStatusCode?: number;
	public errorResponse?: ServerErrorPayload;

	constructor(
		message: string,
		httpStatus: number,
		serverStatusCode?: number,
		errorResponse?: ServerErrorPayload
	) {
		super(message);
		this.name = 'ClientApiError';
		this.httpStatus = httpStatus;
		this.serverStatusCode = serverStatusCode;
		this.errorResponse = errorResponse;

		Object.setPrototypeOf(this, ClientApiError.prototype);
	}
}

export function translateResultMessage(
	message: string,
	params?: Record<string, any>
): string {
	if (!message) return t('msg.error.unknown');
	return t(message, params);
}

/**
 * Gère une réponse de l'API, valide le corps avec le schéma Zod approprié
 * en fonction du code de statut HTTP, et gère les erreurs.
 * @param response L'objet Response de fetch.
 * @param responseSchemas Un objet où les clés sont les codes de statut HTTP et les valeurs sont les schémas Zod.
 * @returns Une promesse qui se résout avec les données validées en cas de succès.
 * @throws Une ClientApiError avec le message du serveur en cas de réponse d'erreur (4xx, 5xx).
 */
export async function handleApiResponse(
	response: Response,
	responseSchemas: Record<string | number, z.ZodTypeAny>
): Promise<any> {

	if (!response.ok) {
		let errorPayload: ServerErrorPayload | undefined;
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
					} else {
						errorMessage = errorPayload?.error || t('msg.error.unknown');
					}
				} else {
					errorMessage = t('msg.error.malformedResponse');
					console.error("Zod validation failed on error response:", parsedError.error);
				}
			} else {
				errorMessage = json.message || json.error || errorMessage;
			}

		} catch (e) {
			errorMessage = t('msg.error.networkError');
		}

		throw new ClientApiError(errorMessage, response.status, errorPayload?.statusCode, errorPayload);
	}

	if (response.status === 204) {
		return undefined;
	}

	const successSchema = responseSchemas[response.status] || responseSchemas[200];
	if (!successSchema) {
		throw new ClientApiError(`No schema defined for status ${response.status}`, response.status);
	}

	const json = await response.json();
	const result = successSchema.safeParse(json);

	if (!result.success) {
		console.error("Zod validation failed on success response:", result.error.issues);
		throw new ClientApiError("Invalid response data from server.", response.status);
	}

	return result.data;
}
