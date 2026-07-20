/**
 * Export Google Scholar publications for author WLTzkOMAAAAJ to a JSON file
 * that can be uploaded manually into Algolia.
 *
 * Pulls every publication for the author from SerpApi's Google Scholar Author
 * API (https://serpapi.com/google-scholar-author-api) and writes an array of
 * Algolia-ready records (each with a stable `objectID`) to a JSON file. Upload
 * it in the Algolia dashboard via: Index -> Add records -> Upload file (JSON).
 *
 * No Algolia Admin key is needed for this flow — only a SerpApi key, which is
 * read from scripts/keys.json (gitignored). Copy scripts/keys.example.json to
 * scripts/keys.json and fill in your SerpApi key before running.
 *
 * Usage:
 *   node scripts/index-scholar-publications.js
 *   node scripts/index-scholar-publications.js --out path/to/file.json
 */

const fs = require('fs');
const path = require('path');

const KEYS_PATH = path.join(__dirname, 'keys.json');
const DEFAULT_OUT = path.join(__dirname, '..', 'scholar-publications.json');
const SCHOLAR_AUTHOR_ID = 'WLTzkOMAAAAJ';
const PAGE_SIZE = 100; // SerpApi max `num` per page for google_scholar_author
const MAX_PAGES = 20; // safety cap: 20 * 100 = 2000 publications

function loadKeys() {
  if (!fs.existsSync(KEYS_PATH)) {
    console.error(`Missing keys file: ${KEYS_PATH}`);
    console.error('Copy scripts/keys.example.json to scripts/keys.json and fill in your SerpApi key.');
    process.exit(1);
  }

  const keys = JSON.parse(fs.readFileSync(KEYS_PATH, 'utf8'));
  if (!keys.serpApiKey) {
    console.error('scripts/keys.json is missing: serpApiKey');
    process.exit(1);
  }
  return keys;
}

function parseOutPath(args) {
  const i = args.indexOf('--out');
  if (i !== -1 && args[i + 1]) {
    return path.resolve(args[i + 1]);
  }
  return DEFAULT_OUT;
}

async function fetchAllArticles(serpApiKey) {
  const articles = [];
  let start = 0;

  for (let page = 0; page < MAX_PAGES; page++) {
    const url = new URL('https://serpapi.com/search.json');
    url.searchParams.set('engine', 'google_scholar_author');
    url.searchParams.set('author_id', SCHOLAR_AUTHOR_ID);
    url.searchParams.set('sort', 'pubdate');
    url.searchParams.set('start', String(start));
    url.searchParams.set('num', String(PAGE_SIZE));
    url.searchParams.set('api_key', serpApiKey);

    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`SerpApi request failed (${res.status}): ${await res.text()}`);
    }
    const data = await res.json();
    if (data.error) {
      throw new Error(`SerpApi error: ${data.error}`);
    }

    const pageArticles = data.articles || [];
    articles.push(...pageArticles);
    console.log(`  fetched page ${page + 1}: ${pageArticles.length} articles (start=${start})`);

    const hasNext = Boolean(data.serpapi_pagination && data.serpapi_pagination.next);
    if (pageArticles.length === 0 || !hasNext) {
      break;
    }
    start += PAGE_SIZE;
  }

  return articles;
}

function slugify(str) {
  return (str || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function toAlgoliaRecord(article) {
  const year = article.year ? Number(article.year) : null;
  // citation_id is stable and unique per Scholar entry; fall back to a
  // slug so a record is never silently dropped if it's ever missing.
  const objectID = article.citation_id || `${slugify(article.title)}-${year || 'na'}`;

  return {
    objectID,
    title: article.title || '',
    authors: article.authors || '',
    venue: article.publication || '',
    year,
    citedBy: (article.cited_by && article.cited_by.value) || 0,
    citedByLink: (article.cited_by && article.cited_by.link) || null,
    link: article.link || null,
    scholarCitationId: article.citation_id || null,
    scholarAuthorId: SCHOLAR_AUTHOR_ID,
    source: 'google_scholar',
    exportedAt: new Date().toISOString(),
  };
}

async function main() {
  const args = process.argv.slice(2);
  const outPath = parseOutPath(args);
  const keys = loadKeys();

  console.log(`Fetching publications for Google Scholar author ${SCHOLAR_AUTHOR_ID}...`);
  const articles = await fetchAllArticles(keys.serpApiKey);
  console.log(`Fetched ${articles.length} publications total.`);

  const records = articles.map(toAlgoliaRecord);

  fs.writeFileSync(outPath, JSON.stringify(records, null, 2), 'utf8');
  console.log(`\nWrote ${records.length} records to ${outPath}`);
  console.log('Upload it in Algolia: Index -> Add records -> Upload file (JSON).');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
