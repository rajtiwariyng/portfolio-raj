/**
 * Proof-strip counters.
 *
 * The final value is written in the HTML, so it is correct before this runs
 * and correct if this never runs. With `animate` we merely count up to it.
 */

export function initCounters({ animate }) {
  const els = document.querySelectorAll('[data-count]');
  if (!els.length) return;

  if (!animate || !('IntersectionObserver' in window)) return;

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        io.unobserve(entry.target);
        countUp(entry.target);
      });
    },
    { threshold: 0.4 }
  );

  els.forEach((el) => {
    el.dataset.final = el.textContent.trim();
    el.textContent = '0';
    io.observe(el);
  });
}

function countUp(el) {
  const target = parseInt(el.dataset.final, 10);
  if (!Number.isFinite(target)) {
    el.textContent = el.dataset.final;
    return;
  }

  const duration = 1100;
  const start = performance.now();

  const tick = (now) => {
    const p = Math.min((now - start) / duration, 1);
    // ease-out-expo, matching the CSS motion language
    const eased = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
    el.textContent = String(Math.round(target * eased));
    if (p < 1) requestAnimationFrame(tick);
    else el.textContent = el.dataset.final;
  };

  requestAnimationFrame(tick);
}
