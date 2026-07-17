/**
 * Procedural "blue fire" shader for the flame cutout inside the logo's "A".
 * No textures/assets — a small hand-written value-noise FBM drives a slow
 * upward-licking flicker through a blue-fire color ramp (deep royal blue →
 * electric blue → ice-white core). The blue fire is the spirit of the lab —
 * it should read as alive and igniting, not decorative: a visible core with
 * soft tongues rising off it.
 *
 * uIgnite drives the one-shot ignition burst during the first-visit intro:
 * it briefly whites out the core, expands the glow radius, and boosts alpha,
 * then eases back to the steady burn.
 */

const VERTEX_SHADER = /* glsl */ `
  varying vec2 vLocalPos;
  void main() {
    vLocalPos = position.xy;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FRAGMENT_SHADER = /* glsl */ `
  varying vec2 vLocalPos;
  uniform float uTime;
  uniform float uIntensity;
  uniform float uIgnite;
  uniform vec3 uColorDeep;
  uniform vec3 uColorMid;
  uniform vec3 uColorCore;
  uniform vec2 uFlameCenter;
  uniform float uFlameRadius;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float valueNoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
  }

  float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    for (int i = 0; i < 3; i++) {
      value += amplitude * valueNoise(p);
      p *= 2.02;
      amplitude *= 0.5;
    }
    return value;
  }

  void main() {
    vec2 p = vLocalPos * 3.1;
    // Two upward-scrolling noise layers at different speeds read as rising
    // tongues of flame rather than a static shimmer.
    float flicker = fbm(p + vec2(0.0, -uTime * 0.45)) * 0.6;
    flicker += fbm(p * 1.7 + vec2(uTime * 0.09, -uTime * 0.8)) * 0.4;

    float radius = uFlameRadius * (1.0 + uIgnite * 0.55);
    float dist = distance(vLocalPos, uFlameCenter) / radius;
    float radial = smoothstep(1.05, 0.0, dist);

    float glow = radial * (0.55 + 0.6 * flicker);
    vec3 color = mix(uColorDeep, uColorMid, smoothstep(0.08, 0.42, glow));
    color = mix(color, uColorCore, smoothstep(0.48, 0.85, glow));

    // Ignition burst: white-hot core flash + overall brightening.
    color = mix(color, vec3(0.92, 0.98, 1.0), uIgnite * radial * 0.85);

    float alpha = glow * uIntensity * (1.0 + uIgnite * 1.6);
    gl_FragColor = vec4(color, alpha);
  }
`;

// Approximate centroid/extent of the flame path (see logoGeometry.js), used
// only for the soft radial falloff mask.
const FLAME_CENTER = [0.015, 0.356];
const FLAME_RADIUS = 0.46;

export function createFireMaterial(THREE) {
  return new THREE.ShaderMaterial({
    vertexShader: VERTEX_SHADER,
    fragmentShader: FRAGMENT_SHADER,
    uniforms: {
      uTime: { value: 0 },
      uIntensity: { value: 1.35 },
      uIgnite: { value: 0 },
      uColorDeep: { value: new THREE.Color('#0d3d8f') },
      uColorMid: { value: new THREE.Color('#3f9df0') },
      uColorCore: { value: new THREE.Color('#e6f7ff') },
      uFlameCenter: { value: new THREE.Vector2(FLAME_CENTER[0], FLAME_CENTER[1]) },
      uFlameRadius: { value: FLAME_RADIUS },
    },
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
  });
}
