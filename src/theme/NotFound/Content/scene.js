/**
 * "Lost in the field" — the 404 particle scene.
 *
 * A few thousand glowing brand-blue particles spring into a "404" glyph.
 * The cursor repels them (they re-form when it leaves), a click sends a
 * radial pulse through the field, and the camera drifts gently with the
 * pointer for parallax. Loaded via dynamic import so three.js only ever
 * ships on the 404 route.
 */
import * as THREE from 'three';

const PALETTE = ['#58b8ff', '#9adcff', '#e8f8ff', '#3d8fe0'];

function makeSpriteTexture() {
  const size = 64;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.35, 'rgba(255,255,255,0.65)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// Rasterize "404" offscreen and rejection-sample it into normalized points
// (x in ±0.5 of glyph width, y proportional). Font fallback is fine — the
// glyph silhouette matters, not the exact typeface.
function sampleGlyph(count) {
  const W = 640;
  const H = 280;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#fff';
  ctx.font = '800 225px Inter, system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('404', W / 2, H / 2 + 12);
  const data = ctx.getImageData(0, 0, W, H).data;
  const pts = [];
  let guard = count * 500;
  while (pts.length < count && guard-- > 0) {
    const x = (Math.random() * W) | 0;
    const y = (Math.random() * H) | 0;
    if (data[(y * W + x) * 4 + 3] > 128) {
      pts.push([(x - W / 2) / W, -(y - H / 2) / W]);
    }
  }
  return pts;
}

export function createLostScene(canvas, host, {particleCount = 2600, dpr = 2} = {}) {
  const renderer = new THREE.WebGLRenderer({canvas, alpha: true, antialias: false});
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 200);
  const CAM_Z = 26;
  camera.position.set(0, 0, CAM_Z);

  const glyph = sampleGlyph(particleCount);
  const n = glyph.length;

  const positions = new Float32Array(n * 3);
  const colors = new Float32Array(n * 3);
  const targets = new Float32Array(n * 2); // world-space x/y, refreshed on resize
  const vel = new Float32Array(n * 3);
  const phase = new Float32Array(n);
  const color = new THREE.Color();

  for (let i = 0; i < n; i++) {
    // Born scattered in a wide disc — they converge on mount.
    const a = Math.random() * Math.PI * 2;
    const r = 10 + Math.random() * 18;
    positions[i * 3] = Math.cos(a) * r;
    positions[i * 3 + 1] = Math.sin(a) * r;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 6;
    phase[i] = Math.random() * Math.PI * 2;
    color.set(PALETTE[(Math.random() * PALETTE.length) | 0]);
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const texture = makeSpriteTexture();
  const material = new THREE.PointsMaterial({
    size: 0.17,
    map: texture,
    vertexColors: true,
    transparent: true,
    opacity: 0.95,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true,
  });
  scene.add(new THREE.Points(geometry, material));

  // Visible world half-extents at z=0 — everything is laid out from these.
  let halfH = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * CAM_Z;
  let halfW = halfH;

  function layoutTargets() {
    // The glyph spans ~72% of the viewport width, capped so it never
    // towers on narrow-but-tall screens; sits slightly above center to
    // leave the lower third for the message.
    const glyphWidth = Math.min(halfW * 2 * 0.72, 30);
    const yOffset = halfH * 0.14;
    for (let i = 0; i < n; i++) {
      targets[i * 2] = glyph[i][0] * glyphWidth;
      targets[i * 2 + 1] = glyph[i][1] * glyphWidth + yOffset;
    }
  }

  function resize(width, height, pixelRatio) {
    const pr = Math.min(pixelRatio || 1, dpr);
    renderer.setPixelRatio(pr);
    renderer.setSize(width, height, false);
    camera.aspect = width / Math.max(1, height);
    camera.updateProjectionMatrix();
    halfH = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * CAM_Z;
    halfW = halfH * camera.aspect;
    layoutTargets();
  }

  // --- Pointer interaction ---
  const pointer = {x: 0, y: 0, ndcX: 0, ndcY: 0, active: false};
  let pulse = null; // {x, y, age}

  function toWorld(event) {
    const rect = host.getBoundingClientRect();
    const ndcX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const ndcY = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
    return {ndcX, ndcY, x: ndcX * halfW, y: ndcY * halfH};
  }
  function onPointerMove(event) {
    const w = toWorld(event);
    pointer.x = w.x;
    pointer.y = w.y;
    pointer.ndcX = w.ndcX;
    pointer.ndcY = w.ndcY;
    pointer.active = true;
  }
  function onPointerLeave() {
    pointer.active = false;
  }
  function onPointerDown(event) {
    const w = toWorld(event);
    pulse = {x: w.x, y: w.y, age: 0};
  }
  host.addEventListener('pointermove', onPointerMove);
  host.addEventListener('pointerleave', onPointerLeave);
  host.addEventListener('pointerdown', onPointerDown);

  // --- Animation loop ---
  let frameId = null;
  let running = false;
  let last = 0;

  function tick(now) {
    if (!running) return;
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    const t = now / 1000;

    if (pulse) {
      pulse.age += dt;
      if (pulse.age > 1.4) pulse = null;
    }

    // Frame-normalized step: force/damping constants are tuned per 60fps
    // frame, `step` rescales them for the actual frame time.
    const step = Math.min(dt * 60, 2);
    const damping = Math.pow(0.88, step);

    for (let i = 0; i < n; i++) {
      const ix = i * 3;
      const px = positions[ix];
      const py = positions[ix + 1];
      const pz = positions[ix + 2];

      // Spring toward the (gently breathing) glyph target.
      const tx = targets[i * 2] + Math.sin(t * 0.9 + phase[i]) * 0.07;
      const ty = targets[i * 2 + 1] + Math.cos(t * 1.1 + phase[i]) * 0.07;
      vel[ix] += (tx - px) * 0.012 * step;
      vel[ix + 1] += (ty - py) * 0.012 * step;
      vel[ix + 2] += (0 - pz) * 0.004 * step;

      // Cursor repulsion.
      if (pointer.active) {
        const dx = px - pointer.x;
        const dy = py - pointer.y;
        const d2 = dx * dx + dy * dy;
        const R = 3.4;
        if (d2 < R * R && d2 > 0.0001) {
          const d = Math.sqrt(d2);
          const f = ((R - d) / R) * 0.09 * step;
          vel[ix] += (dx / d) * f;
          vel[ix + 1] += (dy / d) * f;
          vel[ix + 2] += (Math.random() - 0.5) * f * 0.6;
        }
      }

      // Click pulse: an expanding ring shockwave.
      if (pulse) {
        const dx = px - pulse.x;
        const dy = py - pulse.y;
        const d = Math.sqrt(dx * dx + dy * dy) || 0.001;
        const ring = pulse.age * 22;
        const band = Math.abs(d - ring);
        if (band < 2.2) {
          const f = (1 - band / 2.2) * (1 - pulse.age / 1.4) * 0.16 * step;
          vel[ix] += (dx / d) * f;
          vel[ix + 1] += (dy / d) * f;
        }
      }

      // Damp + integrate.
      vel[ix] *= damping;
      vel[ix + 1] *= damping;
      vel[ix + 2] *= damping;
      positions[ix] += vel[ix] * step;
      positions[ix + 1] += vel[ix + 1] * step;
      positions[ix + 2] += vel[ix + 2] * step;
    }
    geometry.attributes.position.needsUpdate = true;

    // Pointer parallax on the camera.
    const targetCamX = (pointer.active ? pointer.ndcX : 0) * 1.4;
    const targetCamY = (pointer.active ? pointer.ndcY : 0) * 0.8;
    camera.position.x += (targetCamX - camera.position.x) * 2.2 * dt;
    camera.position.y += (targetCamY - camera.position.y) * 2.2 * dt;
    camera.lookAt(0, halfH * 0.06, 0);

    renderer.render(scene, camera);
    frameId = requestAnimationFrame(tick);
  }

  return {
    resize,
    start() {
      if (running) return;
      running = true;
      last = performance.now();
      frameId = requestAnimationFrame(tick);
    },
    stop() {
      running = false;
      if (frameId !== null) cancelAnimationFrame(frameId);
    },
    dispose() {
      this.stop();
      host.removeEventListener('pointermove', onPointerMove);
      host.removeEventListener('pointerleave', onPointerLeave);
      host.removeEventListener('pointerdown', onPointerDown);
      geometry.dispose();
      material.dispose();
      texture.dispose();
      renderer.dispose();
    },
  };
}
