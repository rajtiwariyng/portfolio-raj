/**
 * Contact scene — "Field".
 *
 * A slow drifting plane of particles seen at a shallow angle, sitting behind
 * the closing headline. Purely ambient: it carries depth and light, and is not
 * meant to be looked at directly. The orange bloom behind it is CSS.
 */

const COUNT = 900;
const SPREAD = 26;

export async function initContactField(wrap) {
  const THREE = await import('../../vendor/three/three.module.min.js');

  const canvas = document.createElement('canvas');
  wrap.appendChild(canvas);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: false,
    alpha: true,
    powerPreference: 'low-power',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 120);
  camera.position.set(0, 2.4, 15);
  camera.lookAt(0, 0, 0);

  /* --- particles ----------------------------------------------------------
     Two interleaved sets: mostly white, a minority orange, so the accent
     reads as light within the field rather than a separate layer.            */
  const pos = new Float32Array(COUNT * 3);
  const col = new Float32Array(COUNT * 3);
  const phase = new Float32Array(COUNT);

  for (let i = 0; i < COUNT; i++) {
    pos[i * 3] = (Math.random() - 0.5) * SPREAD;
    pos[i * 3 + 1] = (Math.random() - 0.5) * 5.5;
    pos[i * 3 + 2] = (Math.random() - 0.5) * SPREAD;
    phase[i] = Math.random() * Math.PI * 2;

    const orange = Math.random() < 0.17;
    col[i * 3] = orange ? 1.0 : 1.0;
    col[i * 3 + 1] = orange ? 0.35 : 1.0;
    col[i * 3 + 2] = orange ? 0.12 : 1.0;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));

  const mat = new THREE.PointsMaterial({
    size: 0.055,
    vertexColors: true,
    transparent: true,
    opacity: 0.6,
    sizeAttenuation: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const points = new THREE.Points(geo, mat);
  scene.add(points);

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

  const target = { x: 0, y: 0 };
  const current = { x: 0, y: 0 };
  window.addEventListener(
    'pointermove',
    (e) => {
      target.x = (e.clientX / window.innerWidth - 0.5) * 2;
      target.y = (e.clientY / window.innerHeight - 0.5) * 2;
    },
    { passive: true }
  );

  const clock = new THREE.Clock();
  let raf = 0;
  let running = false;

  function frame() {
    const t = clock.getElapsedTime();

    current.x += (target.x - current.x) * 0.03;
    current.y += (target.y - current.y) * 0.03;

    const p = geo.attributes.position.array;
    for (let i = 0; i < COUNT; i++) {
      // gentle vertical swell; x/z stay put so the field never churns
      p[i * 3 + 1] += Math.sin(t * 0.5 + phase[i]) * 0.0016;
    }
    geo.attributes.position.needsUpdate = true;

    points.rotation.y = t * 0.014 + current.x * 0.05;
    camera.position.y = 2.4 + current.y * 0.5;
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
    raf = requestAnimationFrame(frame);
  }

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

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => (e.isIntersecting && !document.hidden ? start() : stop()));
    },
    { threshold: 0.02 }
  );
  io.observe(wrap);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
  });

  /* fade the canvas in once it is actually rendering */
  requestAnimationFrame(() => {
    wrap.style.transition = 'opacity 1.4s cubic-bezier(0.16, 1, 0.3, 1)';
    wrap.style.opacity = '1';
  });
}
