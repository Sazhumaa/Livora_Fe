/**
 * AFTERGLOW Desktop Smooth Scroll (Lenis)
 * Guardrail: Disabled on touch/mobile devices to preserve native gesture physics
 */
import Lenis from 'lenis';

let lenisInstance: Lenis | null = null;
let rafId: number | null = null;

export function initLenis(): void {
  // Only enable on desktop screens and when reduced motion is not requested
  const isDesktop = window.matchMedia('(min-width: 768px)').matches;
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!isDesktop || prefersReduced) {
    if (lenisInstance) {
      lenisInstance.destroy();
      lenisInstance = null;
    }
    return;
  }

  if (lenisInstance) {
    lenisInstance.destroy();
  }

  lenisInstance = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    syncTouch: false, // Never hijack native mobile touch swipes
  });

  function raf(time: number) {
    lenisInstance?.raf(time);
    rafId = requestAnimationFrame(raf);
  }

  if (rafId) cancelAnimationFrame(rafId);
  rafId = requestAnimationFrame(raf);
}

if (typeof window !== 'undefined') {
  document.addEventListener('astro:page-load', initLenis);
}
