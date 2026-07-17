/**
 * Imperative three.js scene for the homepage hero. This is the only module
 * that imports 'three' (directly or transitively) — it is reached exclusively
 * through the dynamic import() in ./index.js, so webpack places it, 'three',
 * and its sibling modules into one async chunk that never loads on any other
 * route.
 */
// Named imports (not `import * as THREE`) so webpack can tree-shake the
// large parts of three.js this scene never touches (loaders, controls,
// post-processing, etc.) out of the async chunk.
import {
  AdditiveBlending,
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  Timer,
  Color,
  DirectionalLight,
  DoubleSide,
  ExtrudeGeometry,
  Group,
  HemisphereLight,
  IcosahedronGeometry,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  OctahedronGeometry,
  Path,
  PerspectiveCamera,
  Plane,
  PointLight,
  Points,
  Raycaster,
  Scene,
  ShaderMaterial,
  Shape,
  ShapeGeometry,
  TorusGeometry,
  Vector2,
  Vector3,
  WebGLRenderer,
} from 'three';
import { buildCircleShape, buildAShapeWithFlameHole, buildFlameShape } from './logoGeometry';
import { createFireMaterial } from './fireMaterial';
import { createParticleNetwork } from './particleNetwork';
import { createConceptIcons } from './conceptIcons';

// logoGeometry/fireMaterial/particleNetwork/conceptIcons take a THREE-like
// namespace object so they stay agnostic to how the caller imported three.js
// — tree shaking still works because it's keyed on which named exports are
// referenced anywhere in the module graph, not on how they're re-grouped here.
const THREE = {
  AdditiveBlending,
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  Timer,
  Color,
  DirectionalLight,
  DoubleSide,
  ExtrudeGeometry,
  Group,
  HemisphereLight,
  IcosahedronGeometry,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  OctahedronGeometry,
  Path,
  PerspectiveCamera,
  Plane,
  PointLight,
  Points,
  Raycaster,
  Scene,
  ShaderMaterial,
  Shape,
  ShapeGeometry,
  TorusGeometry,
  Vector2,
  Vector3,
  WebGLRenderer,
};

const THEME_TOKENS = {
  light: {
    ambient: '#bcd4f5',
    ground: '#0c1c33',
    particle: '#0e59a9',
    fillIntensity: 0.5,
  },
  dark: {
    ambient: '#8fb8f2',
    ground: '#050b16',
    particle: '#5ea4ef',
    fillIntensity: 0.62,
  },
};

// Steady-state blue-fire values shared by the intro's end state and the
// no-intro (returning visitor) initial state.
const FLAME_INTENSITY = 1.35;
const RIM_INTENSITY = 0.9;

/**
 * First-visit "forging of the mark" timeline (seconds from intro start).
 * Each entry fires onIntroPhase(name) once when its time is reached, so the
 * DOM captions stay in sync with the 3D beats:
 *   forge  — particle field converges, the disc coins into place
 *   rise   — the "A" descends into the disc
 *   ignite — the blue fire bursts alive (ripple through the network)
 *   spirit — orbiting concept shapes appear; captions list the lab's spirit
 *   done   — intro over, scene blends into its ambient idle behavior
 */
const INTRO_TIMELINE = [
  { name: 'forge', at: 0 },
  { name: 'rise', at: 2.1 },
  { name: 'ignite', at: 4.0 },
  { name: 'spirit', at: 5.7 },
  { name: 'done', at: 9.6 },
];
const INTRO_END = INTRO_TIMELINE[INTRO_TIMELINE.length - 1].at;

function segment(t, from, to) {
  return Math.min(1, Math.max(0, (t - from) / (to - from)));
}

function easeOutCubic(x) {
  return 1 - Math.pow(1 - x, 3);
}

