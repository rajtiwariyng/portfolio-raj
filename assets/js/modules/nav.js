/**
 * Sticky nav: compact/blurred state on scroll, scroll-spy, mobile panel.
 * Deliberately GSAP-free so navigation works even if GSAP fails to load.
 */

export function initNav() {
  const nav = document.querySelector('[data-nav]');
  if (!nav) return;

  const toggle = nav.querySelector('[data-nav-toggle]');
  const menu = nav.querySelector('[data-nav-menu]');
  const links = [...nav.querySelectorAll('[data-nav-link]')];

  /* --- compact state ------------------------------------------------------ */
  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      nav.classList.toggle('is-scrolled', window.scrollY > 48);
      spy();
      ticking = false;
    });
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* --- scroll spy ---------------------------------------------------------
     Picks the last section whose top has passed the nav line, which keeps the
     active link stable through long sections and at the end of the page.      */
  const targets = links
    .map((link) => {
      const id = link.getAttribute('href');
      if (!id || !id.startsWith('#')) return null;
      const el = document.querySelector(id);
      return el ? { link, el } : null;
    })
    .filter(Boolean);

  function spy() {
    const line = window.scrollY + window.innerHeight * 0.32;
    let current = null;
    for (const t of targets) {
      if (t.el.offsetTop <= line) current = t;
    }
    // at the very bottom, force the last section active
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 4) {
      current = targets[targets.length - 1] || current;
    }
    for (const t of targets) {
      t.link.classList.toggle('is-active', t === current);
      if (t === current) t.link.setAttribute('aria-current', 'true');
      else t.link.removeAttribute('aria-current');
    }
  }

  /* --- mobile panel ------------------------------------------------------- */
  if (!toggle || !menu) return;

  const setOpen = (open) => {
    document.body.classList.toggle('nav-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    // lock the page behind the panel
    document.body.style.overflow = open ? 'hidden' : '';
  };

  toggle.addEventListener('click', () => {
    setOpen(!document.body.classList.contains('nav-open'));
  });

  menu.addEventListener('click', (e) => {
    if (e.target.closest('a')) setOpen(false);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && document.body.classList.contains('nav-open')) {
      setOpen(false);
      toggle.focus();
    }
  });

  // leaving the mobile breakpoint must not strand the page in a locked state
  window.matchMedia('(min-width: 901px)').addEventListener('change', (e) => {
    if (e.matches) setOpen(false);
  });
}
