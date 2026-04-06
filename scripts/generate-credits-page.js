/**
 * Auto-generate credits data from package.json + package-lock.json at build time.
 *
 * Output: src/data/credits.json
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PKG = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf-8'));
const LOCK_PATH = path.join(ROOT, 'package-lock.json');
const OUT = path.join(ROOT, 'src', 'data', 'credits.json');

/* ------------------------------------------------------------------ */
/*  helpers                                                            */
/* ------------------------------------------------------------------ */

function readLock() {
  if (!fs.existsSync(LOCK_PATH)) return null;
  return JSON.parse(fs.readFileSync(LOCK_PATH, 'utf-8'));
}

/** Resolve the *installed* version of a direct dep from the lock file */
function resolvedVersion(lock, name) {
  if (!lock) return '—';
  // npm v3 lockfileVersion >= 2 stores packages under `packages`
  const packages = lock.packages || {};
  const key = `node_modules/${name}`;
  if (packages[key]) return packages[key].version || '—';
  // fallback: npm v1 lock
  const deps = (lock.dependencies || {})[name];
  return deps ? deps.version || '—' : '—';
}

/** Collect every transitive package from the lock file */
function transitivePackages(lock) {
  if (!lock || !lock.packages) return [];
  const list = [];
  for (const [key, meta] of Object.entries(lock.packages)) {
    if (!key || key === '') continue; // root entry
    const name = key.replace(/^node_modules\//, '');
    list.push({
      name,
      version: meta.version || '—',
      license: meta.license || 'See package source',
    });
  }
  list.sort((a, b) => a.name.localeCompare(b.name));
  return list;
}

/** Build a licence-type → count map */
function licenseSummary(allPkgs) {
  const map = {};
  for (const p of allPkgs) {
    const lic = p.license || 'See package source';
    map[lic] = (map[lic] || 0) + 1;
  }
  return Object.entries(map).sort((a, b) => b[1] - a[1]);
}

/* ------------------------------------------------------------------ */
/*  main                                                               */
/* ------------------------------------------------------------------ */

const lock = readLock();
const today = new Date().toISOString().slice(0, 10);

const runtimeDeps = Object.keys(PKG.dependencies || {}).map((name) => {
  const ver = resolvedVersion(lock, name);
  const all = transitivePackages(lock);
  const lic = all.find((p) => p.name === name)?.license || 'MIT';
  return { name, version: ver, license: lic };
});

const devDeps = Object.keys(PKG.devDependencies || {}).map((name) => {
  const ver = resolvedVersion(lock, name);
  const all = transitivePackages(lock);
  const lic = all.find((p) => p.name === name)?.license || 'MIT';
  return { name, version: ver, license: lic };
});

const allTransitive = transitivePackages(lock);
const allLicences = licenseSummary(allTransitive);

const data = {
  generated: today,
  runtimeCount: runtimeDeps.length,
  devCount: devDeps.length,
  transitiveCount: allTransitive.length,
  licenseSummary: allLicences.map(([license, count]) => ({ license, count })),
  runtimeDeps,
  devDeps,
  transitiveDeps: allTransitive,
};

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(data, null, 2), 'utf-8');
console.log(`[credits] Generated ${OUT} — ${runtimeDeps.length} runtime, ${devDeps.length} dev, ${allTransitive.length} transitive packages.`);
