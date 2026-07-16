/**
 * Procedural "ember glow" shader for the flame cutout inside the logo's "A".
 * No textures/assets — a small hand-written value-noise FBM drives a slow,
 * low-key flicker through a warm ember color ramp. Tuned deliberately
 * restrained (low max alpha, slow scroll speed) per the "subtle ember, not a
 * cartoon flame" brief.
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
    float flicker = fbm(p + vec2(0.0, -uTime * 0.32)) * 0.6;
    flicker += fbm(p * 1.7 + vec2(uTime * 0.09, -uTime * 0.55)) * 0.4;

    float dist = distance(vLocalPos, uFlameCenter) / uFlameRadius;
    float radial = smoothstep(1.05, 0.0, dist);

    float glow = radial * (0.4 + 0.6 * flicker);
    vec3 color = mix(uColorDeep, uColorMid, smoothstep(0.12, 0.55, glow));
    color = mix(color, uColorCore, smoothstep(0.62, 0.95, glow));

    float alpha = glow * uIntensity;
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
      uIntensity: { value: 0.55 },
      uColorDeep: { value: new THREE.Color('#5c1f10') },
      uColorMid: { value: new THREE.Color('#e07a35') },
      uColorCore: { value: new THREE.Color('#ffdf9e') },
      uFlameCenter: { value: new THREE.Vector2(FLAME_CENTER[0], FLAME_CENTER[1]) },
      uFlameRadius: { value: FLAME_RADIUS },
    },
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
  });
}
