/**
 * AFTERGLOW Floating HUD Collision Observer
 * Automatically shifts floating action elements when approaching the footer
 */
let activeHudObserver: IntersectionObserver | null = null;

export function disconnectHudObserver(): void {
  if (activeHudObserver) {
    activeHudObserver.disconnect();
    activeHudObserver = null;
  }
}

export function initHudObserver(): void {
  disconnectHudObserver();

  const hudElement = document.querySelector('[data-element="floating-hud"]');
  const footerElement = document.querySelector('[data-element="footer"]');

  if (!hudElement) return;
  hudElement.classList.remove('is-intersecting-footer');
  if (!footerElement) return;

  activeHudObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          hudElement.classList.add('is-intersecting-footer');
        } else {
          hudElement.classList.remove('is-intersecting-footer');
        }
      });
    },
    {
      root: null,
      rootMargin: '0px 0px 40px 0px',
      threshold: 0.05,
    }
  );

  activeHudObserver.observe(footerElement);
}

if (typeof window !== 'undefined') {
  document.addEventListener('astro:before-swap', disconnectHudObserver);
  document.addEventListener('astro:page-load', initHudObserver);
}
