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

function resolveTheme(theme) {
  return THEME_TOKENS[theme] ? theme : 'light';
}

export function createHeroScene(canvas, { theme = 'light', quality = {} } = {}) {
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
  camera.position.set(0, 0, 6.4);
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

  const rimLight = new THREE.PointLight(0xffb066, 0.85, 7, 2);
  rimLight.position.set(-0.7, 0.35, 1.8);
  scene.add(rimLight);

  // Logo: extruded disc + embossed "A" (with a real geometric hole for the
  // flame) + a flat ember-shader mesh recessed inside that hole.
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

  const logoGroup = new THREE.Group();
  logoGroup.add(discMesh, aMesh, flameMesh);
  logoGroup.scale.setScalar(1.55);
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
  scene.add(icons.group);

  // THREE.Clock is deprecated (r183) in favor of Timer, which requires an
  // explicit update() each frame before reading getElapsed().
  const timer = new THREE.Timer();
  let running = false;
  let frameId = null;

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
    pointerCurrent.x += (pointerTarget.x - pointerCurrent.x) * 0.06;
    pointerCurrent.y += (pointerTarget.y - pointerCurrent.y) * 0.06;
    logoGroup.rotation.y = baseRotationY + Math.sin(t * 0.15) * 0.12 + pointerCurrent.x * 0.18;
    logoGroup.rotation.x = baseRotationX + Math.cos(t * 0.12) * 0.04 - pointerCurrent.y * 0.12;
    logoGroup.position.y = Math.sin(t * 0.4) * 0.05;
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

  return { start, stop, resize, setTheme, setPointer, click, dispose };
}
