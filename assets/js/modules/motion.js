/**
 * The site's motion language. One place, one set of easings and durations, so
 * every section feels like part of the same system.
 *
 * Budget: most elements never move. Scroll reveals are a single 18px fade.
 * The four deliberate "wow" moments are the hero entrance, the work rail, the
 * timeline draw, and the process line.
 */
import { gsapReady } from './env.js';

const EASE = 'expo.out';

export function initMotion() {
  if (!gsapReady()) {
    // GSAP missing: drop the hiding class so nothing stays invisible.
    document.documentElement.classList.remove('js-motion');
    document.documentElement.dataset.motionReady = '1';
    return;
  }

  const { gsap, ScrollTrigger } = window;
  gsap.registerPlugin(ScrollTrigger);
  gsap.defaults({ ease: EASE, duration: 0.9 });

  heroEntrance(gsap);
  scrollReveals(gsap);
  railProgress(gsap);
  timelineProgress(gsap);
  processProgress(gsap);
  footerLine(gsap);

  document.documentElement.dataset.motionReady = '1';
  // late-loading images shift layout; recalc once everything settles
  window.addEventListener('load', () => ScrollTrigger.refresh());
}

/* -------------------------------------------------------------------------
   Hero entrance — grid, rule, headline lines, canvas, actions, cue.
   ------------------------------------------------------------------------- */
function heroEntrance(gsap) {
  const hero = document.querySelector('[data-hero]');
  if (!hero) return;

  const tl = gsap.timeline({ defaults: { ease: EASE } });

  tl.from(hero.querySelector('.texture-grid'), { opacity: 0, duration: 0.9 }, 0)
    .fromTo(
      hero.querySelectorAll('[data-hero-status]'),
      { opacity: 0, y: 10 },
      { opacity: 1, y: 0, duration: 0.6 },
      0.25
    )
    .fromTo(
      hero.querySelectorAll('[data-hero-eyebrow]'),
      { opacity: 0, y: 12 },
      { opacity: 1, y: 0, duration: 0.7 },
      0.4
    )
    .to(
      hero.querySelectorAll('[data-reveal-lines] .line__inner'),
      { y: '0%', duration: 1.15, stagger: 0.08 },
      0.5
    )
    .fromTo(
      hero.querySelectorAll('[data-hero-lede]'),
      { opacity: 0, y: 16 },
      { opacity: 1, y: 0, duration: 0.9 },
      0.95
    )
    .to(hero.querySelector('.hero__glow'), { opacity: 1, duration: 1.4 }, 0.8)
    .to(hero.querySelector('[data-scene="hero"]'), { opacity: 1, duration: 1.4 }, 1.0)
    .fromTo(
      hero.querySelectorAll('[data-hero-action]'),
      { opacity: 0, y: 14 },
      { opacity: 1, y: 0, duration: 0.7, stagger: 0.07 },
      1.15
    )
    .fromTo(
      hero.querySelectorAll('[data-hero-rail] a'),
      { opacity: 0, y: 10 },
      { opacity: 1, y: 0, duration: 0.6, stagger: 0.05 },
      1.35
    )
    .fromTo(
      hero.querySelector('.hero__scroll'),
      { opacity: 0 },
      { opacity: 1, duration: 0.8 },
      1.6
    );

  // parallax drift as the hero leaves
  gsap.to(hero.querySelector('.hero__canvas-wrap'), {
    y: 90,
    ease: 'none',
    scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: 0.6 },
  });
}

/* -------------------------------------------------------------------------
   Generic scroll reveal. One motion, used everywhere, so the site reads as
   one system rather than a catalogue of effects.
   ------------------------------------------------------------------------- */
function scrollReveals(gsap) {
  const items = document.querySelectorAll('[data-reveal]');
  items.forEach((el) => {
    const delay = parseFloat(el.dataset.revealDelay || '0');
    gsap.to(el, {
      opacity: 1,
      y: 0,
      duration: 0.85,
      delay,
      scrollTrigger: { trigger: el, start: 'top 88%', once: true },
    });
  });

  // masked line reveals outside the hero
  document.querySelectorAll('[data-reveal-lines]:not([data-hero-title])').forEach((group) => {
    gsap.to(group.querySelectorAll('.line__inner'), {
      y: '0%',
      duration: 1.05,
      stagger: 0.07,
      scrollTrigger: { trigger: group, start: 'top 86%', once: true },
    });
  });

  // large visuals settle from a slight scale as they enter
  document.querySelectorAll('[data-scale-in]').forEach((el) => {
    gsap.fromTo(
      el,
      { scale: 1.06 },
      {
        scale: 1,
        duration: 1.4,
        scrollTrigger: { trigger: el, start: 'top 92%', once: true },
      }
    );
  });
}

/* -------------------------------------------------------------------------
   Orange progress rail in Selected Work.
   ------------------------------------------------------------------------- */
function railProgress(gsap) {
  const fill = document.querySelector('[data-work-rail]');
  const section = document.querySelector('[data-work]');
  if (!fill || !section) return;

  gsap.to(fill, {
    width: '100%',
    ease: 'none',
    scrollTrigger: { trigger: section, start: 'top 60%', end: 'bottom 80%', scrub: 0.4 },
  });
}

/* -------------------------------------------------------------------------
   Timeline: the vertical rule draws, dots light as each role enters.
   ------------------------------------------------------------------------- */
function timelineProgress(gsap) {
  const line = document.querySelector('[data-timeline-progress]');
  const list = document.querySelector('[data-timeline]');
  if (!line || !list) return;

  gsap.to(line, {
    height: '100%',
    ease: 'none',
    scrollTrigger: { trigger: list, start: 'top 62%', end: 'bottom 78%', scrub: 0.4 },
  });

  list.querySelectorAll('[data-timeline-item]').forEach((item) => {
    window.ScrollTrigger.create({
      trigger: item,
      start: 'top 70%',
      once: true,
      onEnter: () => item.classList.add('is-active'),
    });
  });
}

/* -------------------------------------------------------------------------
   Process: horizontal rule fills, steps light in sequence.
   ------------------------------------------------------------------------- */
function processProgress(gsap) {
  const fill = document.querySelector('[data-process-fill]');
  const track = document.querySelector('[data-process]');
  if (!track) return;

  if (fill) {
    gsap.to(fill, {
      width: '100%',
      ease: 'none',
      scrollTrigger: { trigger: track, start: 'top 72%', end: 'bottom 82%', scrub: 0.4 },
    });
  }

  track.querySelectorAll('.process__step').forEach((step, i) => {
    window.ScrollTrigger.create({
      trigger: track,
      start: `top ${70 - i * 2}%`,
      once: true,
      onEnter: () => step.classList.add('is-active'),
    });
  });
}

function footerLine(gsap) {
  const line = document.querySelector('[data-footer-line]');
  if (!line) return;
  gsap.to(line, {
    width: '100%',
    duration: 1.6,
    scrollTrigger: { trigger: line, start: 'top 95%', once: true },
  });
}
