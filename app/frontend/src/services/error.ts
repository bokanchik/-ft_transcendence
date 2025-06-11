import { z } from 'zod';

export const ServerErrorPayloadSchema = z.object({
  error: z.string(),
  statusCode: z.number(),
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

/**
 * Gère une réponse API, la parse avec un schéma Zod et lève une erreur en cas d'échec.
 * @template T - Le schéma Zod à utiliser pour le parsing.
 * @param {Response} response - L'objet réponse de fetch.
 * @param {T} schema - Le schéma Zod pour valider et parser les données.
 * @returns {Promise<z.infer<T>>} Les données parsées et validées.
 * @throws {ClientApiError} Si la réponse n'est pas OK ou si le parsing échoue.
 */
export const handleApiResponse = async <T extends z.ZodTypeAny>(
  response: Response,
  schema: T
): Promise<z.infer<T>> => {
  if (!response.ok) {
    let errorPayload: ServerErrorPayload | undefined;
    let errorMessage = `Erreur HTTP ${response.status}: ${response.statusText}`;

    const contentType = response.headers.get('content-type');
    if (response.body && contentType?.includes('application/json')) {
      try {
        const json = await response.json();
        const parsedError = ServerErrorPayloadSchema.safeParse(json);
        if (parsedError.success) {
          errorPayload = parsedError.data;
          errorMessage = errorPayload.error;
        } else {
          errorMessage = `Erreur HTTP ${response.status}: La réponse d'erreur JSON est mal formée.`;
        }
      } catch (e) {
      }
    }
    throw new ClientApiError(errorMessage, response.status, errorPayload?.statusCode, errorPayload);
  }


  if (response.status === 204) {
    return undefined as z.infer<T>;
  }

  const json = await response.json();
  const result = schema.safeParse(json); // Parsing de la réponse de SUCCÈS

  if (!result.success) {
    console.error("Erreur de validation Zod (réponse succès invalide):", result.error.issues);
    
    const validationErrorPayload: ServerErrorPayload = {
      error: "Les données reçues du serveur sont invalides.",
      statusCode: response.status,
      details: result.error.issues
    };

    throw new ClientApiError(
      validationErrorPayload.error,
      response.status,
      response.status,
      validationErrorPayload
    );
  }

  return result.data;
};