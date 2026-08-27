/**
 * Technology ecosystem — 2D canvas, deliberately not WebGL.
 *
 * A force-directed graph: five category hubs, each technology tethered to its
 * hub and repelled by its neighbours. Hovering a node isolates it and its
 * edges in orange and dims everything else, and writes its detail into the
 * readout panel beside the canvas.
 *
 * The same data is also rendered as plain grouped lists in the markup, which
 * is what mobile, reduced-motion and no-JS visitors see.
 */

const ORANGE = '#ff5a1f';

/* Every entry below is a technology already listed on the site. The `note`
   describes where it is used, drawn from the existing skills copy. */
const GROUPS = [
  {
    id: 'backend',
    label: 'Backend',
    nodes: [
      ['PHP', 'Core language across a decade of production systems.'],
      ['Laravel', 'Primary framework for APIs, ERP/CRM and e-commerce backends.'],
      ['CodeIgniter', 'Legacy platform maintenance and feature work.'],
      ['Node.js', 'Services, tooling and real-time workloads.'],
      ['Python', 'Automation, scripting and data-driven workflows.'],
      ['REST APIs', 'Payment, logistics, messaging and ERP/CRM integration.'],
    ],
  },
  {
    id: 'commerce',
    label: 'E-commerce',
    nodes: [
      ['Magento', 'Extension development and enterprise storefront builds.'],
      ['Shopify', 'Custom storefronts and app/API integration.'],
      ['WordPress', 'CMS builds and custom plugin development.'],
      ['OpenCart', 'Storefront customisation and migration work.'],
    ],
  },
  {
    id: 'frontend',
    label: 'Frontend',
    nodes: [
      ['JavaScript', 'Application logic and browser integrations.'],
      ['Vue.js', 'Interactive interfaces on Laravel-backed products.'],
      ['React', 'Component-driven application interfaces.'],
      ['Tailwind', 'Utility-first styling on modern builds.'],
    ],
  },
  {
    id: 'data',
    label: 'Data',
    nodes: [
      ['MySQL', 'Primary relational store; schema design and query tuning.'],
      ['MongoDB', 'Document storage for flexible and high-volume data.'],
      ['Data Extraction', 'Large-scale processing pipelines for operational data.'],
      ['Web Crawling', 'Automated collection feeding downstream systems.'],
    ],
  },
  {
    id: 'ai',
    label: 'AI & Automation',
    nodes: [
      ['AI APIs', 'AI services integrated into real business workflows.'],
      ['Chatbots', 'Conversational interfaces over existing product data.'],
      ['Queues & Schedulers', 'Background work that runs without anyone touching it.'],
      ['Workflow Automation', 'Removing repetitive manual process from operations.'],
    ],
  },
  {
    id: 'cloud',
    label: 'Cloud & Ops',
    nodes: [
      ['AWS', 'EC2, S3, RDS and SES; provisioning and monitoring.'],
      ['Docker', 'Reproducible environments and deployment.'],
      ['Linux', 'Server setup, hardening and administration.'],
      ['Nginx / Apache', 'Web server configuration, SSL and domain management.'],
      ['Git', 'Version control and branching workflow.'],
      ['CI / CD', 'Automated build, test and deployment pipelines.'],
    ],
  },
];

