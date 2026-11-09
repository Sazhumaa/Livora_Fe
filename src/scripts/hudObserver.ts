/**
 * AFTERGLOW Floating HUD Collision Observer
 * Automatically shifts floating action elements when approaching the footer
 */
export function initHudObserver(): void {
  const hudElement = document.querySelector('[data-element="floating-hud"]');
  const footerElement = document.querySelector('[data-element="footer"]');

  if (!hudElement || !footerElement) return;

  const observer = new IntersectionObserver(
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

  observer.observe(footerElement);
}

if (typeof window !== 'undefined') {
  document.addEventListener('astro:page-load', initHudObserver);
}
