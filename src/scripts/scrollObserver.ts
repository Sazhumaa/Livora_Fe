/**
 * AFTERGLOW Lightweight Scroll Reveal Observer
 * Uses native IntersectionObserver (zero external dependencies)
 */
export function initScrollObserver(): void {
  const elements = document.querySelectorAll('[data-animate="reveal"]');
  if (!elements.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          // Unobserve once animated to keep CPU load zero
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.1,
      rootMargin: '0px 0px -8% 0px',
    }
  );

  elements.forEach((el) => observer.observe(el));
}

// Re-initialize on Astro ClientRouter page navigation
if (typeof window !== 'undefined') {
  document.addEventListener('astro:page-load', initScrollObserver);
}
