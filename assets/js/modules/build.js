/**
 * "What I build" rows.
 *
 * On a fine pointer the detail opens on hover, handled entirely in CSS.
 * This module adds the click/keyboard path, which is what touch and keyboard
 * users need, and wires up the ARIA that describes it.
 *
 * The ARIA is applied here rather than in the markup on purpose: without JS
 * the rows are plain hover-revealed content, and advertising a collapsed
 * state that nothing can toggle would be a lie to assistive tech.
 */

export function initBuildRows() {
  const rows = document.querySelectorAll('.build__row');

  rows.forEach((row, i) => {
    const body = row.querySelector('.build__body');
    if (!body) return;

    const id = `build-detail-${i + 1}`;
    body.id = id;
    row.setAttribute('aria-controls', id);
    row.setAttribute('aria-expanded', 'false');

    row.addEventListener('click', () => {
      const open = row.classList.toggle('is-open');
      row.setAttribute('aria-expanded', String(open));

      // one at a time keeps the section scannable
      if (open) {
        rows.forEach((other) => {
          if (other !== row) {
            other.classList.remove('is-open');
            other.setAttribute('aria-expanded', 'false');
          }
        });
      }
    });
  });
}
