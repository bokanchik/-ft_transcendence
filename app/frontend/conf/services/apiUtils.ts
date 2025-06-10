//@ts-ignore
import { ApiErrorResponse } from "../utils/types.js";

/**
 * Handles an API response, parsing JSON and throwing errors if the response is not OK.
 * @template T The expected response type.
 * @param {Response} response - The fetch API response object.
 * @returns {Promise<T>} The parsed response data.
 * @throws {Error} If the response is not OK or cannot be parsed.
 */
export const handleApiResponse = async <T>(response: Response): Promise<T> => {
	if (!response.ok) {
		let errorData: ApiErrorResponse = { error: `Server error (${response.status})` };
		try {
			errorData = await response.json();
		} catch (jsonError) {
			console.error("Unable to parse error JSON response:", jsonError);
		}
		throw new Error(errorData.error || `HTTP Error ${response.status}: ${response.statusText}`);
	}
	if (response.status === 204) {
		return undefined as T;
	}
	return response.json() as Promise<T>;
};

export function isValidHttpUrl(urlString: string | undefined | null): boolean {
	if (typeof urlString !== 'string' || !urlString) return false;
	try {
		const url = new URL(urlString);
		return url.protocol === "http:" || url.protocol === "https:";
	} catch (_) {
		return false;
	}
}

export function isValidEmailFormat(emailString: string | undefined | null): boolean {
	if (typeof emailString !== 'string' || !emailString) return false;
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailString);
}
