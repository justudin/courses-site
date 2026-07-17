/**
 * One-time generator for src/data/landdots.json — the dot-matrix landmass
 * behind the /networks globe.
 *
 * Source map: NASA "land_shallow_topo_2048.jpg" (Blue Marble, public domain),
 * an equirectangular 2D world map:
 *   https://eoimages.gsfc.nasa.gov/images/imagerecords/57000/57752/land_shallow_topo_2048.jpg
 *
 * Usage (the output is committed; only rerun to change dot density):
 *   npm install --no-save jpeg-js
 *   node scripts/generate-land-dots.js path/to/land_shallow_topo_2048.jpg
 *
 * Samples the map on an equal-area-ish grid (longitude step widens toward the
 * poles) and classifies each sample as land/ocean by color: Blue Marble
 * oceans are strongly blue, land is green/brown/white. Output is a flat
 * [lat0, lng0, lat1, lng1, ...] array quantized to 0.1° to keep it compact.
 */

const fs = require('fs');
const path = require('path');
const jpeg = require('jpeg-js');

const mapPath = process.argv[2];
if (!mapPath) {
  console.error('Usage: node scripts/generate-land-dots.js <equirectangular-map.jpg>');
  process.exit(1);
}

const OUT_FILE = path.join(__dirname, '..', 'src', 'data', 'landdots.json');
const LAT_STEP = 1.4; // degrees between dot rows

const { width, height, data } = jpeg.decode(fs.readFileSync(mapPath), { useTArray: true });

function isLand(lat, lng) {
  const x = Math.min(width - 1, Math.max(0, Math.round(((lng + 180) / 360) * width)));
  const y = Math.min(height - 1, Math.max(0, Math.round(((90 - lat) / 180) * height)));
  const i = (y * width + x) * 4;
  const r = data[i];
  const g = data[i + 1];
  const b = data[i + 2];
  // Ocean in Blue Marble: blue clearly dominant and dark-ish. Everything
  // else (green/brown land, white ice) counts as land.
  const ocean = b > r + 14 && b > g + 6;
  return !ocean;
}

const dots = [];
for (let lat = -90 + LAT_STEP / 2; lat < 90; lat += LAT_STEP) {
  const lngStep = LAT_STEP / Math.max(Math.cos((lat * Math.PI) / 180), 0.12);
  for (let lng = -180 + lngStep / 2; lng < 180; lng += lngStep) {
    if (isLand(lat, lng)) {
      dots.push(Math.round(lat * 10) / 10, Math.round(lng * 10) / 10);
    }
  }
}

fs.writeFileSync(OUT_FILE, JSON.stringify(dots));
console.log(`Wrote ${path.relative(process.cwd(), OUT_FILE)}: ${dots.length / 2} land dots.`);
