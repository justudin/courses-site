/**
 * Imperative three.js scene for the /networks collaboration globe. Loaded
 * exclusively through the dynamic import() in ./index.js so three.js and this
 * module live in their own async chunk that only loads on that page.
 *
 * The picture: a dark dot-matrix globe, an amber "home thread" beacon on
 * Seoul, and one glowing great-circle arc per collaborating country with a
 * light pulse traveling outward. All arcs share one geometry/draw call.
 *
 * Interaction model (driven by ./index.js):
 *  - drag rotates (with inertia), pinch/zoomBy zooms (clamped)
 *  - auto-rotation pauses on any interaction, resumes after 4s idle, and
 *    stays paused while a country is selected
 *  - setSelected()/setHovered() highlight one country and dim other arcs
 *  - focusCountry() tweens the globe so that country faces the camera
 *  - pick() raycasts with a generous, pixel-based threshold so taps land
 *    (≥ ~48px effective target regardless of visual node size)
 *  - reducedMotion: no auto-rotation, frozen pulses, renders on demand
 *    (single frames) instead of a continuous loop
 */
import landDots from '@site/src/data/landdots.json';
import {
  AdditiveBlending,
  BackSide,
  BufferAttribute,
  BufferGeometry,
  Color,
  Group,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  Points,
  QuadraticBezierCurve3,
  Raycaster,
  RingGeometry,
  Scene,
  ShaderMaterial,
  SphereGeometry,
  Timer,
  Vector2,
  Vector3,
  WebGLRenderer,
} from 'three';

const GLOBE_RADIUS = 1;
const BRAND_BLUE = '#2f82de';
const BRAND_CYAN = '#7fd8ff';
const HOME_AMBER = '#ffb648';
const ARC_SEGMENTS = 48;
const IDLE_RESUME_MS = 4000;

