import { translations, type Language, type TranslationKey } from '../i18n/translations';

const STORAGE_KEY = 'afterglow_lang';
const DEFAULT_LANG: Language = 'id';

export function getStoredLanguage(): Language {
  if (typeof window === 'undefined') return DEFAULT_LANG;
  try {
    const stored = localStorage.getItem(STORAGE_KEY) as Language | null;
    if (stored === 'id' || stored === 'en') {
      return stored;
    }
  } catch (e) {
    // Local storage unavailable
  }
  return DEFAULT_LANG;
}

export function applyLanguage(lang: Language, targetDoc: Document = document): void {
  if (typeof document === 'undefined') return;

  targetDoc.documentElement.lang = lang;
  targetDoc.documentElement.setAttribute('data-lang', lang);

  const dict = translations[lang] || translations[DEFAULT_LANG];

  // 1. Text content replacement
  const textElements = targetDoc.querySelectorAll<HTMLElement>('[data-i18n]');
  textElements.forEach((el) => {
    const key = el.getAttribute('data-i18n') as TranslationKey | null;
    if (key && dict[key]) {
      el.textContent = dict[key];
    }
  });

  // 2. HTML content replacement (for tags with line breaks <br /> or special styling)
  const htmlElements = targetDoc.querySelectorAll<HTMLElement>('[data-i18n-html]');
  htmlElements.forEach((el) => {
    const key = el.getAttribute('data-i18n-html') as TranslationKey | null;
    if (key && dict[key]) {
      el.innerHTML = dict[key];
    }
  });

  // 3. Placeholder replacement
  const placeholderElements = targetDoc.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('[data-i18n-placeholder]');
  placeholderElements.forEach((el) => {
    const key = el.getAttribute('data-i18n-placeholder') as TranslationKey | null;
    if (key && dict[key]) {
      el.placeholder = dict[key];
    }
  });

  // 4. Aria label replacement
  const ariaElements = targetDoc.querySelectorAll<HTMLElement>('[data-i18n-aria]');
  ariaElements.forEach((el) => {
    const key = el.getAttribute('data-i18n-aria') as TranslationKey | null;
    if (key && dict[key]) {
      el.setAttribute('aria-label', dict[key]);
    }
  });

  // 5. Update Switcher Buttons UI state
  const langButtons = targetDoc.querySelectorAll<HTMLElement>('[data-lang-btn]');
  langButtons.forEach((btn) => {
    const targetLang = btn.getAttribute('data-lang-btn');
    const isActive = targetLang === lang;
    btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');

    if (isActive) {
      btn.classList.add('bg-electric-magenta', 'text-white', 'shadow-sm');
      btn.classList.remove('text-neutral-500', 'dark:text-muted-gray', 'hover:text-neutral-900', 'dark:hover:text-soft-white');
    } else {
      btn.classList.remove('bg-electric-magenta', 'text-white', 'shadow-sm');
      btn.classList.add('text-neutral-500', 'dark:text-muted-gray', 'hover:text-neutral-900', 'dark:hover:text-soft-white');
    }
  });

  if (targetDoc === document) {
    // Dispatch custom event for custom components (like SVG ticket pass)
    window.dispatchEvent(
      new CustomEvent('afterglow:langchange', {
        detail: { lang, dict },
      })
    );
  }
}

export function setLanguage(lang: Language): void {
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch (e) {
    // Local storage unavailable
  }
  applyLanguage(lang);
}

export function setupI18n(): void {
  const currentLang = getStoredLanguage();
  applyLanguage(currentLang, document);

  // Wire up all click handlers on language buttons (idempotent)
  const switchButtons = document.querySelectorAll<HTMLElement>('[data-lang-btn]');
  switchButtons.forEach((btn) => {
    if (btn.dataset.langBound === '1') return;
    btn.dataset.langBound = '1';
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const targetLang = btn.getAttribute('data-lang-btn') as Language | null;
      if (targetLang && (targetLang === 'id' || targetLang === 'en')) {
        setLanguage(targetLang);
      }
    });
  });
}

// Lifecycle listeners
if (typeof document !== 'undefined') {
  document.addEventListener('astro:before-swap', (ev: any) => {
    const newDoc: Document | undefined = ev?.newDocument;
    if (!newDoc) return;
    applyLanguage(getStoredLanguage(), newDoc);
  });
  document.addEventListener('astro:page-load', setupI18n);
}
