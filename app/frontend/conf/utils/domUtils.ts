// app/frontend/conf/utils/domUtils.ts
export function createElement<K extends keyof HTMLElementTagNameMap>(
    tagName: K,
    options?: {
        id?: string;
        className?: string;
        textContent?: string;
        innerHTML?: string;
        name?: string; // <--- ADDED 'name'
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
        // Add more common attributes as needed
    },
    children?: (HTMLElement | string | null | undefined)[]
): HTMLElementTagNameMap[K] {
    const el = document.createElement(tagName);

    if (options?.id) el.id = options.id;
    if (options?.className) el.className = options.className;
    if (options?.textContent) el.textContent = options.textContent;
    if (options?.innerHTML && !children?.length) el.innerHTML = options.innerHTML;
    if (options?.name) el.setAttribute('name', options.name); // Use setAttribute for name for broader compatibility

    if (options?.href && el instanceof HTMLAnchorElement) el.href = options.href;
    if (options?.src && el instanceof HTMLImageElement) el.src = options.src;
    if (options?.alt && el instanceof HTMLImageElement) el.alt = options.alt;
    
    // Handle 'type' attribute carefully
    if (options?.type) {
        if (el instanceof HTMLInputElement) {
            el.type = options.type;
        } else if (el instanceof HTMLButtonElement) {
            // Ensure type is one of the valid ones for buttons
            const validType = options.type as "submit" | "reset" | "button";
            if (["submit", "reset", "button"].includes(validType)) {
                el.type = validType;
            }
        }
        // 'type' for HTMLSelectElement is generally not set this way.
        // It's 'select-one' or 'select-multiple' based on the 'multiple' attribute.
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


// Reusable Action Button (similar to what you had in UserList)
interface ActionButtonProps {
    text: string;
    baseClass?: string; // e.g., 'bg-blue-500'
    variant?: 'primary' | 'secondary' | 'danger' | 'warning' | 'success' | 'info'; // For predefined styles
    onClick: (event: MouseEvent) => Promise<void> | void;
    icon?: string; // Optional icon HTML or class
    dataAction?: string;
    dataId?: string | number;
    disabled?: boolean;
}

export function createActionButton(props: ActionButtonProps): HTMLButtonElement {
    const button = createElement('button', {
        textContent: props.text, // Initial text
        type: 'button'
    });

    let colorClasses = 'bg-gray-500 hover:bg-gray-600'; // Default
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
        if (button.disabled) return; // Prevent action if already disabled

        button.disabled = true;
        const originalText = button.textContent;
        button.textContent = '...'; // Loading indicator

        try {
            await props.onClick(e);
        } catch (error) {
            const actionText = props.dataAction || originalText || 'action';
            console.error(`Error performing action "${actionText}":`, error);
            // showToast is good, or a more generic error display
            alert(`Failed to ${actionText.toLowerCase()}.`); // Fallback alert
            button.textContent = originalText; // Restore text on error
            button.disabled = false; // Re-enable on error
        }
        // Note: Re-enabling the button and restoring text on success should be handled
        // by the parent component logic (e.g., after a list re-renders or state updates)
        // unless the action is purely local and doesn't trigger a re-render.
        // For now, let's assume parent handles UI update post-success. If not, uncomment below:
        // if (button.disabled) { // If not re-enabled by parent logic
        //     button.textContent = originalText;
        //     button.disabled = false;
        // }
    });
    return button;
}


// Helper for input fields (from aliasFormPage)
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
        name: id, // Good practice to have name attribute
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

// Helper for select fields (from aliasFormPage)
export function createSelectField(id: string, labelText: string, optionValues: (string | {value: string, text: string})[], options: InputFieldOptions = {}): HTMLDivElement {
    const fieldDiv = createElement('div', {
        className: options.wrapperClass || 'mb-4'
    });

    const label = createElement('label', {
        textContent: labelText,
        className: options.labelClass || 'block text-sm font-medium text-gray-700 mb-1'
    });
    label.htmlFor = id;

    const select = createElement('select', {
        id: id,
        name: id,
        required: options.required,
        className: options.inputClass || 'w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
    });

    optionValues.forEach(opt => {
        const optionEl = document.createElement('option');
        if (typeof opt === 'string') {
            optionEl.value = opt;
            optionEl.textContent = opt;
        } else {
            optionEl.value = opt.value;
            optionEl.textContent = opt.text;
        }
        if (options.value === optionEl.value) {
            optionEl.selected = true;
        }
        select.appendChild(optionEl);
    });

    fieldDiv.appendChild(label);
    fieldDiv.appendChild(select);
     if (options.helpText) {
        const helpTextEl = createElement('p', {
            textContent: options.helpText,
            className: 'text-xs text-gray-500 mt-1'
        });
        fieldDiv.appendChild(helpTextEl);
    }
    return fieldDiv;
}