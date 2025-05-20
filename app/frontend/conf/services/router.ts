import { router } from '../main.js';

export function navigateTo(url: string) {
	window.history.pushState({}, '', url);	// Met à jour l'URL dans la barre d'adresse sans recharger
	router();
}
