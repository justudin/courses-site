/**
 * "Knowledge network" ambient scene: a drifting point cloud with a
 * once-computed nearest-neighbor line set. Edge topology is never
 * recomputed per frame — drift, cursor repulsion/glow, and the click-ripple
 * pulse are all driven entirely by a handful of uniforms in GPU shaders, so
 * per-frame CPU cost stays a fixed handful of uniform writes regardless of
 * particle count.
 */

const DRIFT_GLSL = /* glsl */ `
  vec3 drift(vec3 base, float phase, float speed, float time) {
    float t = time * speed + phase;
    return base + vec3(
      sin(t) * 0.18,
      cos(t * 0.85) * 0.15,
      sin(t * 0.6 + 1.3) * 0.12
    );
  }
`;

// Shared by both points and lines: pushes a drifted position away from the
// cursor's projected world position (uMouseStrength eases 0->1 on enter/leave
// so the field never "snaps"), and returns a 0..1 proximity value the caller
// uses to brighten/enlarge whatever is near the cursor.
const MOUSE_GLSL = /* glsl */ `
  uniform vec3 uMouse;
  uniform float uMouseStrength;

  vec3 repel(vec3 pos, out float proximity) {
    vec3 toPoint = pos - uMouse;
    float dist = length(toPoint);
    proximity = smoothstep(1.7, 0.0, dist) * uMouseStrength;
    vec3 pushDir = toPoint / max(dist, 0.0001);
    return pos + pushDir * proximity * 0.65;
  }
`;

// Shared: an expanding ring of brightness travelling outward from the last
// click/tap point. uClickTime is set to a large negative sentinel when idle
// so this contributes ~0 without needing a branch.
const RIPPLE_GLSL = /* glsl */ `
  uniform vec3 uClickPos;
  uniform float uClickTime;
  uniform float uTime;

  float ripple(vec3 pos) {
    float dt = uTime - uClickTime;
    float fade = smoothstep(1.6, 0.0, dt);
    float ringRadius = dt * 2.4;
    float distToClick = length(pos - uClickPos);
    return smoothstep(0.55, 0.0, abs(distToClick - ringRadius)) * fade;
  }
`;

const POINTS_VERTEX = /* glsl */ `
  attribute float aPhase;
  attribute float aSpeed;
  uniform float uTime;
  uniform float uSize;
  varying float vAlpha;
  varying float vProximity;

  ${DRIFT_GLSL}
  ${MOUSE_GLSL}
  ${RIPPLE_GLSL}

  void main() {
    vec3 pos = drift(position, aPhase, aSpeed, uTime);
    float proximity;
    pos = repel(pos, proximity);
    vProximity = proximity;
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = uSize * (1.0 + proximity * 1.6) * (300.0 / max(-mvPosition.z, 0.001));
    gl_Position = projectionMatrix * mvPosition;
    float twinkle = 0.5 + 0.5 * sin(uTime * aSpeed * 1.3 + aPhase * 2.0);
    vAlpha = twinkle + ripple(pos) * 0.8;
  }
`;

const POINTS_FRAGMENT = /* glsl */ `
  uniform vec3 uColor;
  varying float vAlpha;
  varying float vProximity;
  void main() {
    vec2 c = gl_PointCoord - vec2(0.5);
    float d = length(c);
    float mask = smoothstep(0.5, 0.0, d);
    vec3 color = mix(uColor, vec3(1.0), vProximity * 0.5);
    gl_FragColor = vec4(color, vAlpha * mask * (0.75 + vProximity * 0.5));
  }
`;

const LINE_VERTEX = /* glsl */ `
  attribute float aPhase;
  attribute float aSpeed;
  attribute float aEdgePhase;
  uniform float uTime;
  varying float vAlpha;
  varying float vProximity;

  ${DRIFT_GLSL}
  ${MOUSE_GLSL}
  ${RIPPLE_GLSL}

  void main() {
    vec3 pos = drift(position, aPhase, aSpeed, uTime);
    float proximity;
    pos = repel(pos, proximity);
    vProximity = proximity;
    float pulse = sin(uTime * 0.16 + aEdgePhase) * 0.5 + 0.5;
    vAlpha = pulse * 0.32 + proximity * 0.55 + ripple(pos) * 0.6;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const LINE_FRAGMENT = /* glsl */ `
  uniform vec3 uColor;
  varying float vAlpha;
  varying float vProximity;
  void main() {
    vec3 color = mix(uColor, vec3(1.0), vProximity * 0.5);
    gl_FragColor = vec4(color, vAlpha);
  }
