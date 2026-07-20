/**
 * Cinematic first-visit intro scene: ~20 seconds of GPU particle morphing
 * (data cloud → neural network → data stream → brain → globe with
 * collaboration arcs → pull-back → "Applied INtelligence Lab" wordmark),
 * timed against the voiceover track and handed off to Hero3D's forge intro
 * by the page when it ends.
 *
 * Like Hero3D/scene.js, this module is only reached through a dynamic
 * import() so three.js and the postprocessing stack stay in an async chunk.
 *
 * The timeline is data-driven (PHASES below): each phase declares its time
 * window, target particle shape, morph duration, camera dolly and fx uniform
 * targets. The clock is audio.currentTime when an <audio> element is supplied
 * and playing, wall time otherwise — so visuals stay in sync with the
 * voiceover even if decode stalls.
 */
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  Group,
  LineBasicMaterial,
  LineSegments,
  PerspectiveCamera,
  Points,
  PointsMaterial,
  Scene,
  ShaderMaterial,
  SphereGeometry,
  Vector2,
  Vector3,
  WebGLRenderer,
  WireframeGeometry,
} from 'three';
import {EffectComposer} from 'three/examples/jsm/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/examples/jsm/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import {ShaderPass} from 'three/examples/jsm/postprocessing/ShaderPass.js';
import {OutputPass} from 'three/examples/jsm/postprocessing/OutputPass.js';

export const INTRO_END = 20;
// Seconds of idle shimmer after the final beat before onEnded fires.
const END_HOLD = 1.1;

// Phase windows follow the voiceover's actual word timings (measured with
// speech recognition on intro-sound.mpeg — see the caption track below for
// the raw line boundaries). Re-measure before retiming if the audio changes.
const PHASES = [
  { name: 'welcome',      t: [0, 2.4],    shape: 'cloud',     morph: 0.01,
    cam: [[0, 2.4, 66], [0, 1.6, 52]],
    fx: { noise: 1.5, swirl: 0.15, spin: 0.03, size: 1.0, bright: 0.55 } },

  { name: 'playground',   t: [2.4, 6.1],  shape: 'network',   morph: 1.6,
    cam: [[5, 3, 43], [-5, 1.6, 36]],
    fx: { noise: 0.32, swirl: 1.0, spin: 0.26, net: 1, size: 1.0, bright: 0.8 } },

  { name: 'data',         t: [6.1, 7.15], shape: 'stream',    morph: 0.85,
    cam: [[0, 5, 42], [0, 2, 34]],
    fx: { noise: 0.22, flow: 1, spin: 0, size: 0.8, bright: 0.5, touch: 0.5 } },

  { name: 'intelligence', t: [7.15, 8.6], shape: 'brain',     morph: 0.95,
    cam: [[4, 2, 30], [-2.5, 1, 25]],
    fx: { noise: 0.14, amber: 1, brainNet: 1, spin: 0.18, size: 0.95, bright: 0.72 } },

  { name: 'impact',       t: [8.6, 10.9], shape: 'globe',     morph: 1.0,
    cam: [[0, 4, 28], [1.5, 2.6, 24.5]],
    fx: { noise: 0.12, globe: 1, arcs: 1, spin: 0.14, size: 0.8, bright: 0.55 } },

  { name: 'connected',    t: [10.9, 16.05], shape: 'globeHalo', morph: 1.6,
    cam: [[1.5, 2.6, 24.5], [0, 5, 54]],
    fx: { noise: 0.4, globe: 1, arcs: 1, spin: 0.1, amber: 0.3, size: 0.9, bright: 0.5 } },

  { name: 'purpose',      t: [16.05, INTRO_END], shape: 'text', morph: 1.7,
    cam: [[0, 3.5, 47], [0, 0.6, 34]],
    fx: { noise: 0.1, spin: 0, size: 0.62, bright: 0.9, touch: 0 } },
];

// Caption track, decoupled from the shape phases so each line lands exactly
// when the voiceover speaks it (word timings from speech recognition). Each
// caption holds until the next `at`. `key` lists the word indices to
// emphasize (the load-bearing terms of each line). CAPTION_LEAD shifts the
// whole track slightly ahead of the audio so lines never read as late.
const CAPTION_LEAD = 0.32;
const CAPTIONS = [
  { at: 0.12,  text: 'Welcome to Applied INtelligence Lab',                     key: [2, 3, 4] },
  { at: 2.5,   text: 'Not just a laboratory — a playground for applied intelligence', key: [6, 8, 9] },
  { at: 6.12,  text: 'From data…',                                              key: [1] },
  { at: 7.12,  text: '…to intelligence…',                                       key: [1] },
  { at: 8.05,  text: '…to real-world impact',                                   key: [1, 2] },
  { at: 9.78,  text: 'We explore AI, machine learning, and intelligent systems…', key: [2, 6, 7] },
  { at: 13.38, text: '…that shape a smarter, more connected world',             key: [3, 5, 6] },
  { at: 16.1,  text: 'AIN Lab.',                                                key: [0, 1] },
  { at: 17.16, text: 'Where curiosity meets purpose.',                          key: [1, 3] },
];
const FX_DEFAULTS = { noise: 0.3, swirl: 0, flow: 0, spin: 0, amber: 0.12,
                      net: 0, brainNet: 0, globe: 0, arcs: 0, size: 1, bright: 0.7,
                      // `touch` scales how strongly the pointer/tilt field parts
                      // the particles per phase (0 = inert, e.g. the wordmark beat).
                      touch: 1 };

