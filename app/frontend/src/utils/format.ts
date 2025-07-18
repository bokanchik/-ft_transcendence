import { t } from '../services/i18nService.js';

export function formatFullDate(date: Date): string {
	const adjustedTimestamp = date.getTime();
	const adjustedDate = new Date(adjustedTimestamp);
	return adjustedDate.toLocaleString();
}

export function formatTimeAgo(date: Date): string {
	const now = new Date();
	const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

	const years = Math.floor(seconds / 31536000);
	if (years > 0) return t(years === 1 ? 'time.ago.year' : 'time.ago.years', { count: years.toString() });

	const months = Math.floor(seconds / 2592000);
	if (months > 0) return t(months === 1 ? 'time.ago.month' : 'time.ago.months', { count: months.toString() });

	const days = Math.floor(seconds / 86400);
	if (days > 0) return t(days === 1 ? 'time.ago.day' : 'time.ago.days', { count: days.toString() });

	const hours = Math.floor(seconds / 3600);
	if (hours > 0) return t(hours === 1 ? 'time.ago.hour' : 'time.ago.hours', { count: hours.toString() });

	const minutes = Math.floor(seconds / 60);
	if (minutes > 0) return t(minutes === 1 ? 'time.ago.minute' : 'time.ago.minutes', { count: minutes.toString() });

	return t('time.ago.now');
}

export function isValidHttpUrl(string: string): boolean {
	try {
		const url = new URL(string);
		return url.protocol === 'http:' || url.protocol === 'https:';
	} catch (_) {
		return false;
	}
}

export function isValidEmail(email: string): boolean {
	const emailRegex = /^(?:[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}|(?:\[(?:(?:[0-9]{1,3}\.){3}[0-9]{1,3}|IPv6:[a-fA-F0-9:.]+)\]))$/;
	return emailRegex.test(email);
}

function nextFrame(): Promise<void> {
	return new Promise(resolve => requestAnimationFrame(() => resolve()));
}

export async function adjustFontSizeToFit(
	element: HTMLElement,
	fontSizes: string[] = ['text-2xl', 'text-xl', 'text-lg', 'text-base', 'text-sm', 'text-xs'],
	truncateClass: string = 'truncate'
) {
	element.classList.add('whitespace-nowrap', 'overflow-hidden');

	await nextFrame();

	for (const sizeClass of fontSizes) {
		fontSizes.forEach(s => element.classList.remove(s));
		element.classList.add(sizeClass);

		await nextFrame();

		if (element.scrollWidth <= element.clientWidth) {
			element.classList.remove(truncateClass);
			return;
		}
	}

	element.classList.add(truncateClass);
}