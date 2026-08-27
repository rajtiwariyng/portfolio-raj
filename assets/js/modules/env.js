/** Environment capability checks, shared by every module. */

export function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function isDesktopPointer() {
  return window.matchMedia('(hover: hover) and (pointer: fine) and (min-width: 1024px)').matches;
}

/**
 * Probe for a real WebGL context rather than trusting the constructor to
 * exist: software-blocked and blocklisted GPUs still expose the API.
 * The probe context is released immediately.
 */
export function supportsWebGL() {
  try {
    const canvas = document.createElement('canvas');
    const gl =
      canvas.getContext('webgl2') ||
      canvas.getContext('webgl') ||
      canvas.getContext('experimental-webgl');
    if (!gl) return false;
    const lose = gl.getExtension('WEBGL_lose_context');
    if (lose) lose.loseContext();
    return true;
  } catch {
    return false;
  }
}

/** GSAP is loaded as a classic script; modules read it off window. */
export function gsapReady() {
  return typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
}
