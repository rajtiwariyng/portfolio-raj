/**
 * Custom cursor: a small dot that tracks exactly, and a ring that lags behind
 * and changes state over interactive elements.
 *
 * Only ever initialised on desktop fine pointers with motion allowed. The
 * native cursor is restored the moment a touch event is seen, so hybrid
 * laptops do not end up with an invisible pointer.
 */

export function initCursor() {
  const dot = document.querySelector('[data-cursor-dot]');
  const ring = document.querySelector('[data-cursor-ring]');
  const label = document.querySelector('[data-cursor-label]');
  if (!dot || !ring) return;

  document.body.classList.add('has-cursor');

  let x = window.innerWidth / 2;
  let y = window.innerHeight / 2;
  let rx = x;
  let ry = y;
  let raf = 0;

  const onMove = (e) => {
    x = e.clientX;
    y = e.clientY;
    dot.style.transform = `translate(${x}px, ${y}px)`;
    if (!raf) raf = requestAnimationFrame(loop);
  };

  function loop() {
    // lerp gives the ring its weight
    rx += (x - rx) * 0.16;
    ry += (y - ry) * 0.16;
    ring.style.transform = `translate(${rx}px, ${ry}px)`;

    if (Math.abs(x - rx) > 0.1 || Math.abs(y - ry) > 0.1) {
      raf = requestAnimationFrame(loop);
    } else {
      raf = 0;
    }
  }

  window.addEventListener('mousemove', onMove, { passive: true });

  /* --- state over interactive elements ------------------------------------ */
  const VIEW = '[data-cursor="view"]';
  const HOVER = 'a, button, [data-cursor="hover"]';

  document.addEventListener(
    'mouseover',
    (e) => {
      const view = e.target.closest(VIEW);
      if (view) {
        ring.classList.add('is-view');
        ring.classList.remove('is-hover');
        if (label) label.textContent = view.dataset.cursorLabel || 'View Site';
        return;
      }
      if (e.target.closest(HOVER)) {
        ring.classList.add('is-hover');
        ring.classList.remove('is-view');
      }
    },
    { passive: true }
  );

  document.addEventListener(
    'mouseout',
    (e) => {
      if (e.target.closest(VIEW) || e.target.closest(HOVER)) {
        ring.classList.remove('is-hover', 'is-view');
      }
    },
    { passive: true }
  );

  /* hide while the pointer is outside the window */
  document.addEventListener('mouseleave', () => {
    dot.style.opacity = '0';
    ring.style.opacity = '0';
  });
  document.addEventListener('mouseenter', () => {
    dot.style.opacity = '';
    ring.style.opacity = '';
  });

  /* hybrid devices: first touch hands control back to the OS cursor */
  window.addEventListener(
    'touchstart',
    () => {
      document.body.classList.remove('has-cursor');
      dot.remove();
      ring.remove();
      window.removeEventListener('mousemove', onMove);
    },
    { once: true, passive: true }
  );
}
