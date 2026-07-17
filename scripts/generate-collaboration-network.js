/**
 * Resolves every publication DOI (journals/conferences/books data files)
 * against the OpenAlex API and aggregates co-author affiliations into
 * src/data/collaborations.json — the data behind the /networks globe.
 *
 * Run manually with `npm run generate:network` whenever publications change;
 * the output is committed, so builds never depend on the network. Responses
 * are cached in scripts/.network-cache.json, so re-runs only fetch new DOIs.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const CACHE_FILE = path.join(__dirname, '.network-cache.json');
const OUT_FILE = path.join(ROOT, 'src', 'data', 'collaborations.json');
const MAILTO = 'hello@aintlab.com';

const HOME = { name: 'AINTLab — Seoul, Korea', lat: 37.5503, lng: 126.9971, countryCode: 'KR' };

// Country centroids (approximate visual anchors, not political statements).
// Extend this table if the run reports unmapped country codes.
const COUNTRIES = {
  AE: { name: 'United Arab Emirates', lat: 23.9, lng: 54.3 },
  BA: { name: 'Bosnia and Herzegovina', lat: 44.2, lng: 17.8 },
  FJ: { name: 'Fiji', lat: -17.8, lng: 178.0 },
  KW: { name: 'Kuwait', lat: 29.3, lng: 47.6 },
  LT: { name: 'Lithuania', lat: 55.2, lng: 23.9 },
  AU: { name: 'Australia', lat: -25.7, lng: 134.5 },
  AT: { name: 'Austria', lat: 47.6, lng: 14.1 },
  BD: { name: 'Bangladesh', lat: 23.7, lng: 90.4 },
  BE: { name: 'Belgium', lat: 50.6, lng: 4.7 },
  BN: { name: 'Brunei', lat: 4.5, lng: 114.7 },
  BR: { name: 'Brazil', lat: -10.8, lng: -53.1 },
  CA: { name: 'Canada', lat: 56.1, lng: -106.3 },
  CH: { name: 'Switzerland', lat: 46.8, lng: 8.2 },
  CN: { name: 'China', lat: 35.9, lng: 104.2 },
  CZ: { name: 'Czechia', lat: 49.8, lng: 15.5 },
  DE: { name: 'Germany', lat: 51.2, lng: 10.4 },
  DK: { name: 'Denmark', lat: 56.0, lng: 9.5 },
  DZ: { name: 'Algeria', lat: 28.0, lng: 1.7 },
  EG: { name: 'Egypt', lat: 26.8, lng: 30.8 },
  ES: { name: 'Spain', lat: 40.2, lng: -3.6 },
  ET: { name: 'Ethiopia', lat: 9.1, lng: 40.5 },
  FI: { name: 'Finland', lat: 64.0, lng: 26.0 },
  FR: { name: 'France', lat: 46.6, lng: 2.4 },
  GB: { name: 'United Kingdom', lat: 54.0, lng: -2.5 },
  GR: { name: 'Greece', lat: 39.1, lng: 22.9 },
  HK: { name: 'Hong Kong', lat: 22.3, lng: 114.2 },
  HU: { name: 'Hungary', lat: 47.2, lng: 19.5 },
  ID: { name: 'Indonesia', lat: -2.5, lng: 118.0 },
  IE: { name: 'Ireland', lat: 53.2, lng: -8.1 },
  IL: { name: 'Israel', lat: 31.4, lng: 35.0 },
  IN: { name: 'India', lat: 21.1, lng: 78.7 },
  IQ: { name: 'Iraq', lat: 33.0, lng: 43.7 },
  IR: { name: 'Iran', lat: 32.6, lng: 54.3 },
  IT: { name: 'Italy', lat: 42.8, lng: 12.8 },
  JO: { name: 'Jordan', lat: 31.3, lng: 36.8 },
  JP: { name: 'Japan', lat: 36.5, lng: 138.0 },
  KE: { name: 'Kenya', lat: 0.5, lng: 37.9 },
  KR: { name: 'South Korea', lat: 36.4, lng: 127.9 },
  KZ: { name: 'Kazakhstan', lat: 48.0, lng: 66.9 },
  LB: { name: 'Lebanon', lat: 33.9, lng: 35.9 },
  LK: { name: 'Sri Lanka', lat: 7.6, lng: 80.7 },
  LY: { name: 'Libya', lat: 27.0, lng: 17.2 },
  MA: { name: 'Morocco', lat: 31.9, lng: -6.9 },
  MX: { name: 'Mexico', lat: 23.9, lng: -102.5 },
  MY: { name: 'Malaysia', lat: 3.8, lng: 109.7 },
  NG: { name: 'Nigeria', lat: 9.6, lng: 8.1 },
  NL: { name: 'Netherlands', lat: 52.2, lng: 5.6 },
  NO: { name: 'Norway', lat: 61.2, lng: 9.6 },
  NP: { name: 'Nepal', lat: 28.2, lng: 84.0 },
  NZ: { name: 'New Zealand', lat: -41.8, lng: 172.8 },
  OM: { name: 'Oman', lat: 20.6, lng: 56.1 },
  PH: { name: 'Philippines', lat: 12.9, lng: 121.8 },
  PK: { name: 'Pakistan', lat: 29.9, lng: 69.4 },
  PL: { name: 'Poland', lat: 52.1, lng: 19.4 },
  PT: { name: 'Portugal', lat: 39.6, lng: -8.0 },
  QA: { name: 'Qatar', lat: 25.3, lng: 51.2 },
  RO: { name: 'Romania', lat: 45.9, lng: 24.9 },
  RU: { name: 'Russia', lat: 61.5, lng: 105.3 },
  SA: { name: 'Saudi Arabia', lat: 24.1, lng: 44.5 },
  SE: { name: 'Sweden', lat: 62.8, lng: 16.7 },
  SG: { name: 'Singapore', lat: 1.35, lng: 103.8 },
  TH: { name: 'Thailand', lat: 15.1, lng: 101.0 },
  TN: { name: 'Tunisia', lat: 34.1, lng: 9.6 },
  TR: { name: 'Turkey', lat: 39.0, lng: 35.3 },
  TW: { name: 'Taiwan', lat: 23.8, lng: 121.0 },
  UA: { name: 'Ukraine', lat: 49.0, lng: 31.4 },
  US: { name: 'United States', lat: 39.8, lng: -98.6 },
  UZ: { name: 'Uzbekistan', lat: 41.4, lng: 64.6 },
  VN: { name: 'Vietnam', lat: 15.6, lng: 106.3 },
  YE: { name: 'Yemen', lat: 15.9, lng: 47.6 },
  ZA: { name: 'South Africa', lat: -29.0, lng: 25.1 },
};

function normalizeDoi(raw) {
  if (!raw || typeof raw !== 'string') return null;
  const match = raw.match(/10\.\d{4,9}\/\S+/i);
  if (!match) return null;
  return match[0].replace(/[).,;\]]+$/, '').toLowerCase();
}

function collectDois() {
  const files = ['journals.json', 'conferences.json', 'books.json'];
  const dois = new Set();
  let publicationCount = 0;
  files.forEach((file) => {
    const pubs = JSON.parse(fs.readFileSync(path.join(ROOT, 'src', 'data', file), 'utf8'));
    publicationCount += pubs.length;
    pubs.forEach((pub) => {
      const doi = normalizeDoi(pub.doi) || normalizeDoi(pub.citation);
      if (doi) dois.add(doi);
    });
  });
  return { dois: [...dois], publicationCount };
}

function loadCache() {
  try {
    return JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
  } catch (err) {
    return {};
  }
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchWork(doi) {
  const url = `https://api.openalex.org/works/doi:${encodeURIComponent(doi)}?select=authorships,publication_year&mailto=${MAILTO}`;
  const res = await fetch(url);
  if (res.status === 404) return { missing: true };
  if (!res.ok) throw new Error(`OpenAlex ${res.status} for ${doi}`);
  const data = await res.json();
  // Keep only what aggregation needs, so the cache stays small.
  return {
    year: data.publication_year ?? null,
    authorships: (data.authorships || []).map((a) => ({
      author: a.author?.display_name ?? a.raw_author_name ?? null,
      institutions: (a.institutions || []).map((inst) => ({
        name: inst.display_name,
        country: inst.country_code || null,
      })),
    })),
  };
}

async function main() {
  const { dois, publicationCount } = collectDois();
  const cache = loadCache();
  console.log(`Found ${dois.length} unique DOIs; ${dois.filter((d) => cache[d]).length} cached.`);

  let fetched = 0;
  for (const doi of dois) {
    if (cache[doi]) continue;
    try {
      cache[doi] = await fetchWork(doi);
      fetched += 1;
      process.stdout.write(`\rFetched ${fetched} new works...`);
      await sleep(120);
    } catch (err) {
      console.warn(`\nSkipping ${doi}: ${err.message}`);
    }
  }
  if (fetched) console.log('');
  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 1));

  // ---- Aggregate ----
  const institutions = new Map(); // name -> {name, country, works:Set}
  const countries = new Map(); // code -> {works:Set, institutions:Set}
  const unmappedCodes = new Set();
  let resolved = 0;

  dois.forEach((doi) => {
    const work = cache[doi];
    if (!work || work.missing || !work.authorships) return;
    let hasInstitution = false;
    work.authorships.forEach((authorship) => {
      authorship.institutions.forEach((inst) => {
        if (!inst.name || !inst.country) return;
        hasInstitution = true;
        const code = inst.country.toUpperCase();
        if (!COUNTRIES[code]) unmappedCodes.add(code);

        const instEntry = institutions.get(inst.name) || { name: inst.name, country: code, works: new Set() };
        instEntry.works.add(doi);
        institutions.set(inst.name, instEntry);

        const countryEntry = countries.get(code) || { works: new Set(), institutions: new Set() };
        countryEntry.works.add(doi);
        countryEntry.institutions.add(inst.name);
        countries.set(code, countryEntry);
      });
    });
    if (hasInstitution) resolved += 1;
  });

  if (unmappedCodes.size) {
    console.warn(`Country codes missing from the centroid table (add them): ${[...unmappedCodes].join(', ')}`);
  }

  const countryList = [...countries.entries()]
    .filter(([code]) => COUNTRIES[code])
    .map(([code, entry]) => ({
      code,
      name: COUNTRIES[code].name,
      lat: COUNTRIES[code].lat,
      lng: COUNTRIES[code].lng,
      works: entry.works.size,
      institutions: [...entry.institutions].sort(),
    }))
    .sort((a, b) => b.works - a.works || a.name.localeCompare(b.name));

  const institutionList = [...institutions.values()]
    .filter((inst) => COUNTRIES[inst.country])
    .map((inst) => ({ name: inst.name, country: inst.country, works: inst.works.size }))
    .sort((a, b) => b.works - a.works || a.name.localeCompare(b.name));

  const output = {
    generatedAt: new Date().toISOString().slice(0, 10),
    home: HOME,
    totals: {
      publications: publicationCount,
      dois: dois.length,
      resolved,
      countries: countryList.length,
      institutions: institutionList.length,
    },
    countries: countryList,
    institutions: institutionList,
  };

  fs.writeFileSync(OUT_FILE, JSON.stringify(output, null, 1));
  console.log(
    `Wrote ${path.relative(ROOT, OUT_FILE)}: ${resolved}/${dois.length} DOIs resolved, ` +
      `${countryList.length} countries, ${institutionList.length} institutions.`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
