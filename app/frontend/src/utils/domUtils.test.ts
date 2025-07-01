// src/utils/domUtils.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createElement, createActionButton, createInputField, createSelectField, clearElement } from './domUtils';
import { showToast } from '../components/toast'; // Importation directe pour le mock

// Mock des dépendances externes
vi.mock('../components/toast.js', () => ({
  showToast: vi.fn(),
}));

describe('domUtils', () => {
    
  // Nettoyer le DOM après chaque test de composant
  afterEach(() => {
    document.body.innerHTML = '';
  });
  
  describe('createElement', () => {
    it('should create a simple paragraph element', () => {
      const el = createElement('p', { textContent: 'Hello' });
      expect(el.tagName).toBe('P');
      expect(el.textContent).toBe('Hello');
    });

    it('should create an anchor with an href', () => {
      const el = createElement('a', { href: '/dashboard' });
      expect(el instanceof HTMLAnchorElement).toBe(true);
      expect((el as HTMLAnchorElement).pathname).toBe('/dashboard');
    });

    it('should apply a CSS class', () => {
      const el = createElement('div', { className: 'container' });
      expect(el.classList.contains('container')).toBe(true);
    });

    it('should create a label with a htmlFor attribute', () => {
      const el = createElement('label', { htmlFor: 'username' });
      expect(el instanceof HTMLLabelElement).toBe(true);
      expect(el.htmlFor).toBe('username');
    });

    it('should append children correctly', () => {
      const child1 = createElement('span', { textContent: 'Child 1' });
      const child2 = 'Child 2';
      const parent = createElement('div', {}, [child1, child2]);
      expect(parent.children.length).toBe(1);
      expect(parent.textContent).toBe('Child 1Child 2');
    });
  });

  describe('createActionButton', () => {
    it('should create a button with correct text and variant classes', () => {
      const btn = createActionButton({ text: 'Delete', variant: 'danger', onClick: vi.fn() });
      expect(btn.textContent).toBe('Delete');
      expect(btn.classList.contains('bg-red-900')).toBe(true);
    });

    it('should call onClick callback and show loading state', async () => {
      const onClickMock = vi.fn().mockResolvedValue(undefined);
      const btn = createActionButton({ text: 'Submit', variant: 'primary', onClick: onClickMock });
      document.body.appendChild(btn);

      btn.click();
      
      expect(btn.disabled).toBe(true);
      expect(btn.textContent).toBe('...');
      
      // Attendre que la promesse du onClick se rÃ©solve
      await vi.waitFor(() => {
        expect(onClickMock).toHaveBeenCalledTimes(1);
      });
    });

    it('should handle errors in onClick and show a toast', async () => {
        const error = new Error('Action Failed');
        const onClickMock = vi.fn().mockRejectedValue(error);
        const btn = createActionButton({ text: 'Save', dataAction: 'save-data', onClick: onClickMock });
        document.body.appendChild(btn);
  
        btn.click();
        
        await vi.waitFor(() => {
            expect(showToast).toHaveBeenCalledWith('Failed to save-data.', 'error');
        });

        // Le bouton devrait Ãªtre rÃ©activÃ© et son texte restaurÃ©
        expect(btn.disabled).toBe(false);
        expect(btn.textContent).toBe('Save');
      });
  });

  describe('createInputField', () => {
    it('should create a div containing a label and an input', () => {
      const field = createInputField('username', 'Username');
      const label = field.querySelector('label');
      const input = field.querySelector('input');

      expect(field).not.toBeNull();
      expect(label).not.toBeNull();
      expect(input).not.toBeNull();
      expect(label?.textContent).toBe('Username');
      expect(input?.id).toBe('username');
    });

    it('should add a help text paragraph if provided', () => {
        const field = createInputField('email', 'Email', { helpText: 'We need your email.' });
        const helpText = field.querySelector('p');
        expect(helpText).not.toBeNull();
        expect(helpText?.textContent).toBe('We need your email.');
    });
  });

  describe('createSelectField', () => {
    it('should create a select field with options', () => {
        const field = createSelectField('language', 'Language', ['en', 'fr']);
        const select = field.querySelector('select');
        const options = field.querySelectorAll('option');

        expect(select).not.toBeNull();
        expect(options.length).toBe(2);
        expect(options[0].value).toBe('en');
        expect(options[1].textContent).toBe('fr');
    });
  });

  describe('clearElement', () => {
    it('should remove all child nodes from an element', () => {
        const parent = createElement('div', {}, [
            createElement('p'),
            document.createTextNode('text'),
            createElement('span')
        ]);
        expect(parent.childNodes.length).toBe(3);
        clearElement(parent);
        expect(parent.childNodes.length).toBe(0);
    });
  });
});