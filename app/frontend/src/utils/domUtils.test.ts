// src/utils/domUtils.test.ts
import { describe, it, expect, vi } from 'vitest';
import { createElement } from './domUtils';

vi.mock('../components/toast.js', () => ({
  showToast: vi.fn(),
}));

describe('createElement', () => {
  // ... vos tests existants ...
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
});