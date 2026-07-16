/**
 * Flattened AINTLab brand-mark coordinates, normalized to a unit space where
 * the disc is a circle of radius 1 centered at the origin (three.js Y-up).
 *
 * Source: static/img/research.svg / static/img/favicon.svg
 *   circle: cx=100.749 cy=199.132 r=31.371 (in the "object-0" group's local frame)
 *   "A" polygon + flame path: children of a nested group with transform
 *     matrix(1.091433, 0, 0, 1.091433, 46.178132, 144.561757) relative to that
 *     same "object-0" frame.
 * Every point below is (SVG point through the nested transform, minus the
 * circle center, divided by the radius, with Y negated for Y-up).
 */

// 8-point "A" glyph outline (closed polygon).
export const A_POINTS = [
  [-0.2087, 0.8945],
  [-0.6958, -0.6959],
  [-0.2783, -0.6959],
  [-0.0696, -0.1392],
  [0.0696, -0.1392],
  [0.2784, -0.6959],
  [0.6958, -0.6959],
  [0.2088, 0.8945],
];

// Flame cutout: two cubic Béziers from the same source path, closed loop.
export const FLAME_PATH = {
  start: [-0.0113, 0.7729],
  curves: [
    { c1: [-0.4516, 0.2340], c2: [0.0567, 0.4406], end: [-0.0239, -0.1215] },
    { c1: [0.3235, 0.3421], c2: [0.1976, 0.4701], end: [-0.0113, 0.7729] },
  ],
};

function tracePolygon(shape, points) {
  shape.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i += 1) {
    shape.lineTo(points[i][0], points[i][1]);
  }
  shape.closePath();
}

function traceFlame(path) {
  path.moveTo(FLAME_PATH.start[0], FLAME_PATH.start[1]);
  FLAME_PATH.curves.forEach(({ c1, c2, end }) => {
    path.bezierCurveTo(c1[0], c1[1], c2[0], c2[1], end[0], end[1]);
  });
}

export function buildCircleShape(THREE) {
  const shape = new THREE.Shape();
  shape.absarc(0, 0, 1, 0, Math.PI * 2, false);
  return shape;
}

export function buildFlameShape(THREE) {
  const shape = new THREE.Shape();
  traceFlame(shape);
  return shape;
}

export function buildAShapeWithFlameHole(THREE) {
  const shape = new THREE.Shape();
  tracePolygon(shape, A_POINTS);
  const hole = new THREE.Path();
  traceFlame(hole);
  shape.holes.push(hole);
  return shape;
}
