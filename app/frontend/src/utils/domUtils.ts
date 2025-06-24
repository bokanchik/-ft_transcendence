// app/frontend/conf/utils/domUtils.ts
import { showToast } from "../components/toast.js";

export function createElement<K extends keyof HTMLElementTagNameMap>(
	tagName: K,
	options?: {
		id?: string;
		className?: string;
		textContent?: string;
		innerHTML?: string;
		name?: string;
		href?: string;
		src?: string;
		alt?: string;
		type?: string;
		value?: string;
		placeholder?: string;
		readonly?: boolean;
		required?: boolean;
		minLength?: number;
		maxLength?: number;
		min?: string;
		max?: string;
	},
	children?: (HTMLElement | string | null | undefined)[]
): HTMLElementTagNameMap[K] {
	const el = document.createElement(tagName);

	if (options?.id) el.id = options.id;
	if (options?.className) el.className = options.className;
	if (options?.textContent) el.textContent = options.textContent;
	if (options?.innerHTML && !children?.length) el.innerHTML = options.innerHTML;
	if (options?.name) el.setAttribute('name', options.name);

	if (options?.href && el instanceof HTMLAnchorElement) el.href = options.href;
	if (options?.src && el instanceof HTMLImageElement) el.src = options.src;
	if (options?.alt && el instanceof HTMLImageElement) el.alt = options.alt;

	if (options?.type) {
		if (el instanceof HTMLInputElement) {
			el.type = options.type;
		} else if (el instanceof HTMLButtonElement) {
			const validType = options.type as "submit" | "reset" | "button";
			if (["submit", "reset", "button"].includes(validType)) {
				el.type = validType;
			}
		}
	}

	if (options?.value && (el instanceof HTMLInputElement || el instanceof HTMLSelectElement || el instanceof HTMLTextAreaElement)) el.value = options.value;
	if (options?.placeholder && (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement)) el.placeholder = options.placeholder;
	if (options?.readonly && el instanceof HTMLInputElement) el.readOnly = options.readonly;
	if (options?.required && (el instanceof HTMLInputElement || el instanceof HTMLSelectElement || el instanceof HTMLTextAreaElement)) el.required = options.required;
	if (options?.minLength && (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement)) el.minLength = options.minLength;
	if (options?.maxLength && (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement)) el.maxLength = options.maxLength;
	if (options?.min && el instanceof HTMLInputElement) el.min = options.min;
	if (options?.max && el instanceof HTMLInputElement) el.max = options.max;

	if (children) {
		children.forEach(child => {
			if (child === null || child === undefined) return;
			if (typeof child === 'string') {
				el.appendChild(document.createTextNode(child));
			} else {
				el.appendChild(child);
			}
		});
	}
	return el;
}


interface ActionButtonProps {
	text: string;
	baseClass?: string;
	variant?: 'primary' | 'secondary' | 'danger' | 'warning' | 'success' | 'info'; // For predefined styles
	onClick: (event: MouseEvent) => Promise<void> | void;
	icon?: string;
	dataAction?: string;
	dataId?: string | number;
	disabled?: boolean;
}

export function createActionButton(props: ActionButtonProps): HTMLButtonElement {
	const button = createElement('button', {
		textContent: props.text,
		type: 'button'
	});

	let colorClasses = 'bg-gray-500 hover:bg-gray-600';
	if (props.baseClass) {
		colorClasses = props.baseClass;
	} else if (props.variant) {
		switch (props.variant) {
			case 'primary': colorClasses = 'bg-blue-500 hover:bg-blue-600'; break;
			case 'secondary': colorClasses = 'bg-gray-200 hover:bg-gray-300 text-gray-800'; break;
			case 'danger': colorClasses = 'bg-red-500 hover:bg-red-600'; break;
			case 'warning': colorClasses = 'bg-yellow-500 hover:bg-yellow-600 text-black'; break;
			case 'success': colorClasses = 'bg-green-500 hover:bg-green-600'; break;
			case 'info': colorClasses = 'bg-teal-500 hover:bg-teal-600'; break;
		}
	}

	button.className = `${colorClasses} text-white text-xs font-semibold py-1 px-2.5 rounded hover:opacity-80 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed`;
	if (props.disabled) {
		button.disabled = true;
	}

	if (props.dataAction) button.dataset.action = props.dataAction;
	if (props.dataId !== undefined) button.dataset.id = props.dataId.toString();


	button.addEventListener('click', async (e) => {
		e.stopPropagation();
		if (button.disabled) return;

		button.disabled = true;
		const originalText = button.textContent;
		button.textContent = '...';

		try {
			await props.onClick(e);
		} catch (error) {
			const actionText = props.dataAction || originalText || 'action';
			console.error(`Error performing action "${actionText}":`, error);
			showToast(`Failed to ${actionText.toLowerCase()}.`, 'error');
			button.textContent = originalText;
			button.disabled = false;
		}
	});
	return button;
}

interface InputFieldOptions {
	type?: string;
	placeholder?: string;
	required?: boolean;
	value?: string;
	minLength?: number;
	maxLength?: number;
	min?: string; // for type=number
	max?: string; // for type=number
	readonly?: boolean;
	inputClass?: string;
	labelClass?: string;
	wrapperClass?: string;
	pattern?: string;
	helpText?: string;
}
export function createInputField(id: string, labelText: string, options: InputFieldOptions = {}): HTMLDivElement {
	const fieldDiv = createElement('div', {
		className: options.wrapperClass || 'mb-4'
	});

	const label = createElement('label', {
		textContent: labelText,
		className: options.labelClass || 'block text-sm font-medium text-gray-700 mb-1'
	});
	label.htmlFor = id;

	const input = createElement('input', {
		type: options.type || 'text',
		id: id,
		name: id,
		required: options.required,
		value: options.value || '',
		placeholder: options.placeholder,
		minLength: options.minLength,
		maxLength: options.maxLength,
		min: options.min,
		max: options.max,
		readonly: options.readonly,
		className: options.inputClass || 'w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
	});
	if (options.pattern) input.pattern = options.pattern;


	fieldDiv.appendChild(label);
	fieldDiv.appendChild(input);

	if (options.helpText) {
		const helpTextEl = createElement('p', {
			textContent: options.helpText,
			className: 'text-xs text-gray-500 mt-1'
		});
		fieldDiv.appendChild(helpTextEl);
	}

	return fieldDiv;
}
