/**
 * Selected Work: keeps the pinned left-hand panel in sync with whichever
 * project visual is currently centred in the viewport.
 *
 * Uses IntersectionObserver rather than GSAP so the section still works if
 * GSAP is unavailable — the panels simply swap without the rail animating.
 */

export function initWork() {
  const section = document.querySelector('[data-work]');
  if (!section) return;

  const figures = [...section.querySelectorAll('[data-work-figure]')];
  const panels = [...section.querySelectorAll('[data-work-panel]')];
  const counter = section.querySelector('[data-work-current]');
  if (!figures.length || !panels.length) return;

  const setActive = (index) => {
    panels.forEach((p, i) => p.classList.toggle('is-active', i === index));
    if (counter) counter.textContent = String(index + 1).padStart(2, '0');
  };

  setActive(0);

  if (!('IntersectionObserver' in window)) return;

  /* A band across the middle of the viewport: the figure occupying it wins. */
  const io = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible) return;
      const index = figures.indexOf(visible.target);
      if (index >= 0) setActive(index);
    },
    { rootMargin: '-42% 0px -42% 0px', threshold: 0 }
  );

  figures.forEach((f) => io.observe(f));
}