export function initStackGraph(wrap) {
  const canvas = wrap.querySelector('canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const readoutName = document.querySelector('[data-stack-name]');
  const readoutGroup = document.querySelector('[data-stack-group]');
  const readoutNote = document.querySelector('[data-stack-note]');

  let w = 0;
  let h = 0;
  let dpr = 1;
  let nodes = [];
  let hubs = [];
  let hovered = null;
  let raf = 0;
  let running = false;
  const pointer = { x: -9999, y: -9999 };

  /* --- build ------------------------------------------------------------- */
  function build() {
    hubs = GROUPS.map((g, i) => {
      const angle = (i / GROUPS.length) * Math.PI * 2 - Math.PI / 2;
      return {
        ...g,
        // hubs sit on a ring; radius scales with the smaller canvas dimension
        hx: Math.cos(angle) * 0.33,
        hy: Math.sin(angle) * 0.33,
        x: 0,
        y: 0,
      };
    });

    nodes = [];
    hubs.forEach((hub) => {
      hub.nodes.forEach(([name, note], j) => {
        const spread = (j / hub.nodes.length) * Math.PI * 2;
        nodes.push({
          name,
          note,
          hub,
          // seeded around the hub so the layout settles the same way each load
          ox: hub.hx + Math.cos(spread) * 0.115,
          oy: hub.hy + Math.sin(spread) * 0.115,
          x: 0,
          y: 0,
          vx: 0,
          vy: 0,
          r: 4,
        });
      });
    });
  }

  function resize() {
    const rect = wrap.getBoundingClientRect();
    if (!rect.width) return;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = rect.width;
    h = rect.height;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const scale = Math.min(w, h);
    hubs.forEach((hub) => {
      hub.x = w / 2 + hub.hx * scale;
      hub.y = h / 2 + hub.hy * scale;
    });
    nodes.forEach((n) => {
      n.tx = w / 2 + n.ox * scale;
      n.ty = h / 2 + n.oy * scale;
      if (!n.seeded) {
        n.x = n.tx;
        n.y = n.ty;
        n.seeded = true;
      }
    });
  }

  /* --- simulation --------------------------------------------------------
     Cheap: springs to the target position, pairwise repulsion, heavy damping.
     ~22 nodes means the O(n^2) pass is negligible.                           */
  function step() {
    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];
      a.vx += (a.tx - a.x) * 0.012;
      a.vy += (a.ty - a.y) * 0.012;

      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const d2 = dx * dx + dy * dy || 0.01;
        if (d2 < 4900) {
          const f = 26 / d2;
          const d = Math.sqrt(d2);
          const nx = (dx / d) * f;
          const ny = (dy / d) * f;
          a.vx -= nx;
          a.vy -= ny;
          b.vx += nx;
          b.vy += ny;
        }
      }

      // gentle push away from the pointer, so the graph feels alive
      const pdx = a.x - pointer.x;
      const pdy = a.y - pointer.y;
      const pd2 = pdx * pdx + pdy * pdy;
      if (pd2 < 14000 && pd2 > 0.01) {
        const pd = Math.sqrt(pd2);
        const f = (1 - pd / 118) * 0.9;
        a.vx += (pdx / pd) * f;
        a.vy += (pdy / pd) * f;
      }

      a.vx *= 0.86;
      a.vy *= 0.86;
      a.x += a.vx;
      a.y += a.vy;
    }
  }

  function pick() {
    let best = null;
    let bestD = 26 * 26;
    for (const n of nodes) {
      const dx = n.x - pointer.x;
      const dy = n.y - pointer.y;
      const d = dx * dx + dy * dy;
      if (d < bestD) {
        bestD = d;
        best = n;
      }
    }
    return best;
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);

    const dim = hovered !== null;

    /* edges: node -> hub */
    for (const n of nodes) {
      const active = !dim || n === hovered || n.hub === hovered.hub;
      const isFocus = dim && (n === hovered || n.hub === hovered.hub);
      ctx.beginPath();
      ctx.moveTo(n.x, n.y);
      ctx.lineTo(n.hub.x, n.hub.y);
      ctx.strokeStyle = isFocus
        ? 'rgba(255,90,31,0.55)'
        : active
          ? 'rgba(255,255,255,0.10)'
          : 'rgba(255,255,255,0.03)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    /* hub-to-hub ring, very faint: reads as system topology */
    ctx.beginPath();
    hubs.forEach((hub, i) => (i ? ctx.lineTo(hub.x, hub.y) : ctx.moveTo(hub.x, hub.y)));
    ctx.closePath();
    ctx.strokeStyle = dim ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.06)';
    ctx.stroke();

    /* hubs */
    for (const hub of hubs) {
      const focus = dim && hovered.hub === hub;
      ctx.beginPath();
      ctx.arc(hub.x, hub.y, 3, 0, Math.PI * 2);
      ctx.fillStyle = focus ? ORANGE : 'rgba(255,255,255,0.55)';
      ctx.fill();

      ctx.font = '500 9px "JetBrains Mono", ui-monospace, monospace';
      ctx.fillStyle = focus ? ORANGE : dim ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.45)';
      ctx.textAlign = 'center';
      ctx.fillText(hub.label.toUpperCase(), hub.x, hub.y - 17);
    }

    /* nodes */
    for (const n of nodes) {
      const isHover = n === hovered;
      const inGroup = dim && n.hub === hovered.hub;
      const alpha = !dim ? 1 : isHover ? 1 : inGroup ? 0.7 : 0.22;

      if (isHover) {
        ctx.beginPath();
        ctx.arc(n.x, n.y, 13, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,90,31,0.16)';
        ctx.fill();
      }

      ctx.beginPath();
      ctx.arc(n.x, n.y, isHover ? 5.5 : n.r, 0, Math.PI * 2);
      ctx.fillStyle = isHover ? ORANGE : `rgba(255,255,255,${0.75 * alpha})`;
      ctx.fill();

      ctx.font = '400 11px Inter, ui-sans-serif, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = isHover ? '#fff' : `rgba(255,255,255,${0.62 * alpha})`;
      ctx.fillText(n.name, n.x, n.y + 20);
    }
  }

  function frame() {
    step();
    const next = pick();
    if (next !== hovered) {
      hovered = next;
      writeReadout();
      canvas.style.cursor = hovered ? 'pointer' : '';
    }
    draw();
    raf = requestAnimationFrame(frame);
  }

  function writeReadout() {
    if (!readoutName) return;
    if (hovered) {
      readoutName.textContent = hovered.name;
      if (readoutGroup) readoutGroup.textContent = hovered.hub.label;
      if (readoutNote) readoutNote.textContent = hovered.note;
    } else {
      readoutName.textContent = 'The stack';
      if (readoutGroup) readoutGroup.textContent = `${nodes.length} technologies`;
      if (readoutNote)
        readoutNote.textContent =
          'Hover any node to see where it is used. Grouped by the layer it belongs to.';
    }
  }

  /* --- lifecycle ---------------------------------------------------------- */
  function start() {
    if (running) return;
    running = true;
    raf = requestAnimationFrame(frame);
  }

  function stop() {
    running = false;
    cancelAnimationFrame(raf);
    raf = 0;
  }

  canvas.addEventListener(
    'pointermove',
    (e) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = e.clientX - rect.left;
      pointer.y = e.clientY - rect.top;
    },
    { passive: true }
  );

  canvas.addEventListener('pointerleave', () => {
    pointer.x = -9999;
    pointer.y = -9999;
  });

  build();
  resize();
  writeReadout();

  const ro = new ResizeObserver(resize);
  ro.observe(wrap);

  /* only run while on screen and while the tab is visible */
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => (e.isIntersecting && !document.hidden ? start() : stop()));
    },
    { threshold: 0.05 }
  );
  io.observe(wrap);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
  });
}
