/**
 * AFTERGLOW Stage Embers - Canvas 2D Particle Engine
 * Ambient concert stage lighting particles (< 2.5 KB, 60 FPS)
 */

interface Particle {
  x: number;
  y: number;
  radius: number;
  color: string;
  speedY: number;
  wobbleSpeed: number;
  wobbleAmplitude: number;
  angle: number;
  opacity: number;
  baseOpacity: number;
}

let animationFrameId: number | null = null;
let activeCanvas: HTMLCanvasElement | null = null;
let resizeHandler: (() => void) | null = null;
let visibilityHandler: (() => void) | null = null;

export function initStageEmbers(): void {
  const canvas = document.getElementById('stage-embers-canvas') as HTMLCanvasElement | null;
  if (!canvas) return;

  // Check reduced motion preference
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    canvas.style.display = 'none';
    return;
  }

  // Persisted canvas already running smoothly across ClientRouter navigations
  if (activeCanvas === canvas && animationFrameId !== null) {
    return;
  }

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Cancel any existing loop and clean up stale global listeners
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
  if (resizeHandler) {
    window.removeEventListener('resize', resizeHandler);
    resizeHandler = null;
  }
  if (visibilityHandler) {
    document.removeEventListener('visibilitychange', visibilityHandler);
    visibilityHandler = null;
  }

  activeCanvas = canvas;

  resizeHandler = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };
  resizeHandler();
  window.addEventListener('resize', resizeHandler);

  const colors = [
    'rgba(209, 77, 145, 0.65)',  // Electric Magenta
    'rgba(112, 38, 79, 0.45)',   // Deep Magenta
    'rgba(248, 240, 245, 0.4)',   // Soft White
  ];

  const particleCount = window.innerWidth < 768 ? 20 : 38;
  const particles: Particle[] = [];

  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 2.2 + 0.8,
      color: colors[Math.floor(Math.random() * colors.length)],
      speedY: -(Math.random() * 0.4 + 0.15),
      wobbleSpeed: Math.random() * 0.02 + 0.008,
      wobbleAmplitude: Math.random() * 1.5 + 0.5,
      angle: Math.random() * Math.PI * 2,
      opacity: Math.random() * 0.7 + 0.2,
      baseOpacity: Math.random() * 0.6 + 0.2,
    });
  }

  let isTabVisible = !document.hidden;

  const animate = () => {
    if (!isTabVisible || !document.body.contains(canvas)) {
      animationFrameId = null;
      return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particles.forEach((p) => {
      p.y += p.speedY;
      p.angle += p.wobbleSpeed;
      p.x += Math.sin(p.angle) * 0.4;

      // Wrap around screen
      if (p.y < -10) {
        p.y = canvas.height + 10;
        p.x = Math.random() * canvas.width;
      }
      if (p.x < -10) p.x = canvas.width + 10;
      if (p.x > canvas.width + 10) p.x = -10;

      // Draw particle with gentle glow
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
    });

    animationFrameId = requestAnimationFrame(animate);
  };

  visibilityHandler = () => {
    isTabVisible = !document.hidden;
    if (isTabVisible && animationFrameId === null) {
      animate();
    }
  };
  document.addEventListener('visibilitychange', visibilityHandler);

  animate();
}

if (typeof window !== 'undefined') {
  document.addEventListener('astro:page-load', initStageEmbers);
}
