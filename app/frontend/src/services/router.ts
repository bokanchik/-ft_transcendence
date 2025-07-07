import { router } from '../main.js';

export function navigateTo(url: string) {
	window.history.pushState({}, '', url);
	router();
}
