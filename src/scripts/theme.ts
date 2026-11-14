/**
 * AFTERGLOW Theme Engine (Dark Mode & Light Mode)
 * Zero dependency, instant client-side transitions, localStorage persistence
 */

export type Theme = 'dark' | 'light';

export function getPreferredTheme(): Theme {
  if (typeof window === 'undefined') return 'dark';
  const storedTheme = localStorage.getItem('theme');
  if (storedTheme === 'dark' || storedTheme === 'light') {
    return storedTheme;
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyThemeToRoot(root: HTMLElement, theme: Theme, doc: Document = document): void {
  root.classList.toggle('dark', theme === 'dark');
  root.classList.toggle('light', theme !== 'dark');
  const themeMeta = doc.querySelector('meta[name="theme-color"]');
  if (themeMeta) {
    themeMeta.setAttribute('content', theme === 'dark' ? '#0B090B' : '#FAF7F9');
  }
}

export function setTheme(theme: Theme, options: { suppressTransition?: boolean } = {}): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;

  if (options.suppressTransition) {
    root.classList.add('theme-switching');
  }

  applyThemeToRoot(root, theme, document);
  localStorage.setItem('theme', theme);
  updateThemeToggleButtons(theme);

  if (options.suppressTransition) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => root.classList.remove('theme-switching'));
    });
  }

  // Dispatch custom event for reactive canvas / particle adjustment
  window.dispatchEvent(new CustomEvent('afterglow-theme-changed', { detail: { theme } }));
}

export function toggleTheme(): Theme {
  const current = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  const next: Theme = current === 'dark' ? 'light' : 'dark';
  setTheme(next, { suppressTransition: true });
  return next;
}

export function updateThemeToggleButtons(theme: Theme, root: ParentNode = document): void {
  const toggleButtons = root.querySelectorAll<HTMLElement>('[data-theme-toggle]');
  toggleButtons.forEach((btn) => {
    btn.setAttribute('data-current-theme', theme);
    btn.setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`);
    
    const sunIcon = btn.querySelector('[data-icon="sun"]');
    const moonIcon = btn.querySelector('[data-icon="moon"]');
    const labelText = btn.querySelector('[data-theme-label]');

    if (theme === 'dark') {
      sunIcon?.classList.remove('hidden');
      moonIcon?.classList.add('hidden');
      if (labelText) labelText.textContent = 'LIGHT MODE';
    } else {
      sunIcon?.classList.add('hidden');
      moonIcon?.classList.remove('hidden');
      if (labelText) labelText.textContent = 'DARK MODE';
    }
  });
}

export function initThemeToggle(): void {
  const current = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  updateThemeToggleButtons(current);

  const toggleButtons = document.querySelectorAll<HTMLElement>('[data-theme-toggle]');
  toggleButtons.forEach((btn) => {
    // Avoid attaching multiple times
    if (btn.dataset.initialized === 'true') return;
    btn.dataset.initialized = 'true';
    
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      toggleTheme();
    });
  });
}

// Bind to Astro client-side navigation lifecycle
if (typeof document !== 'undefined') {
  document.addEventListener('astro:before-swap', (ev: any) => {
    const newDoc: Document | undefined = ev?.newDocument;
    if (!newDoc) return;
    const theme = getPreferredTheme();
    applyThemeToRoot(newDoc.documentElement, theme, newDoc);
    updateThemeToggleButtons(theme, newDoc);
  });
  document.addEventListener('astro:page-load', initThemeToggle);
}