`;

export function createParticleNetwork(THREE, { count = 70, color = '#5ea4ef', neighborsPerPoint = 2 } = {}) {
  const group = new THREE.Group();

  if (count <= 0) {
    return {
      group,
      update() {},
      setColor() {},
      setMouse() {},
      pulse() {},
      dispose() {},
    };
  }

  const boundsX = 4.4;
  const boundsY = 2.5;
  const boundsZMin = -3.4;
  const boundsZMax = -1.0;

  const anchors = [];
  const positions = new Float32Array(count * 3);
  const phases = new Float32Array(count);
  const speeds = new Float32Array(count);

  for (let i = 0; i < count; i += 1) {
    const x = (Math.random() * 2 - 1) * boundsX;
    const y = (Math.random() * 2 - 1) * boundsY;
    const z = boundsZMin + Math.random() * (boundsZMax - boundsZMin);
    anchors.push([x, y, z]);
    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;
    phases[i] = Math.random() * Math.PI * 2;
    speeds[i] = 0.22 + Math.random() * 0.3;
  }

  const pointsGeometry = new THREE.BufferGeometry();
  pointsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  pointsGeometry.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
  pointsGeometry.setAttribute('aSpeed', new THREE.BufferAttribute(speeds, 1));

  const colorObj = new THREE.Color(color);
  const mouseUniform = { value: new THREE.Vector3(0, 0, -2.2) };
  const mouseStrengthUniform = { value: 0 };
  const clickPosUniform = { value: new THREE.Vector3(0, 0, -2.2) };
  const clickTimeUniform = { value: -1000 };

  const sharedUniforms = {
    uMouse: mouseUniform,
    uMouseStrength: mouseStrengthUniform,
    uClickPos: clickPosUniform,
    uClickTime: clickTimeUniform,
  };

  const pointsMaterial = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uColor: { value: colorObj },
      uSize: { value: 5.5 },
      ...sharedUniforms,
    },
    vertexShader: POINTS_VERTEX,
    fragmentShader: POINTS_FRAGMENT,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const points = new THREE.Points(pointsGeometry, pointsMaterial);

  // Nearest-neighbor edges, computed once (O(n^2) over a small point count).
  const edgeSet = new Set();
  for (let i = 0; i < count; i += 1) {
    const distances = [];
    for (let j = 0; j < count; j += 1) {
      if (i === j) continue;
      const dx = anchors[i][0] - anchors[j][0];
      const dy = anchors[i][1] - anchors[j][1];
      const dz = anchors[i][2] - anchors[j][2];
      distances.push([j, dx * dx + dy * dy + dz * dz]);
    }
    distances.sort((a, b) => a[1] - b[1]);
    for (let k = 0; k < neighborsPerPoint && k < distances.length; k += 1) {
      const j = distances[k][0];
      const key = i < j ? `${i}_${j}` : `${j}_${i}`;
      edgeSet.add(key);
    }
  }

  const edgeCount = edgeSet.size;
  const linePositions = new Float32Array(edgeCount * 2 * 3);
  const linePhases = new Float32Array(edgeCount * 2);
  const lineSpeeds = new Float32Array(edgeCount * 2);
  const lineEdgePhase = new Float32Array(edgeCount * 2);

  let v = 0;
  edgeSet.forEach((key) => {
    const [iStr, jStr] = key.split('_');
    const edgePhase = Math.random() * Math.PI * 2;
    [Number(iStr), Number(jStr)].forEach((idx) => {
      const base = v * 3;
      linePositions[base] = anchors[idx][0];
      linePositions[base + 1] = anchors[idx][1];
      linePositions[base + 2] = anchors[idx][2];
      linePhases[v] = phases[idx];
      lineSpeeds[v] = speeds[idx];
      lineEdgePhase[v] = edgePhase;
      v += 1;
    });
  });

  const lineGeometry = new THREE.BufferGeometry();
  lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
  lineGeometry.setAttribute('aPhase', new THREE.BufferAttribute(linePhases, 1));
  lineGeometry.setAttribute('aSpeed', new THREE.BufferAttribute(lineSpeeds, 1));
  lineGeometry.setAttribute('aEdgePhase', new THREE.BufferAttribute(lineEdgePhase, 1));

  const lineMaterial = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uColor: { value: colorObj },
      ...sharedUniforms,
    },
    vertexShader: LINE_VERTEX,
    fragmentShader: LINE_FRAGMENT,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const lines = new THREE.LineSegments(lineGeometry, lineMaterial);

  group.add(points);
  group.add(lines);

  // mouseActiveTarget/worldPoint are set instantly by setMouse() (called from
  // a pointermove handler); the actual eased uMouseStrength value is advanced
  // once per frame in update() so the field fades in/out smoothly regardless
  // of how often the pointer event fires.
  let mouseActiveTarget = 0;

  function update(t) {
    pointsMaterial.uniforms.uTime.value = t;
    lineMaterial.uniforms.uTime.value = t;
    mouseStrengthUniform.value += (mouseActiveTarget - mouseStrengthUniform.value) * 0.12;
  }

  function setColor(nextColor) {
    colorObj.set(nextColor);
  }

  // worldPoint: THREE.Vector3 | null (null while just updating "active" state,
  // e.g. on pointerleave, without a fresh position).
  function setMouse(worldPoint, active) {
    if (worldPoint) {
      mouseUniform.value.copy(worldPoint);
    }
    mouseActiveTarget = active ? 1 : 0;
  }

  function pulse(worldPoint, atTime) {
    clickPosUniform.value.copy(worldPoint);
    clickTimeUniform.value = atTime;
  }

  function dispose() {
    pointsGeometry.dispose();
    pointsMaterial.dispose();
    lineGeometry.dispose();
    lineMaterial.dispose();
  }

  return { group, update, setColor, setMouse, pulse, dispose };
}
