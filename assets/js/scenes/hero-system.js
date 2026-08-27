/**
 * Hero scene — "System Graph".
 *
 * Three stacked tiers — client, service, data — with traffic descending
 * through them. It is a system architecture diagram given depth, not an
 * abstract shape: the layering is the whole point, so the camera sits slightly
 * above and the only rotation is a slow yaw that lets you read the tiers apart.
 *
 * Deliberately NOT a sphere or a particle cloud. Interaction is a few degrees
 * of cursor parallax so it never competes with the headline over it.
 */

const TIERS = [
  { y: 3.1, count: 13, radius: 3.3 },  // client
  { y: 0.0, count: 17, radius: 4.0 },  // services / API
  { y: -3.1, count: 11, radius: 2.9 }, // data
];

const PULSE_COUNT = 12;

export async function initHeroSystem(wrap) {
  const THREE = await import('../../vendor/three/three.module.min.js');

  const canvas = document.createElement('canvas');
  wrap.appendChild(canvas);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: 'low-power',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
  camera.position.set(0, 2.9, 17);
  camera.lookAt(0, 0, 0);

  const root = new THREE.Group();
  root.rotation.x = 0.34; // looks down onto the tiers so each reads as a plane
  scene.add(root);

  /* --- nodes, laid out tier by tier ---------------------------------------
     Golden-angle placement keeps each tier evenly covered without clumping. */
  const tiers = [];
  const all = [];

  TIERS.forEach((tier) => {
    const list = [];
    for (let i = 0; i < tier.count; i++) {
      const a = i * 2.399963; // golden angle
      const r = tier.radius * Math.sqrt((i + 0.5) / tier.count);
      const v = new THREE.Vector3(
        Math.cos(a) * r,
        tier.y + (Math.random() - 0.5) * 0.28,
        Math.sin(a) * r * 0.92
      );
      list.push(v);
      all.push(v);
    }
    tiers.push(list);
  });

  const nodeGeo = new THREE.BufferGeometry().setFromPoints(all);
  const nodeMat = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.085,
    transparent: true,
    opacity: 0.8,
    sizeAttenuation: true,
    depthWrite: false,
  });
  root.add(new THREE.Points(nodeGeo, nodeMat));

  /* --- intra-tier links: faint, they describe the plane -------------------- */
  const flat = [];
  tiers.forEach((list) => {
    list.forEach((a, i) => {
      // link to the two nearest peers, which traces the tier's shape
      const near = list
        .map((b, j) => ({ b, j, d: a.distanceTo(b) }))
        .filter((o) => o.j !== i)
        .sort((x, y) => x.d - y.d)
        .slice(0, 2);
      near.forEach((o) => flat.push(a, o.b));
    });
  });

  root.add(
    new THREE.LineSegments(
      new THREE.BufferGeometry().setFromPoints(flat),
      new THREE.LineBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.13,
        depthWrite: false,
      })
    )
  );

  /* --- inter-tier links: brighter, this is the request path ---------------- */
  const spans = [];
  const spanPairs = [];

  for (let t = 0; t < tiers.length - 1; t++) {
    tiers[t].forEach((a) => {
      const below = tiers[t + 1];
      // each node feeds the two closest nodes in the tier beneath it
      const near = below
        .map((b) => ({ b, d: Math.hypot(a.x - b.x, a.z - b.z) }))
        .sort((x, y) => x.d - y.d)
        .slice(0, 2);
      near.forEach((o) => {
        spans.push(a, o.b);
        spanPairs.push([a, o.b]);
      });
    });
  }

  root.add(
    new THREE.LineSegments(
      new THREE.BufferGeometry().setFromPoints(spans),
      new THREE.LineBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.075,
        depthWrite: false,
      })
    )
  );

  /* --- tier markers: one orange node per tier, the "entry point" ----------- */
  const marks = tiers.map((list) => list[0]);
  root.add(
    new THREE.Points(
      new THREE.BufferGeometry().setFromPoints(marks),
      new THREE.PointsMaterial({
        color: 0xff5a1f,
        size: 0.2,
        transparent: true,
        opacity: 0.95,
        sizeAttenuation: true,
        depthWrite: false,
      })
    )
  );

  /* --- pulses: traffic descending through the tiers ------------------------
     This is what makes it read as a *running* system rather than a diagram.  */
  const pulses = [];
  for (let i = 0; i < PULSE_COUNT; i++) {
    pulses.push({
      pair: spanPairs[Math.floor(Math.random() * spanPairs.length)],
      t: Math.random(),
      speed: 0.2 + Math.random() * 0.35,
    });
  }

  const pulseArr = new Float32Array(PULSE_COUNT * 3);
  const pulseGeo = new THREE.BufferGeometry();
  pulseGeo.setAttribute('position', new THREE.BufferAttribute(pulseArr, 3));
  root.add(
    new THREE.Points(
      pulseGeo,
      new THREE.PointsMaterial({
        color: 0xff5a1f,
        size: 0.135,
        transparent: true,
        opacity: 1,
        sizeAttenuation: true,
        depthWrite: false,
      })
    )
  );

  /* --- sizing -------------------------------------------------------------- */
  function resize() {
    const rect = wrap.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    renderer.setSize(rect.width, rect.height, false);
    camera.aspect = rect.width / rect.height;
    camera.updateProjectionMatrix();
  }
  resize();

  const ro = new ResizeObserver(resize);
  ro.observe(wrap);

  /* --- interaction --------------------------------------------------------- */
  const target = { x: 0, y: 0 };
  const current = { x: 0, y: 0 };

  const onPointer = (e) => {
    target.x = (e.clientX / window.innerWidth - 0.5) * 2;
    target.y = (e.clientY / window.innerHeight - 0.5) * 2;
  };
  window.addEventListener('pointermove', onPointer, { passive: true });

  /* --- loop ---------------------------------------------------------------- */
  const clock = new THREE.Clock();
  let raf = 0;
  let running = false;

  function frame() {
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.getElapsedTime();

    current.x += (target.x - current.x) * 0.045;
    current.y += (target.y - current.y) * 0.045;

    // slow yaw only: the tiers must stay legible as horizontal planes
    root.rotation.y = t * 0.05 + current.x * 0.09;
    root.rotation.x = 0.34 + current.y * 0.05;

    for (let i = 0; i < pulses.length; i++) {
      const p = pulses[i];
      p.t += dt * p.speed;
      if (p.t >= 1) {
        p.t = 0;
        p.pair = spanPairs[Math.floor(Math.random() * spanPairs.length)];
        p.speed = 0.2 + Math.random() * 0.35;
      }
      const [a, b] = p.pair;
      pulseArr[i * 3] = a.x + (b.x - a.x) * p.t;
      pulseArr[i * 3 + 1] = a.y + (b.y - a.y) * p.t;
      pulseArr[i * 3 + 2] = a.z + (b.z - a.z) * p.t;
    }
    pulseGeo.attributes.position.needsUpdate = true;

    renderer.render(scene, camera);
    raf = requestAnimationFrame(frame);
  }

  function start() {
    if (running) return;
    running = true;
    clock.getDelta();
    raf = requestAnimationFrame(frame);
  }

  function stop() {
    running = false;
    cancelAnimationFrame(raf);
    raf = 0;
  }

  /* pause offscreen and in background tabs — a hero scene must not burn
     battery while the visitor is reading the rest of the page */
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => (e.isIntersecting && !document.hidden ? start() : stop()));
    },
    { threshold: 0.02 }
  );
  io.observe(wrap);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
    else if (wrap.getBoundingClientRect().bottom > 0) start();
  });

  /* the markup ships a static SVG lattice; remove it now the scene is live */
  wrap.querySelector('[data-scene-fallback]')?.remove();
}
