import { showToast } from "../components/toast.js";
import { t } from "../services/i18nService.js";

export function createElement<K extends keyof HTMLElementTagNameMap>(
	tagName: K,
	options?: {
		id?: string;
		className?: string;
		textContent?: string;
		title?: string;
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
		noValidate?: boolean;
		selected?: boolean;
		htmlFor?: string;
		role?: string;
		referrerpolicy?: string;
	},
	children?: (HTMLElement | string | Node | null | undefined)[]
): HTMLElementTagNameMap[K] {
	const el = document.createElement(tagName);

	if (options?.id) el.id = options.id;
	if (options?.className) el.className = options.className;
	if (options?.textContent) el.textContent = options.textContent;
	if (options?.title) el.title = options.title;
	if (options?.name) el.setAttribute('name', options.name);
	if (options?.role) el.setAttribute('role', options.role);

	if (options?.noValidate && el instanceof HTMLFormElement) el.noValidate = options.noValidate;
	if (options?.selected && el instanceof HTMLOptionElement) el.selected = options.selected;
	if (options?.htmlFor && el instanceof HTMLLabelElement) el.htmlFor = options.htmlFor;

	if (options?.referrerpolicy) el.setAttribute('referrerpolicy', options.referrerpolicy);
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
		const validChildren = children.filter(child => child !== null && child !== undefined) as (HTMLElement | string | Node)[];
		el.append(...validChildren);
	}
	return el;
}


interface ActionButtonProps {
	text: string;
	baseClass?: string;
	variant?: 'primary' | 'secondary' | 'danger' | 'warning' | 'success' | 'info';
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


	if (props.baseClass) {
		button.className = props.baseClass;
	} else {
		let colorClasses = 'bg-gray-500 hover:bg-gray-600 text-white font-beach';
		if (props.variant) {
			switch (props.variant) {
				case 'primary':
					colorClasses = 'bg-blue-700 hover:bg-blue-500 text-white border border-blue-600/50';
					break;
				case 'secondary':
					colorClasses = 'bg-white/10 hover:bg-white/20 text-gray-200 border border-white/20';
					break;
				case 'danger':
					colorClasses = 'bg-red-900 hover:bg-red-700 text-white border border-red-800/50';
					break;
				case 'warning':
					colorClasses = 'bg-yellow-600 hover:bg-yellow-400 text-black border border-yellow-500/50';
					break;
				case 'success':
					colorClasses = 'bg-teal-800 hover:bg-teal-600 text-white border border-teal-700/50';
					break;
				case 'info':
					colorClasses = 'bg-teal-500 hover:bg-teal-600 text-white border border-teal-400/50';
					break;
			}
		}
		button.className = `${colorClasses} text-xs font-beach font-thin py-1 px-2.5 rounded transition-all duration-200`;
	} 
	button.className += ' disabled:opacity-50 disabled:cursor-not-allowed';
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
			showToast(`${t('msg.error.fail')} ${actionText.toLowerCase()}.`, 'error');
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
	min?: string;
	max?: string;
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
		className: options.labelClass || 'block text-sm font-medium text-gray-300 mb-1'
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
		className: options.inputClass || 'w-full p-2 bg-black/20 border border-gray-500/50 text-white placeholder-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400'
	});
	if (options.pattern) input.pattern = options.pattern;


	fieldDiv.appendChild(label);
	fieldDiv.appendChild(input);

	if (options.helpText) {
		const helpTextEl = createElement('p', {
			textContent: options.helpText,
			className: 'text-xs text-gray-400 mt-1'
		});
		fieldDiv.appendChild(helpTextEl);
	}

	return fieldDiv;
}

export function createSelectField(id: string, labelText: string, options: string[]): HTMLDivElement {
	const label = createElement('label', {
		htmlFor: id,
		textContent: labelText,
		className: 'block text-sm font-medium text-gray-300 mb-1'
	});

	const select = createElement('select', {
		id: id,
		name: id,
		required: true,
		className: 'w-full p-2 bg-black/20 border border-gray-500/50 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400'
	}, options.map(value => createElement('option', { value: value, textContent: value })));

	return createElement('div', {}, [label, select]);
}

export function clearElement(element: HTMLElement): void {
	while (element.firstChild) {
		element.removeChild(element.firstChild);
	}
}