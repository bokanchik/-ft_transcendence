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

// /**
//  * Gère une réponse API, la parse avec un schéma Zod et lève une erreur en cas d'échec.
//  * @template T - Le schéma Zod à utiliser pour le parsing.
//  * @param {Response} response - L'objet réponse de fetch.
//  * @param {T} schema - Le schéma Zod pour valider et parser les données.
//  * @returns {Promise<z.infer<T>>} Les données parsées et validées.
//  * @throws {ClientApiError} Si la réponse n'est pas OK ou si le parsing échoue.
//  */
// export const handleApiResponse = async <T extends z.ZodTypeAny>(
//   response: Response,
//   schema: T
// ): Promise<z.infer<T>> => {
//   if (!response.ok) {
//     let errorPayload: ServerErrorPayload | undefined;
//     let errorMessage = `Erreur HTTP ${response.status}: ${response.statusText}`;

//     const contentType = response.headers.get('content-type');
//     if (response.body && contentType?.includes('application/json')) {
//       try {
//         const json = await response.json();
//         const parsedError = ServerErrorPayloadSchema.safeParse(json);
//         if (parsedError.success) {
//           errorPayload = parsedError.data;
//           errorMessage = errorPayload.error;
//         } else {
//           errorMessage = `Erreur HTTP ${response.status}: La réponse d'erreur JSON est mal formée.`;
//         }
//       } catch (e) {
//       }
//     }
//     throw new ClientApiError(errorMessage, response.status, errorPayload?.statusCode, errorPayload);
//   }


//   if (response.status === 204) {
//     return undefined as z.infer<T>;
//   }

//   const json = await response.json();
//   const result = schema.safeParse(json); // Parsing de la réponse de SUCCÈS

//   if (!result.success) {
//     console.error("Erreur de validation Zod (réponse succès invalide):", result.error.issues);
    
//     const validationErrorPayload: ServerErrorPayload = {
//       error: "Les données reçues du serveur sont invalides.",
//       statusCode: response.status,
//       details: result.error.issues
//     };

//     throw new ClientApiError(
//       validationErrorPayload.error,
//       response.status,
//       response.status,
//       validationErrorPayload
//     );
//   }

//   return result.data;
// };

/**
 * Gère une réponse de l'API, valide le corps avec le schéma Zod approprié
 * en fonction du code de statut HTTP, et gère les erreurs.
 *
 * @param response L'objet Response de fetch.
 * @param responseSchemas Un objet où les clés sont les codes de statut HTTP et les valeurs sont les schémas Zod.
 * @returns Une promesse qui se résout avec les données validées en cas de succès.
 * @throws Une ClientApiError avec le message du serveur en cas de réponse d'erreur (4xx, 5xx).
 */
export async function handleApiResponse(
  response: Response,
  // La signature attend maintenant un objet de schémas
  responseSchemas: Record<string | number, z.ZodTypeAny> 
): Promise<any> {

  // Cas d'une réponse d'erreur (status 4xx ou 5xx)
  if (!response.ok) {
    let errorPayload: ServerErrorPayload | undefined;
    let errorMessage = `Erreur HTTP ${response.status}: ${response.statusText}`;
  
    try {
      const json = await response.json();
      const errorSchema = responseSchemas[response.status];

      if (errorSchema) {
        // Valider avec le schéma d'erreur fourni (ex: 401, 404)
        const parsedError = errorSchema.safeParse(json);
        if (parsedError.success) {
            // Le payload de l'erreur est valide
            errorPayload = parsedError.data;
            errorMessage = errorPayload?.error || errorMessage;
        } else {
            // Le payload de l'erreur est mal formé par rapport au schéma attendu
            errorMessage = `Erreur HTTP ${response.status}: La réponse d'erreur du serveur est mal formée.`;
            console.error("Zod validation failed on error response:", parsedError.error);
        }
      } else {
         // Aucun schéma d'erreur défini, on essaie de lire le message
         errorMessage = json.message || json.error || errorMessage;
      }

    } catch (e) {
      // Le corps n'était pas du JSON ou une autre erreur s'est produite
    }

    throw new ClientApiError(errorMessage, response.status, errorPayload?.statusCode, errorPayload);
  }

  // Cas d'une réponse de succès (status 2xx)
  if (response.status === 204) { // No Content
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