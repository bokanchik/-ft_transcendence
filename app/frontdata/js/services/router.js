import { router } from '../main.js';
export function navigateTo(url) {
    window.history.pushState({}, '', url);
    router();
}