export function createCinematicScene(
  canvas,
  {quality, greeting, onPhase, onCaption, onEnded, onProgress, onHotspot},
) {
  const COUNT = quality.particleCount;

  const renderer = new WebGLRenderer({canvas, antialias: false, powerPreference: 'high-performance'});
  renderer.setClearColor(0x02040a, 1);
  const scene = new Scene();
  const camera = new PerspectiveCamera(55, 16 / 9, 0.1, 400);
  camera.position.set(0, 2.4, 66);

  const group = new Group();
  scene.add(group);

  const rand = mulberry32(1337);
  const gauss = () => (rand() + rand() + rand() + rand() - 2) * 0.75;
  const randDir = () => {
    const z = rand() * 2 - 1, a = rand() * Math.PI * 2, r = Math.sqrt(1 - z * z);
    return [Math.cos(a) * r, z, Math.sin(a) * r];
  };

  /* ---------------- shape targets (COUNT * 3 each) ---------------- */
  const SHAPES = {};

  SHAPES.cloud = (() => {
    const a = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      const d = randDir(), r = 6 + 26 * Math.cbrt(rand());
      a[i * 3] = d[0] * r * 1.35; a[i * 3 + 1] = d[1] * r * 0.85; a[i * 3 + 2] = d[2] * r * 1.2;
    }
    return a;
  })();

  // Neural network: particles cluster on ~150 nodes; edges connect near nodes.
  const NET_NODES = [];
  {
    const NODE_N = 150;
    for (let n = 0; n < NODE_N; n++) {
      const d = randDir(), r = 13 * (0.62 + 0.5 * rand());
      NET_NODES.push([d[0] * r, d[1] * r * 0.85, d[2] * r]);
    }
    const a = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      const n = NET_NODES[(i * 7919) % NODE_N];
      a[i * 3] = n[0] + gauss() * 0.85; a[i * 3 + 1] = n[1] + gauss() * 0.85; a[i * 3 + 2] = n[2] + gauss() * 0.85;
    }
    SHAPES.network = a;
  }

  SHAPES.stream = (() => {
    const a = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      const lane = rand() * Math.PI * 2, x = (rand() * 2 - 1) * 42;
      a[i * 3] = x;
      a[i * 3 + 1] = Math.sin(x * 0.09 + lane) * 4.5 + gauss() * 2.4;
      a[i * 3 + 2] = Math.cos(x * 0.07 + lane) * 2.8 + gauss() * 2.6;
    }
    return a;
  })();

  // Brain: two gyri-folded cortex hemispheres split by a longitudinal
  // fissure, a finely striated cerebellum tucked low at the back, and a
  // brain stem sloping away beneath it — baked into a 3/4 view so the folds,
  // fissure and cerebellum all read from the intro's front-on camera.
  const brainPoint = () => {
    const sel = rand();
    let p;
    if (sel < 0.78) {
      const lobe = rand() < 0.5 ? -1 : 1;
      const d = randDir();
      const shell = 0.75 + 0.25 * Math.pow(rand(), 0.3);  // strong surface bias
      const folds = 1
        + 0.09 * Math.sin(d[2] * 9 + Math.sin(d[1] * 7) * 2)
        + 0.06 * Math.sin(d[1] * 11 + d[0] * 5);
      const x = Math.abs(d[0]) * 4.1 * shell * folds + 0.38;
      p = [lobe * x, d[1] * 3.9 * shell * folds + 0.4, d[2] * 5.5 * shell * folds];
    } else if (sel < 0.94) {
      const d = randDir();
      const shell = 0.7 + 0.3 * Math.pow(rand(), 0.4);
      const stria = 1 + 0.13 * Math.sin(d[1] * 26);
      p = [d[0] * 2.7 * shell * stria,
           -2.7 + d[1] * 1.7 * shell * stria,
           -3.3 + d[2] * 2.3 * shell * stria];
    } else {
      const t = rand();
      const ang = rand() * Math.PI * 2, rr = 0.75 * Math.sqrt(rand()) * (1 - 0.35 * t);
      p = [Math.cos(ang) * rr, -2.2 - t * 2.6, -2.2 + t * 1.1 + Math.sin(ang) * rr];
    }
    return rotY(rotX(p, 0.12), -0.55);
  };
  SHAPES.brain = (() => {
    const a = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) { const p = brainPoint(); a.set(p, i * 3); }
    return a;
  })();

  const GLOBE_R = 12;
  SHAPES.globe = (() => {
    const a = new Float32Array(COUNT * 3), golden = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < COUNT; i++) {
      const y = 1 - 2 * (i + 0.5) / COUNT, r = Math.sqrt(1 - y * y), th = golden * i;
      a[i * 3] = Math.cos(th) * r * GLOBE_R;
      a[i * 3 + 1] = y * GLOBE_R;
      a[i * 3 + 2] = Math.sin(th) * r * GLOBE_R;
    }
    return a;
  })();

  SHAPES.globeHalo = (() => {
    const a = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      if (rand() < 0.72) {
        const j = (i * 4241) % COUNT;
        a[i * 3] = SHAPES.globe[j * 3] + gauss() * 0.25;
        a[i * 3 + 1] = SHAPES.globe[j * 3 + 1] + gauss() * 0.25;
        a[i * 3 + 2] = SHAPES.globe[j * 3 + 2] + gauss() * 0.25;
      } else {
        const d = randDir(), r = 15 + 15 * Math.pow(rand(), 1.6);
        a[i * 3] = d[0] * r; a[i * 3 + 1] = d[1] * r * 0.8; a[i * 3 + 2] = d[2] * r;
      }
    }
    return a;
  })();

  // Final beat: the wordmark alone at first; once the logo mark (Hero3D's
  // "A" from the site favicon) loads, resample the same buffer in place so
  // the logo forms above the wordmark. It loads within milliseconds of scene
  // creation — long before the 17s mark needs it — and the wordmark-only
  // layout is the graceful fallback if it ever fails.
  SHAPES.text = sampleFinalShape(COUNT, null, greeting);
  {
    const logoImg = new Image();
    logoImg.onload = () => {
      try {
        SHAPES.text.set(sampleFinalShape(COUNT, logoImg, greeting));
      } catch (e) { /* keep the wordmark-only fallback */ }
    };
    logoImg.src = '/img/favicon.svg';
  }

  /* ---------------- particle system ---------------- */
  const geo = new BufferGeometry();
  const posArr = new Float32Array(SHAPES.cloud);           // "from" buffer
  const toArr = new Float32Array(SHAPES.cloud);            // "to" buffer
  const seeds = new Float32Array(COUNT);
  for (let i = 0; i < COUNT; i++) seeds[i] = rand();
  geo.setAttribute('position', new BufferAttribute(posArr, 3));
  geo.setAttribute('aTo', new BufferAttribute(toArr, 3));
  geo.setAttribute('aSeed', new BufferAttribute(seeds, 1));

  const uniforms = {
    uTime: { value: 0 }, uMorph: { value: 1 },
    uNoise: { value: 1.5 }, uSwirl: { value: 0 }, uFlow: { value: 0 },
    uAmber: { value: 0.12 }, uSize: { value: 1 }, uOpacity: { value: 0 },
    uBright: { value: 0.55 }, uPixelRatio: { value: 1 },
    // Interaction: a moving force well at the pointer/tilt point, and a
    // one-shot expanding shell from the last click/tap.
    uPointer: { value: new Vector3() }, uPointerForce: { value: 0 },
    uRippleOrigin: { value: new Vector3() }, uRippleT: { value: 5 }, uRippleAmp: { value: 0 },
  };
  const particleMaterial = new ShaderMaterial({
    uniforms, transparent: true, depthWrite: false, blending: AdditiveBlending,
    vertexShader: `
      attribute vec3 aTo;
      attribute float aSeed;
      uniform float uTime, uMorph, uNoise, uSwirl, uFlow, uSize, uPixelRatio;
      uniform vec3 uPointer, uRippleOrigin;
      uniform float uPointerForce, uRippleT, uRippleAmp;
      varying float vSeed;
      void main() {
        vSeed = aSeed;
        // Staggered eased morph: each particle departs on its own beat.
        float m = smoothstep(0.0, 1.0, clamp((uMorph - aSeed * 0.28) / 0.72, 0.0, 1.0));
        vec3 p = mix(position, aTo, m);
        // Playful swirl (radius-aware, breathing)
        float ang = uSwirl * 0.4 * sin(uTime * 0.5 + aSeed * 6.2831 + length(p.xz) * 0.14);
        float c = cos(ang), s = sin(ang);
        p.xz = mat2(c, -s, s, c) * p.xz;
        // Looping stream flow along x
        float fx = mod(p.x + uTime * (7.0 + 9.0 * aSeed) + 45.0, 90.0) - 45.0;
        p.x = mix(p.x, fx, uFlow);
        p.y += uFlow * sin(p.x * 0.16 + uTime * 2.2 + aSeed * 6.2831) * 1.2;
        // Ambient drift
        p += uNoise * 0.6 * vec3(
          sin(uTime * 0.31 + aSeed * 17.0),
          sin(uTime * 0.23 + aSeed * 29.0),
          sin(uTime * 0.27 + aSeed * 41.0));
        // Interactive cursor/touch/tilt force: particles part and swirl
        // around the pointer point so the cloud feels physically touchable.
        if (uPointerForce > 0.0001) {
          vec3 pd = p - uPointer;
          float pdist = length(pd) + 0.001;
          float infl = uPointerForce * exp(-pdist * pdist * 0.010);
          vec3 dir = pd / pdist;
          p += dir * infl * 3.4;                       // radial push
          p.xz += vec2(-dir.z, dir.x) * infl * 1.7;    // tangential swirl
        }
        // Expanding shell shockwave radiating from the last click/tap.
        if (uRippleAmp > 0.0001) {
          vec3 rd = p - uRippleOrigin;
          float rdist = length(rd) + 0.001;
          float band = exp(-pow(rdist - uRippleT * 26.0, 2.0) * 0.03);
          p += (rd / rdist) * band * uRippleAmp * 4.2;
        }
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = uSize * (0.45 + 0.75 * fract(aSeed * 7.13)) * uPixelRatio * (105.0 / -mv.z);
      }`,
    fragmentShader: `
      uniform float uTime, uAmber, uOpacity, uBright;
      varying float vSeed;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        float a = smoothstep(0.5, 0.06, d) * uBright;
        vec3 cyan = vec3(0.13, 0.83, 0.93);
        vec3 blue = vec3(0.23, 0.51, 0.96);
        vec3 teal = vec3(0.08, 0.72, 0.65);
        vec3 col = mix(blue, cyan, smoothstep(0.15, 0.85, fract(vSeed * 3.71)));
        col = mix(col, teal, step(0.82, fract(vSeed * 5.31)) * 0.65);
        // occasional warm amber accent pulses
        float amberSel = step(0.965, vSeed);
        float pulse = 0.5 + 0.5 * sin(uTime * 3.0 + vSeed * 80.0);
        col = mix(col, vec3(1.0, 0.72, 0.28), amberSel * pulse * uAmber);
        float tw = 0.75 + 0.25 * sin(uTime * (1.5 + vSeed * 3.0) + vSeed * 40.0);
        gl_FragColor = vec4(col * tw, a * uOpacity);
      }`,
  });
  const particles = new Points(geo, particleMaterial);
  group.add(particles);

  /* ---------------- luminous edge lines (network / brain) ---------------- */
  function buildEdgeLines(nodes, k, maxDist, colA, colB) {
    const edges = [], seen = new Set();
    for (let i = 0; i < nodes.length; i++) {
      const ds = nodes.map((n, j) => [j, dist2(nodes[i], n)]).sort((a, b) => a[1] - b[1]);
      for (let c = 1; c <= k && c < ds.length; c++) {
        const j = ds[c][0];
        if (ds[c][1] > maxDist * maxDist) continue;
        const key = i < j ? i + '_' + j : j + '_' + i;
        if (!seen.has(key)) { seen.add(key); edges.push([i, j]); }
      }
    }
    const pos = new Float32Array(edges.length * 6);
    const along = new Float32Array(edges.length * 2);
    const phase = new Float32Array(edges.length * 2);
    edges.forEach((e, n) => {
      pos.set(nodes[e[0]], n * 6); pos.set(nodes[e[1]], n * 6 + 3);
      along[n * 2] = 0; along[n * 2 + 1] = 1;
      const ph = rand(); phase[n * 2] = ph; phase[n * 2 + 1] = ph;
    });
    const g = new BufferGeometry();
    g.setAttribute('position', new BufferAttribute(pos, 3));
    g.setAttribute('aAlong', new BufferAttribute(along, 1));
    g.setAttribute('aPhase', new BufferAttribute(phase, 1));
    const u = { uTime: { value: 0 }, uOpacity: { value: 0 },
                uColA: { value: new Color(colA) }, uColB: { value: new Color(colB) } };
    const m = new ShaderMaterial({
      uniforms: u, transparent: true, depthWrite: false, blending: AdditiveBlending,
      vertexShader: `
        attribute float aAlong; attribute float aPhase;
        varying float vAlong; varying float vPhase;
        void main() {
          vAlong = aAlong; vPhase = aPhase;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,
      fragmentShader: `
        uniform float uTime, uOpacity; uniform vec3 uColA, uColB;
        varying float vAlong; varying float vPhase;
        void main() {
          float p = fract(uTime * 0.32 + vPhase);
          float pulse = smoothstep(0.16, 0.0, abs(vAlong - p));
          vec3 col = mix(uColA, uColB, pulse);
          gl_FragColor = vec4(col, (0.15 + 0.85 * pulse) * uOpacity);
        }`,
    });
    const lines = new LineSegments(g, m);
    lines.userData.u = u;
    return lines;
  }

  const netLines = buildEdgeLines(NET_NODES, 3, 9.5, 0x1a73b8, 0x4de8ff);
  group.add(netLines);

  const brainNodes = [];
  for (let i = 0; i < 90; i++) brainNodes.push(brainPoint());
  const brainLines = buildEdgeLines(brainNodes, 2, 6.5, 0x2a5f9e, 0xffb648); // attention flashes: warm tips
  group.add(brainLines);

  /* ---------------- globe: wireframe, city markers, arcs ---------------- */
  const globeWire = new LineSegments(
    new WireframeGeometry(new SphereGeometry(GLOBE_R * 0.995, 28, 18)),
    new LineBasicMaterial({ color: 0x14486e, transparent: true, opacity: 0,
                            blending: AdditiveBlending, depthWrite: false }));
  group.add(globeWire);

  // ~30 collaborating countries (approx capitals/hubs), Seoul as the lab's hub.
  const CITIES = [
    [37.5, 127.0], /* Seoul */ [-6.2, 106.8], [35.7, 139.7], [39.9, 116.4], [28.6, 77.2],
    [24.7, 46.7], [41.0, 28.9], [55.7, 37.6], [52.5, 13.4], [48.8, 2.3],
    [51.5, -0.1], [40.4, -3.7], [41.9, 12.5], [30.0, 31.2], [6.5, 3.4],
    [-1.3, 36.8], [-26.2, 28.0], [40.7, -74.0], [43.7, -79.4], [19.4, -99.1],
    [-23.5, -46.6], [-34.6, -58.4], [-33.4, -70.6], [-33.9, 151.2], [-36.8, 174.8],
    [3.1, 101.7], [13.8, 100.5], [23.8, 90.4], [35.7, 51.4], [52.2, 21.0], [38.7, -9.1],
  ];
  // Parallel labels surfaced when the cursor hovers a hub during the globe beat.
  const CITY_NAMES = [
    'Seoul', 'Jakarta', 'Tokyo', 'Beijing', 'New Delhi',
    'Riyadh', 'Istanbul', 'Moscow', 'Berlin', 'Paris',
    'London', 'Madrid', 'Rome', 'Cairo', 'Lagos',
    'Nairobi', 'Johannesburg', 'New York', 'Toronto', 'Mexico City',
    'São Paulo', 'Buenos Aires', 'Santiago', 'Sydney', 'Auckland',
    'Kuala Lumpur', 'Bangkok', 'Dhaka', 'Tehran', 'Warsaw', 'Lisbon',
  ];
  const latLng = (lat, lon, r) => {
    const phi = (90 - lat) * Math.PI / 180, th = (lon + 180) * Math.PI / 180;
    return [-r * Math.sin(phi) * Math.cos(th), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(th)];
  };
  const cityGeo = new BufferGeometry();
  cityGeo.setAttribute('position', new BufferAttribute(
    new Float32Array(CITIES.flatMap((c) => latLng(c[0], c[1], GLOBE_R * 1.01))), 3));
  const cityMat = new PointsMaterial({ color: 0xffb45e, size: 0.4, transparent: true,
    opacity: 0, blending: AdditiveBlending, depthWrite: false });
  const cityPts = new Points(cityGeo, cityMat);
  group.add(cityPts);

  // City positions in the globe's local frame (rotated with the group each
  // frame for hover projection), and the per-arc phase so a hovered hub's arc
  // can be singled out and lit.
  const CITY_LOCAL = CITIES.map((c) => latLng(c[0], c[1], GLOBE_R));
  const ARC_PHASE = new Array(CITIES.length).fill(-1);

  const arcs = (() => {
    const SEG = 36, hub = latLng(CITIES[0][0], CITIES[0][1], GLOBE_R);
    const nArcs = CITIES.length - 1;
    const pos = new Float32Array(nArcs * SEG * 6);
    const tAttr = new Float32Array(nArcs * SEG * 2);
    const phase = new Float32Array(nArcs * SEG * 2);
    let w = 0, wt = 0;
    for (let a = 1; a < CITIES.length; a++) {
      const dst = latLng(CITIES[a][0], CITIES[a][1], GLOBE_R);
      const ph = rand();
      ARC_PHASE[a] = ph;
      const mid = norm3(add3(hub, dst));
      const span = Math.acos(clamp(dot3(norm3(hub), norm3(dst)), -1, 1)) / Math.PI;
      const lift = GLOBE_R * (1.12 + 0.85 * span);
      const bez = (t) => { // quadratic bezier hub -> lifted midpoint -> dst
        const q0 = lerp3(hub, mul3(mid, lift), t), q1 = lerp3(mul3(mid, lift), dst, t);
        return lerp3(q0, q1, t);
      };
      for (let s = 0; s < SEG; s++) {
        const t0 = s / SEG, t1 = (s + 1) / SEG;
        pos.set(bez(t0), w); pos.set(bez(t1), w + 3); w += 6;
        tAttr[wt] = t0; phase[wt] = ph; wt++;
        tAttr[wt] = t1; phase[wt] = ph; wt++;
      }
    }
    const g = new BufferGeometry();
    g.setAttribute('position', new BufferAttribute(pos, 3));
    g.setAttribute('aT', new BufferAttribute(tAttr, 1));
    g.setAttribute('aPhase', new BufferAttribute(phase, 1));
    const u = { uTime: { value: 0 }, uOpacity: { value: 0 }, uDraw: { value: 0 },
                uHotPhase: { value: -1 } };
    const m = new ShaderMaterial({
      uniforms: u, transparent: true, depthWrite: false, blending: AdditiveBlending,
      vertexShader: `
        attribute float aT; attribute float aPhase;
        varying float vT; varying float vPhase;
        void main() {
          vT = aT; vPhase = aPhase;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,
      fragmentShader: `
        uniform float uTime, uOpacity, uDraw, uHotPhase;
        varying float vT; varying float vPhase;
        void main() {
          float drawn = 1.0 - smoothstep(uDraw - 0.05, uDraw, vT + vPhase * 0.15 - 0.075);
          float sp = fract(uTime * 0.17 + vPhase);
          float spark = smoothstep(0.055, 0.0, abs(vT - sp));
          vec3 col = mix(vec3(0.2, 0.75, 1.0), vec3(1.0, 0.72, 0.3), step(0.78, fract(vPhase * 5.7)));
          col += spark * 0.9;
          float alpha = (0.3 + 0.7 * spark) * drawn * uOpacity;
          // Hovered hub: brighten and fully draw the one arc that shares its phase.
          float hot = 1.0 - smoothstep(0.0, 0.0025, abs(vPhase - uHotPhase));
          col += hot * vec3(0.5, 0.7, 0.9);
          alpha = max(alpha, hot * 0.9 * uOpacity);
          gl_FragColor = vec4(col, alpha);
        }`,
    });
    const l = new LineSegments(g, m);
    l.userData.u = u;
    return l;
  })();
  group.add(arcs);

  /* ---------------- cursor-forged constellation ---------------- */
  // A small web of light that grows around the pointer when it rests still —
  // ring edges between orbiting nodes plus spokes back to the pointer. Nodes
  // are repositioned on the CPU each frame (cheap: CONST_K is tiny).
  const CONST_K = 12;
  const constSeg = CONST_K * 2;                          // ring + spokes
  const constPos = new Float32Array(constSeg * 6);
  const constGeoLine = new BufferGeometry();
  constGeoLine.setAttribute('position', new BufferAttribute(constPos, 3));
  const constMat = new LineBasicMaterial({ color: 0x7fe9ff, transparent: true, opacity: 0,
                                           blending: AdditiveBlending, depthWrite: false });
  const constellation = new LineSegments(constGeoLine, constMat);
  constellation.frustumCulled = false;
  group.add(constellation);
  const constNode = [];
  for (let k = 0; k < CONST_K; k++) constNode.push(new Vector3());

  /* ---------------- hovered-hub marker (globe beat) ---------------- */
  const hotGeo = new BufferGeometry();
  hotGeo.setAttribute('position', new BufferAttribute(new Float32Array(3), 3));
  const hotMat = new PointsMaterial({ color: 0xfff2cc, size: 1.4, transparent: true,
    opacity: 0, blending: AdditiveBlending, depthWrite: false });
  const hotMarker = new Points(hotGeo, hotMat);
  hotMarker.frustumCulled = false;
  group.add(hotMarker);

  /* ---------------- post-processing ---------------- */
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new Vector2(1280, 720), 0.75, 0.55, 0.28);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());
  const grain = new ShaderPass({
    uniforms: { tDiffuse: { value: null }, uTime: { value: 0 } },
    vertexShader: `
      varying vec2 vUv;
      void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `
      uniform sampler2D tDiffuse; uniform float uTime;
      varying vec2 vUv;
      float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
      void main() {
        vec4 c = texture2D(tDiffuse, vUv);
        float g = (hash(vUv * vec2(1917.0, 1123.0) + fract(uTime) * 7.0) - 0.5) * 0.05; // film grain
        float vig = smoothstep(0.85, 0.32, length(vUv - 0.5));                          // vignette
        c.rgb = c.rgb * (0.66 + 0.34 * vig) + g;
        gl_FragColor = c;
      }`,
  });
  composer.addPass(grain);

  /* ---------------- timeline state machine ---------------- */
  const fxState = { ...FX_DEFAULTS, noise: 1.5 };
  let fxTarget = { ...FX_DEFAULTS, ...PHASES[0].fx };
  let phaseIdx = -1;
  let currentTarget = SHAPES.cloud;
  let started = false, startStamp = 0, seekOffset = 0;
  let uT = 0, lastNow = performance.now();
  let rotationLocked = false;
  // Interaction state: a smoothed pointer in NDC, resolved each frame to a
  // point in the group's local space (where the particle targets live).
  const pointerTarget = { x: 0, y: 0, active: false };
  const pointerNdc = { x: 0, y: 0 };
  let pointerActiveF = 0;
  const pointerLocal = new Vector3();
  const rippleOrigin = new Vector3();
  let rippleT = 5, rippleAmp = 0;
  const _unproj = new Vector3();
  const _proj = new Vector3();
  // Idle "breathing": when the pointer goes quiet, a phantom attractor drifts a
  // slow Lissajous path so the field keeps shimmering invitingly.
  let lastInteractMs = performance.now();
  let autoF = 0;
  // Stillness → cursor constellation strength.
  let constF = 0;
  const prevNdc = { x: 0, y: 0 };
  // Audio-reactive drive (amplitude from the voiceover) + hovered hub state.
  let analyser = null, freqData = null, audioLevel = 0, audioCtx = null;
  let hotCity = -1;
  let audioEl = null;
  let shownCapText = null, shownWordIdx = -1;
  let endedFired = false;
  let disposed = false;
  let rafId = 0;

  function enterPhase(i) {
    phaseIdx = i;
    const ph = PHASES[i];
    posArr.set(currentTarget);                        // bake previous target as morph origin
    geo.attributes.position.needsUpdate = true;
    let target = SHAPES[ph.shape];
    if (ph.shape === 'text') {
      // Freeze the scene rotation and counter-rotate the glyph targets so the
      // wordmark forms upright in world space without snapping other objects.
      rotationLocked = true;
      const ry = group.rotation.y, c = Math.cos(-ry), s = Math.sin(-ry);
      const rt = new Float32Array(target.length);
      for (let n = 0; n < COUNT; n++) {
        const x = target[n * 3], z = target[n * 3 + 2];
        rt[n * 3] = c * x + s * z;
        rt[n * 3 + 1] = target[n * 3 + 1];
        rt[n * 3 + 2] = -s * x + c * z;
      }
      target = rt;
    } else {
      rotationLocked = false;
    }
    currentTarget = target;
    toArr.set(currentTarget);
    geo.attributes.aTo.needsUpdate = true;
    fxTarget = { ...FX_DEFAULTS, ...ph.fx };
    if (onPhase) onPhase(ph.name);
  }

  // Resolve a pointer position (NDC, -1..1) to the group's local space by
  // unprojecting onto the z=0 plane, then undoing the group's spin. The group
  // only ever rotates about Y (no translate/scale), so the inverse is a cheap
  // rotateY(-spin). Particle morph targets live in this same local space.
  function ndcToLocal(nx, ny, out) {
    _unproj.set(nx, ny, 0.5).unproject(camera);
    const dz = _unproj.z - camera.position.z;
    if (Math.abs(dz) < 1e-4) return out;
    const tt = -camera.position.z / dz;
    const wx = camera.position.x + (_unproj.x - camera.position.x) * tt;
    const wy = camera.position.y + (_unproj.y - camera.position.y) * tt;
    const a = -group.rotation.y, c = Math.cos(a), s = Math.sin(a);
    out.set(c * wx, wy, -s * wx);                    // rotateY(-spin) with z=0
    return out;
  }

  const audioActive = () =>
    started && audioEl && audioEl.readyState >= 2 && !audioEl.paused &&
    !audioEl.ended && audioEl.currentTime > 0.001;

  function timelineTime() {
    if (!started) return 0;
    if (audioActive()) return audioEl.currentTime;
    return (performance.now() - startStamp) / 1000 + seekOffset;
  }

  function frame() {
    if (disposed) return;
    rafId = requestAnimationFrame(frame);
    const now = performance.now();
    const dt = Math.min(0.05, (now - lastNow) / 1000);
    lastNow = now;
    uT += dt;

    const rawT = timelineTime();
    const t = Math.min(rawT, INTRO_END);              // visuals hold at the final beat

    if (started && !endedFired && rawT >= INTRO_END + END_HOLD) {
      endedFired = true;
      // Dissolve: let the wordmark drift apart while the overlay fades, so
      // the handoff to the homepage reads as particles dispersing rather
      // than a static frame being faded down.
      fxTarget = { ...fxTarget, noise: 1.0, spin: 0 };
      if (onEnded) onEnded();
    }

    // phase lookup + entry
    let idx = PHASES.length - 1;
    for (let i = 0; i < PHASES.length; i++) if (t < PHASES[i].t[1]) { idx = i; break; }
    if (idx !== phaseIdx) enterPhase(idx);
    const ph = PHASES[idx];

    // caption track: current line + karaoke word index. A small lead keeps the
    // line ahead of the voiceover; words then reveal across the line's window
    // (line-level audio timings, no per-word timestamps needed).
    if (started && onCaption) {
      const ct = t + CAPTION_LEAD;
      let ci = -1;
      for (let i = 0; i < CAPTIONS.length; i++) if (ct >= CAPTIONS[i].at) ci = i;
      if (ci < 0) {
        if (shownCapText !== null) { shownCapText = null; shownWordIdx = -1; onCaption(null, 0); }
      } else {
        const cap = CAPTIONS[ci];
        const end = ci + 1 < CAPTIONS.length ? CAPTIONS[ci + 1].at : INTRO_END;
        const words = cap.text.split(' ');
        const prog = clamp((ct - cap.at) / Math.max(0.001, end - cap.at), 0, 1);
        const wIdx = Math.min(words.length, Math.round(prog * words.length));
        if (cap.text !== shownCapText || wIdx !== shownWordIdx) {
          shownCapText = cap.text; shownWordIdx = wIdx;
          onCaption(cap.text, wIdx, cap.key);
        }
      }
    }

    // eased morph progress for this phase
    uniforms.uMorph.value = easeInOutCubic(clamp((t - ph.t[0]) / ph.morph, 0, 1));

    // damped fx uniforms
    const damp = 1 - Math.exp(-dt * 3.2);
    for (const k in fxState) fxState[k] += (fxTarget[k] - fxState[k]) * damp;
    uniforms.uTime.value = uT;
    uniforms.uNoise.value = fxState.noise;
    uniforms.uSwirl.value = fxState.swirl;
    uniforms.uFlow.value = fxState.flow;
    uniforms.uAmber.value = fxState.amber;
    uniforms.uSize.value = fxState.size;
    // Audio-reactive: the voiceover's amplitude lifts particle brightness and
    // the bloom so the visuals pulse with the narration.
    if (analyser) {
      analyser.getByteFrequencyData(freqData);
      let sum = 0;
      const bins = Math.min(48, freqData.length);      // low-mid band carries speech
      for (let i = 2; i < bins; i++) sum += freqData[i];
      const lvl = sum / ((bins - 2) * 255);
      audioLevel += (lvl - audioLevel) * (1 - Math.exp(-dt * 12));
    } else {
      audioLevel += (0 - audioLevel) * (1 - Math.exp(-dt * 6));
    }
    uniforms.uBright.value = fxState.bright * (1 + audioLevel * 0.7);
    bloom.strength = 0.7 + audioLevel * 0.9;
    uniforms.uOpacity.value = !started
      ? 0.25
      : endedFired
        ? Math.max(0, uniforms.uOpacity.value - dt * 0.45)
        : Math.min(1, uniforms.uOpacity.value + dt * 0.8);

    netLines.userData.u.uTime.value = uT;
    netLines.userData.u.uOpacity.value = fxState.net * 0.85;
    brainLines.userData.u.uTime.value = uT * 2.2;     // fast attention-style flashes
    brainLines.userData.u.uOpacity.value = fxState.brainNet * 0.9;
    globeWire.material.opacity = fxState.globe * 0.16;
    cityMat.opacity = fxState.arcs * 0.9;
    arcs.userData.u.uTime.value = uT;
    arcs.userData.u.uOpacity.value = fxState.arcs;
    arcs.userData.u.uDraw.value +=
      ((fxState.arcs > 0.02 ? 1.15 : 0) - arcs.userData.u.uDraw.value) * (1 - Math.exp(-dt * 1.4));

    // slow scene rotation; frozen once the text formation begins
    if (!rotationLocked) group.rotation.y += fxState.spin * dt;

    // camera: eased dolly across each phase + gentle handheld sway
    const pProg = easeInOutCubic(clamp((t - ph.t[0]) / (ph.t[1] - ph.t[0]), 0, 1));
    const from = ph.cam[0], to = ph.cam[1];
    let cz = from[2] + (to[2] - from[2]) * pProg;
    if (ph.shape === 'text') {                        // keep the wordmark inside narrow viewports
      cz = Math.max(cz, 24.5 / (0.5206 * camera.aspect));
    }
    camera.position.set(
      from[0] + (to[0] - from[0]) * pProg + Math.sin(uT * 0.5) * 0.35,
      from[1] + (to[1] - from[1]) * pProg + Math.sin(uT * 0.4 + 2) * 0.25,
      cz);
    camera.lookAt(0, 0.6, 0);

    // ---- interaction: pointer/tilt parallax + force well + tap ripple ----
    const pk = 1 - Math.exp(-dt * 9);
    pointerNdc.x += (pointerTarget.x - pointerNdc.x) * pk;
    pointerNdc.y += (pointerTarget.y - pointerNdc.y) * pk;
    pointerActiveF += ((pointerTarget.active ? 1 : 0) - pointerActiveF) * (1 - Math.exp(-dt * 6));

    // Idle breathing: after a few quiet seconds, drift a phantom attractor on a
    // slow Lissajous path so the field keeps inviting interaction.
    const wantAuto = started && !pointerTarget.active && now - lastInteractMs > 3500 ? 1 : 0;
    autoF += (wantAuto - autoF) * (1 - Math.exp(-dt * 1.4));
    if (autoF > 0.001) {
      const ax = Math.sin(uT * 0.33) * 0.62;
      const ay = Math.sin(uT * 0.221 + 1.3) * 0.44;
      pointerNdc.x += (ax - pointerNdc.x) * autoF * 0.6;
      pointerNdc.y += (ay - pointerNdc.y) * autoF * 0.6;
    }
    const forceActive = Math.max(pointerActiveF, autoF * 0.7);

    // Depth parallax: nudge the camera toward the pointer, then refresh the
    // world matrix so ndcToLocal / hub projection read this frame's camera.
    camera.position.x += pointerNdc.x * 1.7 * forceActive;
    camera.position.y += pointerNdc.y * 1.15 * forceActive;
    camera.updateMatrixWorld(true);

    ndcToLocal(pointerNdc.x, pointerNdc.y, pointerLocal);
    uniforms.uPointer.value.copy(pointerLocal);
    uniforms.uPointerForce.value = started ? forceActive * fxState.touch : 0;

    rippleT += dt;
    rippleAmp = Math.max(0, rippleAmp - dt * 0.9);
    uniforms.uRippleOrigin.value.copy(rippleOrigin);
    uniforms.uRippleT.value = rippleT;
    uniforms.uRippleAmp.value = started ? rippleAmp : 0;

    // Cursor constellation: grows when the pointer rests still during an
    // interactive beat; fades while moving fast or during the wordmark.
    const vel = Math.hypot(pointerNdc.x - prevNdc.x, pointerNdc.y - prevNdc.y) / Math.max(dt, 0.001);
    prevNdc.x = pointerNdc.x; prevNdc.y = pointerNdc.y;
    const still = forceActive * fxState.touch * clamp(1 - vel * 2.4, 0, 1);
    constF += (still - constF) * (1 - Math.exp(-dt * 3));
    if (constF > 0.01) {
      for (let k = 0; k < CONST_K; k++) {
        const a = (k / CONST_K) * Math.PI * 2 + uT * 0.4;
        const rr = 2.1 + 0.6 * Math.sin(uT * 1.3 + k);
        constNode[k].set(
          pointerLocal.x + Math.cos(a) * rr,
          pointerLocal.y + Math.sin(a) * rr,
          pointerLocal.z + 0.6 * Math.sin(uT + k * 1.7));
      }
      let o = 0;
      for (let k = 0; k < CONST_K; k++) {                 // ring edges
        const n0 = constNode[k], n1 = constNode[(k + 1) % CONST_K];
        constPos[o++] = n0.x; constPos[o++] = n0.y; constPos[o++] = n0.z;
        constPos[o++] = n1.x; constPos[o++] = n1.y; constPos[o++] = n1.z;
      }
      for (let k = 0; k < CONST_K; k++) {                 // spokes to the pointer
        constPos[o++] = pointerLocal.x; constPos[o++] = pointerLocal.y; constPos[o++] = pointerLocal.z;
        constPos[o++] = constNode[k].x; constPos[o++] = constNode[k].y; constPos[o++] = constNode[k].z;
      }
      constGeoLine.attributes.position.needsUpdate = true;
    }
    constMat.opacity = constF * 0.85;

    // Globe hover: light the front-facing hub nearest the cursor and surface
    // its label — turns the passive globe into something explorable.
    let hs = null;
    if (started && fxState.arcs > 0.3 && (pointerTarget.active || autoF > 0.5)) {
      const spin = group.rotation.y, cs = Math.cos(spin), sn = Math.sin(spin);
      let best = -1, bestD = 0.11 * 0.11;                 // screen-space threshold²
      for (let i = 0; i < CITY_LOCAL.length; i++) {
        const cl = CITY_LOCAL[i];
        _proj.set(cs * cl[0] + sn * cl[2], cl[1], -sn * cl[0] + cs * cl[2]).project(camera);
        if (_proj.z > 1) continue;                        // behind camera / clipped
        const dx = _proj.x - pointerNdc.x, dy = _proj.y - pointerNdc.y;
        const d = dx * dx + dy * dy;
        if (d < bestD) {
          bestD = d; best = i;
          hs = { name: CITY_NAMES[i], x: _proj.x * 0.5 + 0.5, y: -_proj.y * 0.5 + 0.5 };
        }
      }
      hotCity = best;
    } else {
      hotCity = -1;
    }
    arcs.userData.u.uHotPhase.value = hotCity > 0 ? ARC_PHASE[hotCity] : -1;
    if (hotCity >= 0) {
      const cl = CITY_LOCAL[hotCity], hp = hotGeo.attributes.position.array;
      hp[0] = cl[0]; hp[1] = cl[1]; hp[2] = cl[2];
      hotGeo.attributes.position.needsUpdate = true;
    }
    hotMat.opacity += (((hotCity >= 0 ? 1 : 0) * fxState.arcs) - hotMat.opacity) * (1 - Math.exp(-dt * 8));
    if (onHotspot) onHotspot(hs);
    if (onProgress) onProgress(Math.min(rawT, INTRO_END), INTRO_END);

    grain.uniforms.uTime.value = uT;
    composer.render();
  }
  frame();

  return {
    start(audio) {
      audioEl = audio || null;
      started = true;
      startStamp = performance.now();
      seekOffset = 0;
      lastInteractMs = performance.now();
      // Entry burst: one shockwave from the centre so the cloud visibly reacts
      // to the "Enter" tap the instant the show begins.
      rippleOrigin.set(0, 0.6, 0);
      rippleT = 0;
      rippleAmp = 1.25;
      // Audio-reactive analyser tapped off the same <audio> element (best
      // effort — some browsers/codecs refuse; the show just runs un-reactive).
      if (audioEl && !analyser) {
        try {
          const Ctx = window.AudioContext || window.webkitAudioContext;
          if (Ctx) {
            audioCtx = new Ctx();
            if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
            const src = audioCtx.createMediaElementSource(audioEl);
            analyser = audioCtx.createAnalyser();
            analyser.fftSize = 128;
            analyser.smoothingTimeConstant = 0.75;
            freqData = new Uint8Array(analyser.frequencyBinCount);
            src.connect(analyser);
            analyser.connect(audioCtx.destination);       // keep the sound audible
          }
        } catch (e) { analyser = null; }
      }
    },
    // Interaction API driven by the React component's pointer/tilt handlers.
    // Coordinates are NDC (-1..1, y up). `active` false lets the force relax.
    setPointer(nx, ny, active) {
      pointerTarget.x = nx;
      pointerTarget.y = ny;
      pointerTarget.active = active !== false;
      lastInteractMs = performance.now();
    },
    // One-shot shockwave from a click/tap; also snaps the pointer there so the
    // ripple originates under the finger even on first touch.
    pulse(nx, ny) {
      if (typeof nx === 'number') {
        pointerTarget.x = nx;
        pointerTarget.y = ny;
        pointerTarget.active = true;
      }
      ndcToLocal(pointerTarget.x, pointerTarget.y, rippleOrigin);
      rippleT = 0;
      rippleAmp = 1;
      lastInteractMs = performance.now();
    },
    // Debug/tuning hook: jump the show to t seconds.
    seek(t) {
      seekOffset = t;
      startStamp = performance.now();
      if (audioEl && audioEl.readyState >= 2) {
        try { audioEl.currentTime = t; } catch (e) { /* not seekable yet */ }
      }
      rotationLocked = false;
      endedFired = rawSeekPastEnd(t);
      phaseIdx = -1;                                  // force phase re-entry
    },
    resize(width, height, dpr) {
      renderer.setPixelRatio(dpr);
      renderer.setSize(width, height, false);
      composer.setSize(width, height);
      camera.aspect = width / Math.max(1, height);
      camera.updateProjectionMatrix();
      uniforms.uPixelRatio.value = dpr;
    },
    dispose() {
      disposed = true;
      cancelAnimationFrame(rafId);
      if (audioCtx) {
        try { audioCtx.close(); } catch (e) { /* already closed */ }
        audioCtx = null; analyser = null;
      }
      scene.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) obj.material.dispose();
      });
      composer.dispose();
      renderer.dispose();
    },
  };

  function rawSeekPastEnd(t) {
    return t >= INTRO_END + END_HOLD;
  }
}

/* ---------------- final shape sampling (logo mark + wordmark) ---------------- */
// `greeting` (from a ?to= share param) adds a personalized "Welcome, <name>"
// line sampled into the same particle text pool.
function sampleFinalShape(count, logoImg, greeting) {
  const W = 2048;
  const greetText =
    typeof greeting === 'string' && greeting.trim() ? `Welcome, ${greeting.trim().slice(0, 24)}` : null;
  const H = logoImg ? (greetText ? 1200 : 1100) : (greetText ? 440 : 320);
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d');
  // Transparent background; sampling reads the alpha channel so the logo's
  // own colors don't matter.
  g.fillStyle = '#fff';
  g.textAlign = 'center'; g.textBaseline = 'middle';
  const WORDMARK_FONT = '700 138px Inter, "Segoe UI", Arial, sans-serif';
  const GREET_FONT = '500 78px Inter, "Segoe UI", Arial, sans-serif';
  let logoSplit = 0;                    // canvas y separating logo from text
  if (logoImg) {
    const L = 560;
    g.drawImage(logoImg, W / 2 - L / 2, 40, L, L);
    g.font = WORDMARK_FONT;
    g.fillText('Applied INtelligence Lab', W / 2, 900, W - 96);
    if (greetText) { g.font = GREET_FONT; g.fillText(greetText, W / 2, 1075, W - 220); }
    logoSplit = 700;
  } else {
    g.font = WORDMARK_FONT;
    g.fillText('Applied INtelligence Lab', W / 2, greetText ? 150 : H / 2, W - 96);
    if (greetText) { g.font = GREET_FONT; g.fillText(greetText, W / 2, 320, W - 220); }
  }
  const data = g.getImageData(0, 0, W, H).data;
  const logoPts = [], textPts = [];
  // The favicon is a solid dark-blue disc with a white "A" (flame knocked
  // out). Bright pixels give the A-mark; the disc's extents are tracked so
  // its outline can be re-added as a sparse ring of particles.
  let dMinX = Infinity, dMaxX = -Infinity, dMinY = Infinity, dMaxY = -Infinity;
  for (let y = 0; y < H; y += 2) {
    for (let x = 0; x < W; x += 2) {
      const o = (y * W + x) * 4;
      if (data[o + 3] <= 120) continue;
      if (data[o] > 180) {
        (y < logoSplit ? logoPts : textPts).push([x, y]);
      } else if (y < logoSplit) {
        if (x < dMinX) dMinX = x;
        if (x > dMaxX) dMaxX = x;
        if (y < dMinY) dMinY = y;
        if (y > dMaxY) dMaxY = y;
      }
    }
  }
  if (dMaxX > dMinX) {
    const cx = (dMinX + dMaxX) / 2, cy = (dMinY + dMaxY) / 2;
    const radius = (dMaxX - dMinX + dMaxY - dMinY) / 4;
    for (let k = 0; k < 1400; k++) {
      const a = (k / 1400) * Math.PI * 2;
      const rr = radius + (Math.random() - 0.5) * 9;
      logoPts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
    }
  }
  // Fixed particle budget per region so the thin wordmark stays dense and
  // legible next to the much larger logo mark.
  const logoShare = logoPts.length && textPts.length ? 0.55 : logoPts.length ? 1 : 0;
  const arr = new Float32Array(count * 3);
  const scale = 46 / W;
  for (let i = 0; i < count; i++) {
    const pool = i < count * logoShare ? logoPts : textPts;
    const p = pool[(Math.random() * pool.length) | 0];
    arr[i * 3] = (p[0] - W / 2) * scale + (Math.random() - 0.5) * 0.14;
    arr[i * 3 + 1] = -(p[1] - H / 2) * scale + (Math.random() - 0.5) * 0.14 + 1.2;
    arr[i * 3 + 2] = (Math.random() - 0.5) * 0.35;
  }
  return arr;
}

/* ---------------- tiny math helpers ---------------- */
function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
function easeInOutCubic(x) { return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; }
function dist2(a, b) { return (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2; }
function add3(a, b) { return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]; }
function mul3(a, s) { return [a[0] * s, a[1] * s, a[2] * s]; }
function dot3(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
function norm3(a) { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; }
function lerp3(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }
function rotX(p, a) { const c = Math.cos(a), s = Math.sin(a); return [p[0], c * p[1] - s * p[2], s * p[1] + c * p[2]]; }
function rotY(p, a) { const c = Math.cos(a), s = Math.sin(a); return [c * p[0] + s * p[2], p[1], -s * p[0] + c * p[2]]; }
