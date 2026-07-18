/**
 * Generate a themed credits page with open-source dependency licenses.
 *
 * Run manually:
 *   node scripts/generate-credits-page.js
 */

const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const packageJsonPath = path.join(rootDir, 'package.json');
const packageLockPath = path.join(rootDir, 'package-lock.json');
const outputPath = path.join(rootDir, 'src', 'pages', 'credits.mdx');
const gratitudeConfigPath = path.join(rootDir, 'src', 'data', 'gratitude.json');

const DEFAULT_GRATITUDE = {
  collaborators: [
    'Lab members, alumni, and visiting researchers',
    'Academic and industry partners supporting collaborative projects',
    'Students and community members who provide feedback and testing',
  ],
  communities: [
    'Docusaurus maintainers and contributors',
    'React and MDX communities',
    'Open-source maintainers across the JavaScript ecosystem',
  ],
};

function readJson(filePath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function escapeCell(value) {
  return String(value ?? '')
    .replace(/\|/g, '\\|')
    .replace(/\r?\n/g, ' ')
    .trim();
}

function makeMarkdownTable(rows) {
  if (!rows.length) {
    return '_No packages found._';
  }

  const header = '| Package | Version | License | Source |';
  const separator = '| --- | --- | --- | --- |';
  const body = rows
    .map((row) => {
      const pkg = escapeCell(row.name);
      const version = escapeCell(row.version || 'Unknown');
      const license = escapeCell(row.license || 'Unknown');
      const source = `[npm](https://www.npmjs.com/package/${encodeURIComponent(row.name)})`;
      return `| ${pkg} | ${version} | ${license} | ${source} |`;
    })
    .join('\n');

  return [header, separator, body].join('\n');
}

function makeLicenseSummaryTable(rows) {
  if (!rows.length) {
    return '_No package license data found._';
  }

  const grouped = rows.reduce((acc, row) => {
    const key = row.license || 'Unknown';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const sorted = Object.entries(grouped).sort((a, b) => {
    if (b[1] !== a[1]) {
      return b[1] - a[1];
    }
    return a[0].localeCompare(b[0]);
  });

  const header = '| License | Package count |';
  const separator = '| --- | ---: |';
  const body = sorted
    .map(([license, count]) => `| ${escapeCell(license)} | ${count} |`)
    .join('\n');

  return [header, separator, body].join('\n');
}

function getDirectPackages(packageJson, sectionName) {
  const section = packageJson[sectionName] || {};
  return Object.entries(section)
    .map(([name, range]) => ({
      name,
      range,
      section: sectionName,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function getLockMetadata(lockData, packageName) {
  if (!lockData) {
    return null;
  }

  // npm lockfile v2/v3 keeps package entries under packages[node_modules/<name>]
  if (lockData.packages) {
    const entry = lockData.packages[`node_modules/${packageName}`];
    if (entry) {
      return {
        version: entry.version,
        license: entry.license,
      };
    }
  }

  // npm lockfile v1 keeps top-level dependencies map
  if (lockData.dependencies && lockData.dependencies[packageName]) {
    const entry = lockData.dependencies[packageName];
    return {
      version: entry.version,
      license: entry.license,
    };
  }

  return null;
}

function combineRows(packageJson, lockData) {
  const deps = getDirectPackages(packageJson, 'dependencies').map((pkg) => {
    const lockMeta = getLockMetadata(lockData, pkg.name);
    return {
      name: pkg.name,
      version: lockMeta?.version || pkg.range,
      license: lockMeta?.license || 'See package source',
      section: 'Runtime dependencies',
    };
  });

  const devDeps = getDirectPackages(packageJson, 'devDependencies').map((pkg) => {
    const lockMeta = getLockMetadata(lockData, pkg.name);
    return {
      name: pkg.name,
      version: lockMeta?.version || pkg.range,
      license: lockMeta?.license || 'See package source',
      section: 'Build and tooling dependencies',
    };
  });

  return { deps, devDeps };
}

function normalizePackageNameFromLockPath(lockPath) {
  const marker = 'node_modules/';
  const lastMarkerIndex = lockPath.lastIndexOf(marker);
  if (lastMarkerIndex === -1) {
    return null;
  }
  return lockPath.slice(lastMarkerIndex + marker.length);
}

function getTransitiveRows(lockData, directPackageNames) {
  if (!lockData || !lockData.packages) {
    return [];
  }

  const grouped = new Map();
  const directSet = new Set(directPackageNames);

  for (const [lockPath, entry] of Object.entries(lockData.packages)) {
    if (!lockPath || lockPath === '') {
      continue;
    }
    if (!lockPath.includes('node_modules/')) {
      continue;
    }

    const name = normalizePackageNameFromLockPath(lockPath);
    if (!name || directSet.has(name)) {
      continue;
    }

    if (!grouped.has(name)) {
      grouped.set(name, {
        versions: new Set(),
        licenses: new Set(),
      });
    }

    const bucket = grouped.get(name);
    bucket.versions.add(entry?.version || 'Unknown');
    bucket.licenses.add(entry?.license || 'See package source');
  }

  const rows = Array.from(grouped.entries()).map(([name, values]) => {
    const versions = Array.from(values.versions).sort();
    const licenses = Array.from(values.licenses).sort();

    const versionLabel = versions.length === 1
      ? versions[0]
      : `${versions[0]} (+${versions.length - 1} more)`;

    const licenseLabel = licenses.length === 1
      ? licenses[0]
      : `Multiple (${licenses.length})`;

    return {
      name,
      version: versionLabel,
      license: licenseLabel,
      section: 'Transitive dependencies',
    };
  });

  rows.sort((a, b) => {
    const nameCmp = a.name.localeCompare(b.name);
    if (nameCmp !== 0) {
      return nameCmp;
    }
    return String(a.version).localeCompare(String(b.version));
  });

  return rows;
}

function readGratitudeConfig() {
  const config = readJson(gratitudeConfigPath);
  if (!config) {
    return DEFAULT_GRATITUDE;
  }

  const collaborators = Array.isArray(config.collaborators) && config.collaborators.length
    ? config.collaborators
    : DEFAULT_GRATITUDE.collaborators;

  const communities = Array.isArray(config.communities) && config.communities.length
    ? config.communities
    : DEFAULT_GRATITUDE.communities;

  return { collaborators, communities };
}

function toBullets(items) {
  return items.map((item) => `- ${escapeCell(item)}`).join('\n');
}

function buildPage({
  projectName,
  generatedOn,
  deps,
  devDeps,
  transitiveDeps,
  projectLicense,
  gratitude,
}) {
  const runtimeTable = makeMarkdownTable(deps);
  const toolingTable = makeMarkdownTable(devDeps);
  const transitiveTable = makeMarkdownTable(transitiveDeps);
  const allPackages = [...deps, ...devDeps, ...transitiveDeps];
  const licenseSummaryTable = makeLicenseSummaryTable(allPackages);
  const collaboratorsBullets = toBullets(gratitude.collaborators);
  const communitiesBullets = toBullets(gratitude.communities);
  const projectLicenseLabel = projectLicense
    && projectLicense !== 'UNKNOWN'
    && !String(projectLicense).toLowerCase().includes('see license')
    ? `the **${projectLicense}** license`
    : 'the license described in the repository LICENSE file';

  return `---
title: Credits
description: Gratitude and open-source acknowledgements for this website.
---

<section className="section-with-bg-logo">
<div className="page-shell">
<div className="page-header">
<p className="page-kicker">Gratitude</p>
<h1>Credits and Open-Source Acknowledgements</h1>
<p className="page-lead"><em>With thanks to the open-source community that helps power this website.</em></p>
</div>

<div className="page-quickfacts">
  <div className="page-quickfact">
    <p className="page-quickfact-label">Runtime Packages</p>
    <p className="page-quickfact-value">${deps.length}</p>
  </div>
  <div className="page-quickfact">
    <p className="page-quickfact-label">Tooling Packages</p>
    <p className="page-quickfact-value">${devDeps.length}</p>
  </div>
  <div className="page-quickfact">
    <p className="page-quickfact-label">Transitive Packages</p>
    <p className="page-quickfact-value">${transitiveDeps.length}</p>
  </div>
</div>

<div className="page-content">

Thank you to every maintainer, reviewer, and contributor behind the libraries used in this website.

:::info Project License
This repository is distributed under ${projectLicenseLabel}. Please refer to the LICENSE file in the repository root for full terms.
:::

## Gratitude

### Research and collaboration

${collaboratorsBullets}

### Open-source communities

${communitiesBullets}

## License summary (all dependencies)

${licenseSummaryTable}

## Runtime dependencies

${runtimeTable}

## Build and tooling dependencies

${toolingTable}

## Transitive dependencies (unique packages)

<details>
  <summary>View full transitive dependency list (${transitiveDeps.length})</summary>

${transitiveTable}

</details>

Updated as of ${generatedOn}.

</div>
</div>
</section>
`;
}

function main() {
  const packageJson = readJson(packageJsonPath);
  if (!packageJson) {
    throw new Error('Cannot generate credits page: package.json was not found.');
  }

  const lockData = readJson(packageLockPath);
  const { deps, devDeps } = combineRows(packageJson, lockData);
  const directPackageNames = [...deps, ...devDeps].map((pkg) => pkg.name);
  const transitiveDeps = getTransitiveRows(lockData, directPackageNames);
  const gratitude = readGratitudeConfig();

  const content = buildPage({
    projectName: packageJson.name || 'this project',
    generatedOn: new Date().toISOString().slice(0, 10),
    deps,
    devDeps,
    transitiveDeps,
    projectLicense: packageJson.license || 'See LICENSE file',
    gratitude,
  });

  fs.writeFileSync(outputPath, content, 'utf8');
  const total = deps.length + devDeps.length + transitiveDeps.length;
  console.log(`Generated ${path.relative(rootDir, outputPath)} with ${total} package entries.`);
}

main();
