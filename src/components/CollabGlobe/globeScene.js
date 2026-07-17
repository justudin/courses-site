/**
 * Imperative three.js scene for the /networks collaboration globe. Loaded
 * exclusively through the dynamic import() in ./index.js so three.js and this
 * module live in their own async chunk that only loads on that page.
 *
 * The picture: a dark graticule globe, a pulsing beacon on Seoul, and one
 * glowing great-circle arc per collaborating country with a light pulse
 * traveling outward — the lab's publications radiating from home to the
 * world. All arcs share one geometry/draw call; per-frame cost is a handful
 * of uniform writes.
 */
import landDots from '@site/src/data/landdots.json';
import {
  AdditiveBlending,
  BackSide,
  BufferAttribute,
  BufferGeometry,
  Color,
  Group,
  Line,
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
const ARC_SEGMENTS = 48;

function latLngToVec3(lat, lng, radius) {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((lng + 180) * Math.PI) / 180;
  return new Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
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
  varying float vT;
  varying float vPhase;
  varying float vSpeed;
  void main() {
    vT = aT;
    vPhase = aPhase;
    vSpeed = aSpeed;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const ARC_FRAGMENT = /* glsl */ `
  uniform float uTime;
  uniform vec3 uColorNear;
  uniform vec3 uColorFar;
  varying float vT;
  varying float vPhase;
  varying float vSpeed;
  void main() {
    // Faint constant arc + a bright pulse traveling from home (t=0) outward.
    float pulsePos = fract(uTime * vSpeed + vPhase);
    float d = vT - pulsePos;
    float comet = smoothstep(0.18, 0.0, abs(d)) * step(0.0, d) // tail behind the head
      + smoothstep(0.035, 0.0, abs(d)); // bright head
    float alpha = 0.16 + comet * 0.85;
    vec3 color = mix(uColorNear, uColorFar, vT);
    color = mix(color, vec3(1.0), comet * 0.35);
    gl_FragColor = vec4(color, alpha);
  }
`;

const MARKER_VERTEX = /* glsl */ `
  attribute float aSize;
  attribute float aPhase;
  varying float vTwinkle;
  uniform float uTime;
  void main() {
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vTwinkle = 0.75 + 0.25 * sin(uTime * 1.4 + aPhase);
    gl_PointSize = aSize * (140.0 / max(-mvPosition.z, 0.001));
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const MARKER_FRAGMENT = /* glsl */ `
  uniform vec3 uColor;
  varying float vTwinkle;
  void main() {
    vec2 c = gl_PointCoord - vec2(0.5);
    float d = length(c);
    float core = smoothstep(0.22, 0.05, d);
    float halo = smoothstep(0.5, 0.0, d) * 0.55;
    float alpha = (core + halo) * vTwinkle;
    vec3 color = mix(uColor, vec3(1.0), core * 0.55);
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

export function createGlobeScene(canvas, { home, countries, dpr, onHover }) {
  const renderer = new WebGLRenderer({
    canvas,
    antialias: true,
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
  const sphereGeometry = new SphereGeometry(GLOBE_RADIUS * 0.992, 64, 48);
  const sphereMaterial = new MeshBasicMaterial({ color: new Color('#071528') });
  const sphere = new Mesh(sphereGeometry, sphereMaterial);
  globe.add(sphere);

  const graticuleGeometry = buildGraticule(GLOBE_RADIUS * 0.998);
  const graticuleMaterial = new LineBasicMaterial({
    color: new Color('#1c4d86'),
    transparent: true,
    opacity: 0.16,
  });
  const graticule = new LineSegments(graticuleGeometry, graticuleMaterial);
  globe.add(graticule);

  // Dot-matrix landmass, sampled offline from NASA's public-domain
  // equirectangular Blue Marble map (see scripts/generate-land-dots.js).
  // landdots.json is a flat [lat, lng, lat, lng, ...] array.
  const landCount = landDots.length / 2;
  const landPositions = new Float32Array(landCount * 3);
  for (let i = 0; i < landCount; i += 1) {
    const p = latLngToVec3(landDots[i * 2], landDots[i * 2 + 1], GLOBE_RADIUS);
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
  countries.forEach((country, index) => {
    const end = latLngToVec3(country.lat, country.lng, GLOBE_RADIUS);
    const angle = homePos.angleTo(end);
    const lift = 1 + 0.18 + angle * 0.24;
    const mid = homePos.clone().add(end).normalize().multiplyScalar(GLOBE_RADIUS * lift);
    const curve = new QuadraticBezierCurve3(homePos, mid, end);
    const pts = curve.getPoints(ARC_SEGMENTS);
    const phase = (index / countries.length) * 0.83;
    const speed = 0.16 + Math.min(country.works / maxWorks, 1) * 0.1;
    for (let i = 0; i < ARC_SEGMENTS; i += 1) {
      const a = pts[i];
      const b = pts[i + 1];
      arcPositions.push(a.x, a.y, a.z, b.x, b.y, b.z);
      arcT.push(i / ARC_SEGMENTS, (i + 1) / ARC_SEGMENTS);
      arcPhase.push(phase, phase);
      arcSpeed.push(speed, speed);
    }
  });

  const arcGeometry = new BufferGeometry();
  arcGeometry.setAttribute('position', new BufferAttribute(new Float32Array(arcPositions), 3));
  arcGeometry.setAttribute('aT', new BufferAttribute(new Float32Array(arcT), 1));
  arcGeometry.setAttribute('aPhase', new BufferAttribute(new Float32Array(arcPhase), 1));
  arcGeometry.setAttribute('aSpeed', new BufferAttribute(new Float32Array(arcSpeed), 1));
  const arcMaterial = new ShaderMaterial({
    vertexShader: ARC_VERTEX,
    fragmentShader: ARC_FRAGMENT,
    uniforms: {
      uTime: { value: 0 },
      uColorNear: { value: new Color(BRAND_CYAN) },
      uColorFar: { value: new Color(BRAND_BLUE) },
    },
    transparent: true,
    blending: AdditiveBlending,
    depthWrite: false,
  });
  const arcs = new LineSegments(arcGeometry, arcMaterial);
  globe.add(arcs);

  // ---- Country markers ----
  const markerPositions = new Float32Array(countries.length * 3);
  const markerSizes = new Float32Array(countries.length);
  const markerPhases = new Float32Array(countries.length);
  countries.forEach((country, i) => {
    const p = latLngToVec3(country.lat, country.lng, GLOBE_RADIUS * 1.005);
    markerPositions.set([p.x, p.y, p.z], i * 3);
    markerSizes[i] = 0.055 + Math.sqrt(country.works / maxWorks) * 0.095;
    markerPhases[i] = Math.random() * Math.PI * 2;
  });
  const markerGeometry = new BufferGeometry();
  markerGeometry.setAttribute('position', new BufferAttribute(markerPositions, 3));
  markerGeometry.setAttribute('aSize', new BufferAttribute(markerSizes, 1));
  markerGeometry.setAttribute('aPhase', new BufferAttribute(markerPhases, 1));
  const markerMaterial = new ShaderMaterial({
    vertexShader: MARKER_VERTEX,
    fragmentShader: MARKER_FRAGMENT,
    uniforms: {
      uTime: { value: 0 },
      uColor: { value: new Color(BRAND_CYAN) },
    },
    transparent: true,
    blending: AdditiveBlending,
    depthWrite: false,
  });
  const markers = new Points(markerGeometry, markerMaterial);
  globe.add(markers);

  // ---- Seoul beacon: bright core + expanding pulse ring ----
  const beaconPos = latLngToVec3(home.lat, home.lng, GLOBE_RADIUS * 1.006);
  const beaconGeometry = new SphereGeometry(0.022, 16, 12);
  const beaconMaterial = new MeshBasicMaterial({ color: new Color('#dff4ff') });
  const beacon = new Mesh(beaconGeometry, beaconMaterial);
  beacon.position.copy(beaconPos);
  globe.add(beacon);

  const ringGeometry = new RingGeometry(0.03, 0.05, 40);
  const ringMaterial = new MeshBasicMaterial({
    color: new Color(BRAND_CYAN),
    transparent: true,
    opacity: 0.8,
    side: 2,
    depthWrite: false,
  });
  const ring = new Mesh(ringGeometry, ringMaterial);
  ring.position.copy(beaconPos.clone().multiplyScalar(1.004));
  ring.lookAt(beaconPos.clone().multiplyScalar(2));
  globe.add(ring);

  // Initial orientation: rotate the globe so Seoul faces the camera, nudged
  // slightly right of center so the westward arcs (Asia → Europe) sweep
  // across the visible hemisphere. Y-rotation by θ maps a point's XZ angle
  // φ → φ − θ, and the camera looks down −Z at the globe's +Z face (φ = π/2).
  globe.rotation.y = Math.atan2(beaconPos.z, beaconPos.x) - Math.PI / 2 + 0.55;

  // ---- Interaction: drag to rotate with inertia; auto-rotate otherwise ----
  let dragging = false;
  let lastX = 0;
  let lastY = 0;
  let velocityY = 0;
  let tiltX = 0;
  const raycaster = new Raycaster();
  raycaster.params.Points = { threshold: 0.06 };
  const pointerNdc = new Vector2();
  let hoveredIndex = -1;

  function pointerDown(x) {
    dragging = true;
    lastX = x;
  }
  function pointerMove(x, y, ndcX, ndcY) {
    if (dragging) {
      const deltaX = x - lastX;
      const deltaY = y - lastY;
      velocityY = deltaX * 0.005;
      globe.rotation.y += velocityY;
      tiltX = Math.max(-0.6, Math.min(0.6, tiltX + deltaY * 0.003));
    }
    lastX = x;
    lastY = y;
    pointerNdc.set(ndcX, ndcY);
  }
  function pointerUp() {
    dragging = false;
  }

  const timer = new Timer();
  let running = false;
  let frameId = null;

  function renderFrame() {
    timer.update();
    const t = timer.getElapsed();
    arcMaterial.uniforms.uTime.value = t;
    markerMaterial.uniforms.uTime.value = t;

    if (!dragging) {
      velocityY *= 0.95;
      globe.rotation.y += 0.0011 + velocityY;
    }
    globe.rotation.x += (tiltX - globe.rotation.x) * 0.08;

    const ringPulse = (t % 2.4) / 2.4;
    ring.scale.setScalar(1 + ringPulse * 2.4);
    ringMaterial.opacity = 0.8 * (1 - ringPulse);

    // Hover: raycast the marker points and report the country up to React.
    raycaster.setFromCamera(pointerNdc, camera);
    const hits = raycaster.intersectObject(markers, false);
    let hit = -1;
    if (hits.length > 0) {
      // Ignore markers on the far side of the globe.
      const world = hits[0].point;
      if (world.dot(camera.position) > 0) {
        hit = hits[0].index;
      }
    }
    if (hit !== hoveredIndex) {
      hoveredIndex = hit;
      if (onHover) onHover(hit);
    }

    renderer.render(scene, camera);
    if (running) {
      frameId = requestAnimationFrame(renderFrame);
    }
  }

  function start() {
    if (running) return;
    running = true;
    frameId = requestAnimationFrame(renderFrame);
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
    camera.aspect = w / h;
    // Pull back on narrow viewports so the whole globe plus arcs fits.
    camera.position.z = camera.aspect < 0.9 ? 3.8 : 3.05;
    camera.updateProjectionMatrix();
    if (nextDpr) renderer.setPixelRatio(nextDpr);
    renderer.setSize(w, h, false);
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

  return { start, stop, resize, dispose, pointerDown, pointerMove, pointerUp };
}
