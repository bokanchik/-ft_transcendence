// 1. Définir l'interface pour le payload d'erreur attendu du serveur
interface ServerErrorPayload {
  error: string;
  statusCode: number;
  details?: any;
}

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


export const handleApiResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    let errorPayload: ServerErrorPayload | undefined;
    let errorMessage: string = `Erreur HTTP ${response.status}: ${response.statusText}`; // Message par défaut

    const contentType = response.headers.get('content-type');
    if (response.body && contentType && contentType.includes('application/json')) {
      try {
        errorPayload = await response.json() as ServerErrorPayload;
        if (errorPayload && errorPayload.error) {
          errorMessage = errorPayload.error;
        } else {
          errorMessage = `Erreur HTTP ${response.status}: ${response.statusText}. La réponse d'erreur JSON est mal formée.`;
        }
      } catch (jsonError) {
        console.error("Impossible de parser la réponse d'erreur JSON:", jsonError);
        errorMessage = `Erreur HTTP ${response.status}: ${response.statusText}. La réponse d'erreur n'est pas du JSON valide.`;
      }
    } else if (response.body) {
      try {
        const textError = await response.text();
        if (textError) {
          errorMessage = `Erreur HTTP ${response.status}: ${textError}`;
        }
      } catch (textParseError) {
        console.error("Impossible de lire le corps de l'erreur texte:", textParseError);
      }
    }
    throw new ClientApiError(
      errorMessage,
      response.status,
      errorPayload?.statusCode,
      errorPayload
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  try {
    const data = await response.json();
    return data as T;
  } catch (jsonParseError) {
    console.error(
      `Réponse serveur OK (${response.status}) mais le corps n'est pas du JSON valide:`,
      jsonParseError
    );
    throw new ClientApiError(
      `Réponse serveur inattendue (${response.status}): le corps de la réponse succès n'est pas du JSON valide.`,
      response.status
    );
  }
};