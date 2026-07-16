/**
 * Four small orbiting glass/wire shapes around the logo, each a light visual
 * nod to a facet of the lab's work — not labeled, just texture/atmosphere:
 *   - icosahedron  -> a neural/graph node (AI)
 *   - torus        -> a data loop/cycle (data science)
 *   - octahedron   -> a faceted "gem" standing in for open-ended exploration
 *                     (the "playground" idea)
 *   - box          -> a structured record/cell (informatics)
 * Each orbits the origin on its own tilted ellipse so they read as a loose
 * orbiting cluster rather than a mechanical ring. Hover brightens/enlarges
 * whichever one the cursor is over — the only per-object cost is a single
 * raycast against these 4 meshes, run once per frame while the pointer is
 * over the hero.
 */

const BASE_COLOR = '#5ea4ef';
const HOVER_COLOR = '#ffffff';

function makeIcon(THREE, geometry, { radius, speed, phase, tilt, scale }) {
  const material = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(BASE_COLOR),
    transparent: true,
    opacity: 0.55,
    metalness: 0.2,
    roughness: 0.25,
    clearcoat: 0.4,
    emissive: new THREE.Color(BASE_COLOR),
    emissiveIntensity: 0.18,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.scale.setScalar(scale);

  const wireMaterial = new THREE.MeshBasicMaterial({
    color: new THREE.Color('#eaf3ff'),
    wireframe: true,
    transparent: true,
    opacity: 0.35,
  });
  const wireMesh = new THREE.Mesh(geometry, wireMaterial);
  wireMesh.scale.setScalar(scale * 1.04);
  mesh.add(wireMesh);

  return {
    mesh,
    material,
    baseScale: scale,
    radius,
    speed,
    phase,
    tilt,
    hoverCurrent: 0,
    hoverTarget: 0,
  };
}

export function createConceptIcons(THREE) {
  const group = new THREE.Group();

  const icons = [
    makeIcon(THREE, new THREE.IcosahedronGeometry(0.15, 0), {
      radius: 2.05, speed: 0.22, phase: 0, tilt: 0.35, scale: 1,
    }),
    makeIcon(THREE, new THREE.TorusGeometry(0.12, 0.045, 10, 26), {
      radius: 2.3, speed: -0.17, phase: 2.1, tilt: -0.5, scale: 1,
    }),
    makeIcon(THREE, new THREE.OctahedronGeometry(0.16, 0), {
      radius: 1.9, speed: 0.19, phase: 4.2, tilt: 0.65, scale: 1,
    }),
    makeIcon(THREE, new THREE.BoxGeometry(0.19, 0.19, 0.19), {
      radius: 2.15, speed: -0.24, phase: 1.1, tilt: -0.25, scale: 1,
    }),
  ];

  icons.forEach((icon) => group.add(icon.mesh));

  const raycaster = new THREE.Raycaster();
  const meshes = icons.map((icon) => icon.mesh);

  function update(t, camera, pointerNdc) {
    icons.forEach((icon) => {
      const angle = t * icon.speed + icon.phase;
      const x = Math.cos(angle) * icon.radius;
      const zBase = Math.sin(angle) * icon.radius * 0.4 - 2.0;
      const y = Math.sin(angle * 0.9 + icon.phase) * icon.tilt;
      icon.mesh.position.set(x, y, zBase);
      icon.mesh.rotation.x += 0.006;
      icon.mesh.rotation.y += 0.008;
    });

    if (pointerNdc) {
      raycaster.setFromCamera(pointerNdc, camera);
      const hits = raycaster.intersectObjects(meshes, false);
      const hitMesh = hits.length > 0 ? hits[0].object : null;
      icons.forEach((icon) => {
        icon.hoverTarget = icon.mesh === hitMesh ? 1 : 0;
      });
    } else {
      icons.forEach((icon) => {
        icon.hoverTarget = 0;
      });
    }

    icons.forEach((icon) => {
      icon.hoverCurrent += (icon.hoverTarget - icon.hoverCurrent) * 0.15;
      const s = icon.baseScale * (1 + icon.hoverCurrent * 0.4);
      icon.mesh.scale.setScalar(s);
      icon.material.emissiveIntensity = 0.18 + icon.hoverCurrent * 0.6;
      icon.material.opacity = 0.55 + icon.hoverCurrent * 0.35;
      icon.material.color.set(icon.hoverCurrent > 0.02 ? HOVER_COLOR : BASE_COLOR);
    });
  }

  function setColor(nextColor) {
    icons.forEach((icon) => {
      if (icon.hoverCurrent <= 0.02) {
        icon.material.color.set(nextColor);
      }
      icon.material.emissive.set(nextColor);
    });
  }

  function dispose() {
    icons.forEach((icon) => {
      icon.mesh.geometry.dispose();
      icon.material.dispose();
      icon.mesh.children.forEach((child) => {
        child.material.dispose();
      });
    });
  }

  return { group, update, setColor, dispose };
}