function easeInOutCubic(x) {
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

function easeOutBack(x) {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
}

function resolveTheme(theme) {
  return THEME_TOKENS[theme] ? theme : 'light';
}

export function createHeroScene(canvas, { theme = 'light', quality = {}, intro = false, onIntroPhase } = {}) {
  const particleCount = quality.particleCount ?? 70;
  const initialDpr = quality.dpr ?? Math.min(window.devicePixelRatio || 1, 2);
  let activeTheme = resolveTheme(theme);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance',
  });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(initialDpr);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  // Camera distance is aspect-aware: on narrow (mobile) viewports the camera
  // pulls back so the mark always fits ~78% of the frame width instead of
  // bleeding past the edges. Recomputed on every resize.
  let cameraDistance = 6.4;
  function updateCameraDistance() {
    const halfH = Math.tan((camera.fov * Math.PI) / 360);
    cameraDistance = Math.max(6.4, 1.6 / (halfH * camera.aspect));
  }
  camera.position.set(0, 0, cameraDistance);
  camera.lookAt(0, 0, 0);

  const keyLight = new THREE.DirectionalLight(0xffffff, 1.15);
  keyLight.position.set(2.4, 3.1, 4.2);
  scene.add(keyLight);

  const fillLight = new THREE.HemisphereLight(
    THEME_TOKENS[activeTheme].ambient,
    THEME_TOKENS[activeTheme].ground,
    THEME_TOKENS[activeTheme].fillIntensity
  );
  scene.add(fillLight);

  // Cool rim glow from the flame side — the blue fire's light cast onto the
  // mark. Starts dark during the intro and comes alive at ignition.
  const rimLight = new THREE.PointLight(0x4fc3ff, RIM_INTENSITY, 7, 2);
  rimLight.position.set(-0.7, 0.35, 1.8);
  scene.add(rimLight);

  // Logo: extruded disc + embossed "A" (with a real geometric hole for the
  // flame) + a flat blue-fire shader mesh recessed inside that hole.
  const circleShape = buildCircleShape(THREE);
  const aShape = buildAShapeWithFlameHole(THREE);
  const flameShape = buildFlameShape(THREE);

  const discGeometry = new THREE.ExtrudeGeometry(circleShape, {
    depth: 0.22,
    bevelEnabled: true,
    bevelThickness: 0.035,
    bevelSize: 0.025,
    bevelSegments: 3,
    curveSegments: 96,
  });

  const aGeometry = new THREE.ExtrudeGeometry(aShape, {
    depth: 0.1,
    bevelEnabled: true,
    bevelThickness: 0.018,
    bevelSize: 0.014,
    bevelSegments: 2,
    curveSegments: 96,
  });

  const flameGeometry = new THREE.ShapeGeometry(flameShape, 48);

  const discMaterial = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#0e59a9'),
    metalness: 0.3,
    roughness: 0.32,
    clearcoat: 0.55,
    clearcoatRoughness: 0.25,
  });

  const aMaterial = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#f5f9ff'),
    metalness: 0.08,
    roughness: 0.24,
    clearcoat: 0.6,
    clearcoatRoughness: 0.2,
  });

  const fireMaterial = createFireMaterial(THREE);

  const discMesh = new THREE.Mesh(discGeometry, discMaterial);
  const aMesh = new THREE.Mesh(aGeometry, aMaterial);
  aMesh.position.z = 0.2;
  const flameMesh = new THREE.Mesh(flameGeometry, fireMaterial);
  flameMesh.position.z = 0.235;

  // The mark floats in the upper two-thirds of the frame; the headline owns
  // the lower third (see the hero layout), so they never fight for the eye.
  const LOGO_BASE_Y = 0.45;
  const logoGroup = new THREE.Group();
  logoGroup.add(discMesh, aMesh, flameMesh);
  logoGroup.scale.setScalar(1.25);
  logoGroup.position.y = LOGO_BASE_Y;
  const baseRotationX = -0.1;
  const baseRotationY = 0.16;
  logoGroup.rotation.set(baseRotationX, baseRotationY, 0);
  scene.add(logoGroup);

  const network = createParticleNetwork(THREE, {
    count: particleCount,
    color: THEME_TOKENS[activeTheme].particle,
  });
  scene.add(network.group);

  const icons = createConceptIcons(THREE);
  icons.group.position.y = LOGO_BASE_Y;
  scene.add(icons.group);

  // THREE.Clock is deprecated (r183) in favor of Timer, which requires an
  // explicit update() each frame before reading getElapsed().
  const timer = new THREE.Timer();
  let running = false;
  let frameId = null;

  // ---- Intro state -------------------------------------------------------
  let introActive = Boolean(intro);
  let introStartElapsed = null; // captured on the first rendered intro frame
  let introPhaseIndex = -1;
  // Elapsed timestamp when the intro ended; drives the blend back into the
  // ambient idle sway. A large negative sentinel means "never had an intro",
  // so the blend is already 1 on the first frame.
  let introEndElapsed = introActive ? null : -100;
  let ignitionPulseFired = false;

  function emitIntroPhases(it) {
    while (
      introPhaseIndex + 1 < INTRO_TIMELINE.length &&
      it >= INTRO_TIMELINE[introPhaseIndex + 1].at
    ) {
      introPhaseIndex += 1;
      if (onIntroPhase) {
        onIntroPhase(INTRO_TIMELINE[introPhaseIndex].name);
      }
    }
  }

  function applySteadyState() {
    camera.position.set(0, 0, cameraDistance);
    camera.lookAt(0, 0, 0);
    discMesh.visible = true;
    discMesh.scale.setScalar(1);
    discMesh.rotation.set(0, 0, 0);
    aMesh.visible = true;
    aMesh.scale.setScalar(1);
    aMesh.position.set(0, 0, 0.2);
    flameMesh.visible = true;
    fireMaterial.uniforms.uIntensity.value = FLAME_INTENSITY;
    fireMaterial.uniforms.uIgnite.value = 0;
    rimLight.intensity = RIM_INTENSITY;
    network.group.scale.setScalar(1);
    icons.group.visible = true;
    icons.group.scale.setScalar(1);
  }

  function applyIntroFrame(it) {
    // Camera dolly: drift in from afar while the mark forges itself.
    const camP = easeInOutCubic(segment(it, 0, 5.4));
    camera.position.set(0, 0.5 * (1 - camP), cameraDistance + 2.8 * (1 - camP));
    camera.lookAt(0, 0, 0);

    // Particle field converges from a compressed core — the "big bang" the
    // rest of the mark is born out of.
    const netP = easeOutCubic(segment(it, 0, 2.4));
    network.group.scale.setScalar(0.12 + 0.88 * netP);

    // Disc coins into place with a decaying spin.
    const discScaleP = easeOutBack(segment(it, 0.2, 2.0));
    const discSpinP = easeOutCubic(segment(it, 0.2, 2.2));
    discMesh.visible = it >= 0.2;
    discMesh.scale.setScalar(Math.max(0.0001, discScaleP));
    discMesh.rotation.y = (1 - discSpinP) * Math.PI * 2.5;

    // The "A" descends into the disc.
    const aP = easeOutCubic(segment(it, 2.15, 3.8));
    aMesh.visible = it >= 2.15;
    aMesh.position.y = (1 - aP) * 2.3;
    aMesh.position.z = 0.2 + (1 - aP) * 1.4;
    aMesh.scale.setScalar(0.6 + 0.4 * aP);

    // Ignition: burst to white-hot, then settle into the steady blue burn.
    flameMesh.visible = it >= 3.95;
    const igniteRamp = segment(it, 4.0, 4.35);
    const igniteDecay = 1 - easeOutCubic(segment(it, 4.35, 5.9));
    fireMaterial.uniforms.uIgnite.value = igniteRamp * igniteDecay;
    fireMaterial.uniforms.uIntensity.value = FLAME_INTENSITY * segment(it, 4.0, 4.55);
    rimLight.intensity = RIM_INTENSITY * easeOutCubic(segment(it, 4.0, 4.9));
    if (!ignitionPulseFired && it >= 4.05) {
      ignitionPulseFired = true;
      network.pulse(new THREE.Vector3(0, LOGO_BASE_Y + 0.45, 0.3), timer.getElapsed());
    }

    // Concept shapes join the orbit once the fire is alive.
    const iconP = easeOutBack(segment(it, 5.7, 6.7));
    icons.group.visible = it >= 5.65;
    icons.group.scale.setScalar(Math.max(0.0001, iconP));
  }

  function finishIntro() {
    introActive = false;
    introEndElapsed = timer.getElapsed();
    applySteadyState();
    // Make sure every phase (including 'done') has been reported exactly once.
    while (introPhaseIndex + 1 < INTRO_TIMELINE.length) {
      introPhaseIndex += 1;
      if (onIntroPhase) {
        onIntroPhase(INTRO_TIMELINE[introPhaseIndex].name);
      }
    }
  }

  if (!introActive) {
    applySteadyState();
  } else {
    // Hide everything until the first intro frame sets it up, so a render
    // before start() (e.g. the resize() static render) doesn't flash the
    // finished logo.
    discMesh.visible = false;
    aMesh.visible = false;
    flameMesh.visible = false;
    icons.group.visible = false;
    fireMaterial.uniforms.uIntensity.value = 0;
    rimLight.intensity = 0;
    network.group.scale.setScalar(0.12);
    camera.position.set(0, 0.5, cameraDistance + 2.8);
    camera.lookAt(0, 0, 0);
  }

  // Pointer-parallax: target is set instantly by setPointer() (desktop only —
  // see index.js), current eases toward it each frame for a damped tilt
  // rather than snapping the logo to the cursor.
  const pointerTarget = {x: 0, y: 0};
  const pointerCurrent = {x: 0, y: 0};
  const pointerNdc = new THREE.Vector2(0, 0);
  let pointerActive = false;

  // Plane the cursor ray is intersected against to find a 3D world point for
  // the particle-network repulsion field (roughly the network's mid-depth).
  const mousePlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 2.2);
  const raycastHelper = new THREE.Raycaster();
  const mouseWorldPoint = new THREE.Vector3();

  function renderFrame() {
    timer.update();
    const t = timer.getElapsed();

    if (introActive) {
      if (introStartElapsed === null) {
        introStartElapsed = t;
      }
      const it = t - introStartElapsed;
      applyIntroFrame(it);
      emitIntroPhases(it);
      if (it >= INTRO_END) {
        finishIntro();
      }
    }

    // Ambient idle sway + pointer parallax, blended in over ~1.6s after the
    // intro ends (idleBlend is already 1 when there was no intro).
    const idleBlend = introActive
      ? 0
      : Math.min(1, Math.max(0, (t - (introEndElapsed ?? t)) / 1.6));
    pointerCurrent.x += (pointerTarget.x - pointerCurrent.x) * 0.06;
    pointerCurrent.y += (pointerTarget.y - pointerCurrent.y) * 0.06;
    logoGroup.rotation.y =
      baseRotationY + (Math.sin(t * 0.15) * 0.12 + pointerCurrent.x * 0.18) * idleBlend;
    logoGroup.rotation.x =
      baseRotationX + (Math.cos(t * 0.12) * 0.04 - pointerCurrent.y * 0.12) * idleBlend;
    logoGroup.position.y = LOGO_BASE_Y + Math.sin(t * 0.4) * 0.05 * idleBlend;
    fireMaterial.uniforms.uTime.value = t;

    if (pointerActive) {
      raycastHelper.setFromCamera(pointerNdc, camera);
      if (raycastHelper.ray.intersectPlane(mousePlane, mouseWorldPoint)) {
        network.setMouse(mouseWorldPoint, true);
      }
    } else {
      network.setMouse(null, false);
    }
    network.update(t);
    icons.update(t, camera, pointerActive ? pointerNdc : null);

    renderer.render(scene, camera);
    if (running) {
      frameId = requestAnimationFrame(renderFrame);
    }
  }

  function setPointer(nx, ny, active = true) {
    const cx = Math.max(-1, Math.min(1, nx));
    const cy = Math.max(-1, Math.min(1, ny));
    pointerTarget.x = cx;
    pointerTarget.y = cy;
    pointerNdc.set(cx, -cy);
    pointerActive = active;
  }

  function click(nx, ny) {
    const cx = Math.max(-1, Math.min(1, nx));
    const cy = Math.max(-1, Math.min(1, ny));
    raycastHelper.setFromCamera(new THREE.Vector2(cx, -cy), camera);
    const worldPoint = new THREE.Vector3();
    if (raycastHelper.ray.intersectPlane(mousePlane, worldPoint)) {
      network.pulse(worldPoint, timer.getElapsed());
    }
  }

  function skipIntro() {
    if (introActive) {
      finishIntro();
      if (!running) {
        renderer.render(scene, camera);
      }
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

  function resize(nextWidth, nextHeight, nextDpr) {
    const width = Math.max(nextWidth, 1);
    const height = Math.max(nextHeight, 1);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    updateCameraDistance();
    if (!introActive) {
      camera.position.z = cameraDistance;
    }
    renderer.setPixelRatio(nextDpr ?? initialDpr);
    renderer.setSize(width, height, false);
    if (!running) {
      renderer.render(scene, camera);
    }
  }

  function setTheme(nextTheme) {
    activeTheme = resolveTheme(nextTheme);
    const tokens = THEME_TOKENS[activeTheme];
    fillLight.color.set(tokens.ambient);
    fillLight.groundColor.set(tokens.ground);
    fillLight.intensity = tokens.fillIntensity;
    network.setColor(tokens.particle);
    icons.setColor(tokens.particle);
  }

  function dispose() {
    stop();
    discGeometry.dispose();
    aGeometry.dispose();
    flameGeometry.dispose();
    discMaterial.dispose();
    aMaterial.dispose();
    fireMaterial.dispose();
    network.dispose();
    icons.dispose();
    renderer.dispose();
    renderer.forceContextLoss();
  }

  return { start, stop, resize, setTheme, setPointer, click, skipIntro, dispose };
}