function latLngToVec3(lat, lng, radius) {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((lng + 180) * Math.PI) / 180;
  return new Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

function easeInOutCubic(x) {
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

// Latitude/longitude wireframe so the sphere reads as a globe without any
// texture assets.
function buildGraticule(radius, latStep = 15, lngStep = 15, segments = 72) {
  const positions = [];
  const push = (a, b) => positions.push(a.x, a.y, a.z, b.x, b.y, b.z);
  for (let lat = -75; lat <= 75; lat += latStep) {
    for (let i = 0; i < segments; i += 1) {
      const lng0 = (i / segments) * 360 - 180;
      const lng1 = ((i + 1) / segments) * 360 - 180;
      push(latLngToVec3(lat, lng0, radius), latLngToVec3(lat, lng1, radius));
    }
  }
  for (let lng = -180; lng < 180; lng += lngStep) {
    for (let i = 0; i < segments; i += 1) {
      const lat0 = (i / segments) * 180 - 90;
      const lat1 = ((i + 1) / segments) * 180 - 90;
      push(latLngToVec3(lat0, lng, radius), latLngToVec3(lat1, lng, radius));
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(new Float32Array(positions), 3));
  return geometry;
}

const ARC_VERTEX = /* glsl */ `
  attribute float aT;
  attribute float aPhase;
  attribute float aSpeed;
  attribute float aWeight;
  attribute float aIndex;
  uniform float uSelected;
  uniform float uHovered;
  varying float vT;
  varying float vPhase;
  varying float vSpeed;
  varying float vWeight;
  varying float vFocus;
  void main() {
    vT = aT;
    vPhase = aPhase;
    vSpeed = aSpeed;
    vWeight = aWeight;
    // When any country is highlighted, its arc brightens and the rest
    // recede. ("active" is a reserved word in GLSL — don't rename back.)
    float anyActive = max(uSelected, uHovered);
    float mine = max(
      step(abs(aIndex - uSelected), 0.5),
      step(abs(aIndex - uHovered), 0.5));
    vFocus = anyActive < -0.5 ? 1.0 : mix(0.18, 1.55, mine);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const ARC_FRAGMENT = /* glsl */ `
  uniform float uTime;
  uniform float uPulseOn;
  uniform vec3 uColorNear;
  uniform vec3 uColorFar;
  uniform vec3 uColorHome;
  varying float vT;
  varying float vPhase;
  varying float vSpeed;
  varying float vWeight;
  varying float vFocus;
  void main() {
    // Faint constant arc + a bright pulse traveling from home (t=0) outward.
    float pulsePos = fract(uTime * vSpeed + vPhase);
    float d = vT - pulsePos;
    float comet = (smoothstep(0.18, 0.0, abs(d)) * step(0.0, d)
      + smoothstep(0.035, 0.0, abs(d))) * uPulseOn;
    // Heavier partnerships draw brighter, thicker-reading threads.
    float alpha = (0.09 + 0.24 * vWeight + comet * (0.5 + 0.45 * vWeight)) * vFocus;
    vec3 color = mix(uColorNear, uColorFar, vT);
    // Amber home thread: every arc leaves Seoul warm, cools as it travels.
    color = mix(uColorHome, color, smoothstep(0.0, 0.22, vT));
    color = mix(color, vec3(1.0), comet * 0.35);
    gl_FragColor = vec4(color, alpha);
  }
`;

const MARKER_VERTEX = /* glsl */ `
  attribute float aSize;
  attribute float aPhase;
  attribute float aIndex;
  uniform float uTime;
  uniform float uPulseOn;
  uniform float uSelected;
  uniform float uHovered;
  varying float vTwinkle;
  varying float vActive;
  void main() {
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vTwinkle = 0.75 + 0.25 * sin(uTime * 1.4 + aPhase) * uPulseOn;
    float anyActive = max(uSelected, uHovered);
    float mine = max(
      step(abs(aIndex - uSelected), 0.5),
      step(abs(aIndex - uHovered), 0.5));
    vActive = anyActive < -0.5 ? 0.0 : mine;
    float dimmed = anyActive < -0.5 ? 1.0 : mix(0.6, 1.6, mine);
    gl_PointSize = aSize * dimmed * (140.0 / max(-mvPosition.z, 0.001));
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const MARKER_FRAGMENT = /* glsl */ `
  uniform vec3 uColor;
  varying float vTwinkle;
  varying float vActive;
  void main() {
    vec2 c = gl_PointCoord - vec2(0.5);
    float d = length(c);
    float core = smoothstep(0.22, 0.05, d);
    float halo = smoothstep(0.5, 0.0, d) * 0.55;
    float alpha = (core + halo) * vTwinkle;
    vec3 color = mix(uColor, vec3(1.0), core * (0.55 + vActive * 0.4));
    gl_FragColor = vec4(color, alpha);
  }
`;

const LAND_VERTEX = /* glsl */ `
  void main() {
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = 0.045 * (140.0 / max(-mvPosition.z, 0.001));
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const LAND_FRAGMENT = /* glsl */ `
  uniform vec3 uColor;
  void main() {
    vec2 c = gl_PointCoord - vec2(0.5);
    float mask = smoothstep(0.5, 0.28, length(c));
    gl_FragColor = vec4(uColor, mask * 0.85);
  }
`;

const ATMOSPHERE_VERTEX = /* glsl */ `
  varying vec3 vNormal;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const ATMOSPHERE_FRAGMENT = /* glsl */ `
  uniform vec3 uColor;
  varying vec3 vNormal;
  void main() {
    float rim = pow(0.72 - dot(vNormal, vec3(0.0, 0.0, -1.0)), 3.5);
    gl_FragColor = vec4(uColor, rim * 0.9);
  }
`;

export function createGlobeScene(canvas, {
  home,
  countries,
  dpr,
  reducedMotion = false,
  lowTier = false,
  onHover,
  labelEls = null,
}) {
  const renderer = new WebGLRenderer({
    canvas,
    antialias: !lowTier,
    alpha: true,
    powerPreference: 'high-performance',
  });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(dpr ?? Math.min(window.devicePixelRatio || 1, 2));

  const scene = new Scene();
  const camera = new PerspectiveCamera(38, 1, 0.1, 100);
  camera.position.set(0, 0.55, 3.05);
  camera.lookAt(0, 0, 0);

  const globe = new Group();
  scene.add(globe);

  // Opaque inner sphere: occludes graticule/arcs/markers on the far side.
  const sphereGeometry = new SphereGeometry(GLOBE_RADIUS * 0.992, lowTier ? 40 : 64, lowTier ? 28 : 48);
  const sphereMaterial = new MeshBasicMaterial({ color: new Color('#071528') });
  const sphere = new Mesh(sphereGeometry, sphereMaterial);
  globe.add(sphere);

  const graticuleGeometry = buildGraticule(GLOBE_RADIUS * 0.998, 15, 15, lowTier ? 48 : 72);
  const graticuleMaterial = new LineBasicMaterial({
    color: new Color('#1c4d86'),
    transparent: true,
    opacity: 0.16,
  });
  const graticule = new LineSegments(graticuleGeometry, graticuleMaterial);
  globe.add(graticule);

  // Dot-matrix landmass, sampled offline from NASA's public-domain
  // equirectangular Blue Marble map (see scripts/generate-land-dots.js).
  // landdots.json is a flat [lat, lng, lat, lng, ...] array. Low-tier
  // devices take every other dot.
  const landStride = lowTier ? 2 : 1;
  const landCount = Math.floor(landDots.length / 2 / landStride);
  const landPositions = new Float32Array(landCount * 3);
  for (let i = 0; i < landCount; i += 1) {
    const s = i * landStride;
    const p = latLngToVec3(landDots[s * 2], landDots[s * 2 + 1], GLOBE_RADIUS);
    landPositions.set([p.x, p.y, p.z], i * 3);
  }
  const landGeometry = new BufferGeometry();
  landGeometry.setAttribute('position', new BufferAttribute(landPositions, 3));
  const landMaterial = new ShaderMaterial({
    vertexShader: LAND_VERTEX,
    fragmentShader: LAND_FRAGMENT,
    uniforms: { uColor: { value: new Color('#5598dd') } },
    transparent: true,
    depthWrite: false,
  });
  const land = new Points(landGeometry, landMaterial);
  globe.add(land);

  const atmosphereGeometry = new SphereGeometry(GLOBE_RADIUS * 1.12, 48, 32);
  const atmosphereMaterial = new ShaderMaterial({
    vertexShader: ATMOSPHERE_VERTEX,
    fragmentShader: ATMOSPHERE_FRAGMENT,
    uniforms: { uColor: { value: new Color(BRAND_BLUE) } },
    transparent: true,
    blending: AdditiveBlending,
    side: BackSide,
    depthWrite: false,
  });
  const atmosphere = new Mesh(atmosphereGeometry, atmosphereMaterial);
  scene.add(atmosphere);

  // ---- Arcs: one merged line-segment geometry for every country ----
  const homePos = latLngToVec3(home.lat, home.lng, GLOBE_RADIUS);
  const maxWorks = Math.max(...countries.map((c) => c.works), 1);

  const arcPositions = [];
  const arcT = [];
  const arcPhase = [];
  const arcSpeed = [];
  const arcWeight = [];
  const arcIndex = [];
  countries.forEach((country, index) => {
    const end = latLngToVec3(country.lat, country.lng, GLOBE_RADIUS);
    const angle = homePos.angleTo(end);
    const lift = 1 + 0.18 + angle * 0.24;
    const mid = homePos.clone().add(end).normalize().multiplyScalar(GLOBE_RADIUS * lift);
    const curve = new QuadraticBezierCurve3(homePos, mid, end);
    const pts = curve.getPoints(ARC_SEGMENTS);
    const phase = (index / countries.length) * 0.83;
    const weight = Math.sqrt(country.works / maxWorks);
    const speed = 0.16 + Math.min(country.works / maxWorks, 1) * 0.1;
    for (let i = 0; i < ARC_SEGMENTS; i += 1) {
      const a = pts[i];
      const b = pts[i + 1];
      arcPositions.push(a.x, a.y, a.z, b.x, b.y, b.z);
      arcT.push(i / ARC_SEGMENTS, (i + 1) / ARC_SEGMENTS);
      arcPhase.push(phase, phase);
      arcSpeed.push(speed, speed);
      arcWeight.push(weight, weight);
      arcIndex.push(index, index);
    }
  });

  const arcGeometry = new BufferGeometry();
  arcGeometry.setAttribute('position', new BufferAttribute(new Float32Array(arcPositions), 3));
  arcGeometry.setAttribute('aT', new BufferAttribute(new Float32Array(arcT), 1));
  arcGeometry.setAttribute('aPhase', new BufferAttribute(new Float32Array(arcPhase), 1));
  arcGeometry.setAttribute('aSpeed', new BufferAttribute(new Float32Array(arcSpeed), 1));
  arcGeometry.setAttribute('aWeight', new BufferAttribute(new Float32Array(arcWeight), 1));
  arcGeometry.setAttribute('aIndex', new BufferAttribute(new Float32Array(arcIndex), 1));
  const arcMaterial = new ShaderMaterial({
    vertexShader: ARC_VERTEX,
    fragmentShader: ARC_FRAGMENT,
    uniforms: {
      uTime: { value: 0 },
      uPulseOn: { value: reducedMotion ? 0 : 1 },
      uSelected: { value: -1 },
      uHovered: { value: -1 },
      uColorNear: { value: new Color(BRAND_CYAN) },
      uColorFar: { value: new Color(BRAND_BLUE) },
      uColorHome: { value: new Color(HOME_AMBER) },
    },
    transparent: true,
    blending: AdditiveBlending,
    depthWrite: false,
  });
  const arcs = new LineSegments(arcGeometry, arcMaterial);
  globe.add(arcs);

  // ---- Country markers (sqrt-scaled by works) ----
  const markerLocal = [];
  const markerPositions = new Float32Array(countries.length * 3);
  const markerSizes = new Float32Array(countries.length);
  const markerPhases = new Float32Array(countries.length);
  const markerIndices = new Float32Array(countries.length);
  countries.forEach((country, i) => {
    const p = latLngToVec3(country.lat, country.lng, GLOBE_RADIUS * 1.005);
    markerLocal.push(p);
    markerPositions.set([p.x, p.y, p.z], i * 3);
    markerSizes[i] = 0.055 + Math.sqrt(country.works / maxWorks) * 0.095;
    markerPhases[i] = (i * 2.399) % (Math.PI * 2);
    markerIndices[i] = i;
  });
  const markerGeometry = new BufferGeometry();
  markerGeometry.setAttribute('position', new BufferAttribute(markerPositions, 3));
  markerGeometry.setAttribute('aSize', new BufferAttribute(markerSizes, 1));
  markerGeometry.setAttribute('aPhase', new BufferAttribute(markerPhases, 1));
  markerGeometry.setAttribute('aIndex', new BufferAttribute(markerIndices, 1));
  const markerMaterial = new ShaderMaterial({
    vertexShader: MARKER_VERTEX,
    fragmentShader: MARKER_FRAGMENT,
    uniforms: {
      uTime: { value: 0 },
      uPulseOn: { value: reducedMotion ? 0 : 1 },
      uSelected: { value: -1 },
      uHovered: { value: -1 },
      uColor: { value: new Color(BRAND_CYAN) },
    },
    transparent: true,
    blending: AdditiveBlending,
    depthWrite: false,
  });
  const markers = new Points(markerGeometry, markerMaterial);
  globe.add(markers);

  // ---- Seoul beacon: amber home thread — bright core + expanding ring ----
  const beaconPos = latLngToVec3(home.lat, home.lng, GLOBE_RADIUS * 1.006);
  const beaconGeometry = new SphereGeometry(0.022, 16, 12);
  const beaconMaterial = new MeshBasicMaterial({ color: new Color('#ffe3b0') });
  const beacon = new Mesh(beaconGeometry, beaconMaterial);
  beacon.position.copy(beaconPos);
  globe.add(beacon);

  const ringGeometry = new RingGeometry(0.03, 0.05, 40);
  const ringMaterial = new MeshBasicMaterial({
    color: new Color(HOME_AMBER),
    transparent: true,
    opacity: 0.8,
    side: 2,
    depthWrite: false,
  });
  const ring = new Mesh(ringGeometry, ringMaterial);
  ring.position.copy(beaconPos.clone().multiplyScalar(1.004));
  ring.lookAt(beaconPos.clone().multiplyScalar(2));
  globe.add(ring);

  // Initial orientation: Seoul faces the camera, nudged slightly right of
  // center so the westward arcs sweep across the visible hemisphere.
  globe.rotation.y = Math.atan2(beaconPos.z, beaconPos.x) - Math.PI / 2 + 0.55;

  // ---- Interaction state ----
  let dragging = false;
  let velocityY = 0;
  let tiltX = 0;
  let lastInteract = 0;
  let selectedIndex = -1;

  // Camera zoom (pinch / buttons), tweened toward a clamped target.
  let baseZ = 3.05;
  let zoomFactor = 1;

  // Focus tween state (globe rotates so a country faces the camera).
  let focusAnim = null;

  const raycaster = new Raycaster();
  const pointerNdc = new Vector2(2, 2); // offscreen until first move
  let hoveredIndex = -1;
  let pickThresholdWorld = 0.06;
  let viewH = 300;

  const timer = new Timer();
  let running = false;
  let frameId = null;
  let needsFrame = true; // reduced-motion demand rendering

  const now = () => performance.now();
  const interact = () => {
    lastInteract = now();
    requestRender();
  };

  function requestRender() {
    needsFrame = true;
    if (running && reducedMotion && frameId === null) {
      frameId = requestAnimationFrame(renderFrame);
    }
  }

  function updatePickThreshold() {
    // ~48px effective tap target: convert 24px to world units at globe depth.
    const dist = camera.position.length();
    const worldPerPixel = (2 * dist * Math.tan((camera.fov * Math.PI) / 360)) / Math.max(viewH, 1);
    pickThresholdWorld = Math.max(0.06, 24 * worldPerPixel);
    raycaster.params.Points = { threshold: pickThresholdWorld };
  }

  function pointerDown() {
    dragging = true;
    focusAnim = null;
    interact();
  }
  let lastX = 0;
  let lastY = 0;
  function pointerMove(x, y, ndcX, ndcY, isDrag) {
    if (dragging && isDrag) {
      const deltaX = x - lastX;
      const deltaY = y - lastY;
      velocityY = deltaX * 0.005;
      globe.rotation.y += velocityY;
      tiltX = Math.max(-1.05, Math.min(1.05, tiltX + deltaY * 0.003));
      interact();
    }
    lastX = x;
    lastY = y;
    pointerNdc.set(ndcX, ndcY);
    if (reducedMotion) requestRender();
  }
  function pointerUp() {
    dragging = false;
    if (Math.abs(velocityY) > 0.0001) interact();
  }

  function zoomBy(factor) {
    zoomFactor = Math.max(0.62, Math.min(1.7, zoomFactor * factor));
    interact();
  }

  function nudge(dYaw, dTilt) {
    globe.rotation.y += dYaw;
    tiltX = Math.max(-1.05, Math.min(1.05, tiltX + dTilt));
    focusAnim = null;
    interact();
  }

  // Raycast pick against generously-sized point targets; front side only.
  function pick(ndcX, ndcY) {
    pointerNdc.set(ndcX, ndcY);
    updatePickThreshold();
    raycaster.setFromCamera(new Vector2(ndcX, ndcY), camera);
    const hits = raycaster.intersectObject(markers, false);
    for (const h of hits) {
      if (h.point.dot(camera.position) > 0) return h.index;
    }
    return -1;
  }

  function setHovered(i) {
    arcMaterial.uniforms.uHovered.value = i;
    markerMaterial.uniforms.uHovered.value = i;
    requestRender();
  }

  function setSelected(i) {
    selectedIndex = i;
    arcMaterial.uniforms.uSelected.value = i;
    markerMaterial.uniforms.uSelected.value = i;
    interact();
  }

  // Tween the globe so countries[i] faces the camera (slightly above center
  // so the detail panel/sheet doesn't cover it).
  function focusCountry(i) {
    const p = markerLocal[i];
    if (!p) return;
    const rho = Math.hypot(p.x, p.z);
    let toYaw = Math.atan2(p.z, p.x) - Math.PI / 2;
    const toTilt = Math.max(-1.05, Math.min(1.05, Math.atan2(p.y, rho) - 0.15));
    // Shortest way around.
    const fromYaw = globe.rotation.y;
    const twoPi = Math.PI * 2;
    let delta = (toYaw - fromYaw) % twoPi;
    if (delta > Math.PI) delta -= twoPi;
    if (delta < -Math.PI) delta += twoPi;
    toYaw = fromYaw + delta;
    focusAnim = { fromYaw, toYaw, fromTilt: tiltX, toTilt, start: now(), dur: 900 };
    interact();
  }

  function renderFrame() {
    frameId = null;
    if (!reducedMotion) {
      timer.update();
      const t = timer.getElapsed();
      arcMaterial.uniforms.uTime.value = t;
      markerMaterial.uniforms.uTime.value = t;
      const ringPulse = (t % 2.4) / 2.4;
      ring.scale.setScalar(1 + ringPulse * 2.4);
      ringMaterial.opacity = 0.8 * (1 - ringPulse);
    }

    // Focus tween
    if (focusAnim) {
      const k = Math.min(1, (now() - focusAnim.start) / focusAnim.dur);
      const e = easeInOutCubic(k);
      globe.rotation.y = focusAnim.fromYaw + (focusAnim.toYaw - focusAnim.fromYaw) * e;
      tiltX = focusAnim.fromTilt + (focusAnim.toTilt - focusAnim.fromTilt) * e;
      if (k >= 1) focusAnim = null;
      needsFrame = true;
    } else if (!dragging && !reducedMotion) {
      velocityY *= 0.95;
      // Auto-rotate: only after 4s idle and with nothing selected.
      const idle = now() - lastInteract > IDLE_RESUME_MS;
      const auto = idle && selectedIndex < 0 ? 0.0011 : 0;
      globe.rotation.y += auto + velocityY;
    }
    globe.rotation.x += (tiltX - globe.rotation.x) * 0.08;

    // Zoom tween
    const targetZ = baseZ * zoomFactor;
    const dz = targetZ - camera.position.z;
    if (Math.abs(dz) > 0.0005) {
      camera.position.z += dz * 0.14;
      needsFrame = true;
    }

    // Hover: raycast the marker points and report the country up to React.
    if (onHover) {
      updatePickThreshold();
      raycaster.setFromCamera(pointerNdc, camera);
      const hits = raycaster.intersectObject(markers, false);
      let hit = -1;
      if (hits.length > 0 && hits[0].point.dot(camera.position) > 0) {
        hit = hits[0].index;
      }
      if (hit !== hoveredIndex) {
        hoveredIndex = hit;
        onHover(hit);
      }
    }

    // Project persistent labels (top countries + the selected one) to CSS.
    if (labelEls) {
      globe.updateMatrixWorld();
      const v = new Vector3();
      const size = renderer.getSize(new Vector2());
      labelEls.forEach((el, index) => {
        const local = markerLocal[index];
        if (!el || !local) return;
        const show = index < 8 || index === selectedIndex;
        v.copy(local).applyMatrix4(globe.matrixWorld);
        const front = v.dot(camera.position) > 0.18;
        if (!show || !front) {
          el.dataset.on = '0';
          return;
        }
        v.project(camera);
        const x = (v.x * 0.5 + 0.5) * size.x;
        const y = (-v.y * 0.5 + 0.5) * size.y;
        el.dataset.on = '1';
        el.style.transform = `translate(-50%, -140%) translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
      });
    }

    renderer.render(scene, camera);

    if (!running) return;
    if (reducedMotion) {
      // Demand rendering: keep animating only while something is in motion.
      const moving = focusAnim || dragging || Math.abs(baseZ * zoomFactor - camera.position.z) > 0.0005
        || Math.abs(tiltX - globe.rotation.x) > 0.0005;
      if (moving || needsFrame) {
        needsFrame = false;
        frameId = requestAnimationFrame(renderFrame);
      }
    } else {
      frameId = requestAnimationFrame(renderFrame);
    }
  }

  function start() {
    if (running) return;
    running = true;
    needsFrame = true;
    if (frameId === null) frameId = requestAnimationFrame(renderFrame);
  }

  function stop() {
    running = false;
    if (frameId !== null) {
      cancelAnimationFrame(frameId);
      frameId = null;
    }
  }

  function resize(width, height, nextDpr) {
    const w = Math.max(width, 1);
    const h = Math.max(height, 1);
    viewH = h;
    camera.aspect = w / h;
    // Pull back on narrow viewports so the whole globe plus arcs fits.
    baseZ = camera.aspect < 0.9 ? 3.8 : 3.05;
    camera.updateProjectionMatrix();
    if (nextDpr) renderer.setPixelRatio(nextDpr);
    renderer.setSize(w, h, false);
    updatePickThreshold();
    requestRender();
    if (!running) renderer.render(scene, camera);
  }

  function dispose() {
    stop();
    sphereGeometry.dispose();
    sphereMaterial.dispose();
    graticuleGeometry.dispose();
    graticuleMaterial.dispose();
    landGeometry.dispose();
    landMaterial.dispose();
    atmosphereGeometry.dispose();
    atmosphereMaterial.dispose();
    arcGeometry.dispose();
    arcMaterial.dispose();
    markerGeometry.dispose();
    markerMaterial.dispose();
    beaconGeometry.dispose();
    beaconMaterial.dispose();
    ringGeometry.dispose();
    ringMaterial.dispose();
    renderer.dispose();
    renderer.forceContextLoss();
  }

  return {
    start,
    stop,
    resize,
    dispose,
    pointerDown,
    pointerMove,
    pointerUp,
    zoomBy,
    nudge,
    pick,
    setHovered,
    setSelected,
    focusCountry,
  };
}
