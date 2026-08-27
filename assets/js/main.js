/**
 * Entry point.
 *
 * Everything below is progressive enhancement: the page is complete and
 * readable with this file blocked. Modules are imported only when the
 * environment can actually use them.
 */
import { initNav } from './modules/nav.js';
import { initMotion } from './modules/motion.js';
import { initCounters } from './modules/counters.js';
import { initWork } from './modules/work.js';
import { initBuildRows } from './modules/build.js';
import { prefersReducedMotion, isDesktopPointer, supportsWebGL } from './modules/env.js';

const reduced = prefersReducedMotion();

/* Nav and work panels are structural, not decorative: always on. */
initNav();
initWork();
initBuildRows();

if (reduced) {
  // Counters render their final value; nothing animates.
  initCounters({ animate: false });
  document.documentElement.dataset.motionReady = '1';
  document.documentElement.classList.remove('js-motion');
} else {
  initMotion();
  initCounters({ animate: true });
}

/* --- custom cursor: desktop fine pointers only ---------------------------- */
if (!reduced && isDesktopPointer()) {
  import('./modules/cursor.js')
    .then((m) => m.initCursor())
    .catch(() => {});
}

/* --- stack graph: canvas 2D, wide viewports only -------------------------- */
if (!reduced && window.matchMedia('(min-width: 1001px)').matches) {
  const stackEl = document.querySelector('[data-stack-canvas]');
  if (stackEl) {
    whenVisible(stackEl, () => {
      import('./modules/stack-graph.js')
        .then((m) => m.initStackGraph(stackEl))
        .catch(() => {});
    });
  }
}

/* --- WebGL scenes ---------------------------------------------------------
   Gated on: reduced-motion, viewport width, and an actual WebGL context.
   When any gate fails no context is ever created and the CSS/SVG fallback
   already in the markup is what the visitor sees.                            */
const wideEnough = window.matchMedia('(min-width: 901px)').matches;

if (!reduced && wideEnough && supportsWebGL()) {
  const heroEl = document.querySelector('[data-scene="hero"]');
  if (heroEl) {
    import('./scenes/hero-system.js')
      .then((m) => m.initHeroSystem(heroEl))
      .catch(() => {});
  }

  const contactEl = document.querySelector('[data-scene="contact"]');
  if (contactEl) {
    whenVisible(
      contactEl,
      () => {
        import('./scenes/contact-field.js')
          .then((m) => m.initContactField(contactEl))
          .catch(() => {});
      },
      '300px'
    );
  }
}

/**
 * Run `fn` once, the first time `el` comes near the viewport.
 */
function whenVisible(el, fn, rootMargin = '150px') {
  if (!('IntersectionObserver' in window)) {
    fn();
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        io.disconnect();
        fn();
      }
    },
    { rootMargin }
  );
  io.observe(el);
}
