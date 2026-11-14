/**
 * AFTERGLOW Lightweight Scroll Reveal Observer
 * Uses native IntersectionObserver (zero external dependencies)
 */
let activeRevealObserver: IntersectionObserver | null = null;

export function disconnectScrollObserver(): void {
  if (activeRevealObserver) {
    activeRevealObserver.disconnect();
    activeRevealObserver = null;
  }
}

export function revealInViewportNow(): void {
  const elements = document.querySelectorAll<HTMLElement>('[data-animate="reveal"]:not(.is-visible)');
  const thresholdY = window.innerHeight * 0.98;
  elements.forEach((el) => {
    const rect = el.getBoundingClientRect();
    if (rect.top < thresholdY) {
      el.classList.add('is-visible');
    }
  });
}

export function initScrollObserver(): void {
  disconnectScrollObserver();

  const elements = document.querySelectorAll<HTMLElement>('[data-animate="reveal"]');
  if (!elements.length) return;

  // Reveal elements already above or inside the viewport synchronously to prevent pop-in flicker
  revealInViewportNow();

  const remaining = document.querySelectorAll<HTMLElement>('[data-animate="reveal"]:not(.is-visible)');
  if (!remaining.length) return;

  activeRevealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          // Unobserve once animated to keep CPU load zero
          activeRevealObserver?.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.08,
      rootMargin: '0px 0px -6% 0px',
    }
  );

  remaining.forEach((el) => activeRevealObserver?.observe(el));
}

// Re-initialize on Astro ClientRouter page navigation
if (typeof window !== 'undefined') {
  document.addEventListener('astro:before-swap', disconnectScrollObserver);
  document.addEventListener('astro:after-swap', revealInViewportNow);
  document.addEventListener('astro:page-load', initScrollObserver);
}
