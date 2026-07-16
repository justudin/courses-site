import React, { useEffect, useMemo, useRef, useState } from 'react';
import journalsData from '@site/src/data/journals.json';
import conferencesData from '@site/src/data/conferences.json';
import booksData from '@site/src/data/books.json';
import styles from './styles.module.css';

const INDEX_GROUP_WITH_ESCI = ['SCIE', 'SSCI', 'ESCI'];
const INDEX_GROUP_WITHOUT_ESCI = ['SCIE', 'SSCI'];
const INDEXING_ORDER = ['SCIE', 'SSCI', 'ESCI', 'Scopus'];

function parseNumericMetricFromText(text, patterns) {
  if (!text || typeof text !== 'string') {
    return null;
  }

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const value = Number.parseFloat(match[1]);
      if (Number.isFinite(value)) {
        return value;
      }
    }
  }

  return null;
}

function readCiteScore(pub) {
  const direct = [pub.citeScore, pub.citescore, pub.cite_score, pub.scopusCiteScore, pub.scopus_citescore]
    .map((value) => Number.parseFloat(value))
    .find((value) => Number.isFinite(value));

  if (Number.isFinite(direct)) {
    return direct;
  }

  return (
    parseNumericMetricFromText(pub.note, [/(?:Cite\s*Score|CiteScore)\s*[:=]?\s*([0-9]+(?:\.[0-9]+)?)/i]) ??
    parseNumericMetricFromText(pub.venue, [/(?:Cite\s*Score|CiteScore)\s*[:=]?\s*([0-9]+(?:\.[0-9]+)?)/i])
  );
}

function readImpactFactor(pub) {
  const direct = [pub.impactFactor, pub.impact_factor, pub.jif, pub.if, pub.IF]
    .map((value) => Number.parseFloat(value))
    .find((value) => Number.isFinite(value));

  if (Number.isFinite(direct)) {
    return direct;
  }

  return (
    parseNumericMetricFromText(pub.note, [
      /(?:Impact\s*Factor)\s*[:=]?\s*([0-9]+(?:\.[0-9]+)?)/i,
      /\bIF\b\s*[:=]\s*([0-9]+(?:\.[0-9]+)?)/i,
    ]) ??
    parseNumericMetricFromText(pub.venue, [
      /(?:Impact\s*Factor)\s*[:=]?\s*([0-9]+(?:\.[0-9]+)?)/i,
      /\bIF\b\s*[:=]\s*([0-9]+(?:\.[0-9]+)?)/i,
    ])
  );
}

function hasAnyIndexing(pub, allowedIndexing) {
  return Array.isArray(pub.indexing) && pub.indexing.some((idx) => allowedIndexing.includes(idx));
}

function formatMetricValue(value) {
  return Number.isFinite(value) ? value.toFixed(2) : 'N/A';
}

function computeMetricStats(publications, readMetric) {
  const values = publications
    .map(readMetric)
    .filter((value) => Number.isFinite(value));

  if (!values.length) {
    return {
      total: null,
      average: null,
      countWithMetric: 0,
    };
  }

  const total = values.reduce((sum, value) => sum + value, 0);
  return {
    total,
    average: total / values.length,
    countWithMetric: values.length,
  };
}

// Helper function to highlight Syafrudin, M. in authors string
function HighlightedAuthors({ authorsString }) {
  // Split by comma and process each author
  const authors = authorsString.split(',').map(a => a.trim());
  
  return (
    <>
      {authors.map((author, idx) => {
        const isSyafrudin = author.includes('Syafrudin, M.');
        return (
          <span key={idx}>
            {isSyafrudin ? (
              <u><b>{author}</b></u>
            ) : (
              author
            )}
            {idx < authors.length - 1 && ', '}
          </span>
        );
      })}
    </>
  );
}

export default function PublicationsList() {
  const [filter, setFilter] = useState('all');
  const [indexingFilter, setIndexingFilter] = useState('all');
  const [sortBy, setSortBy] = useState('featured');
  const [searchTerm, setSearchTerm] = useState('');
  const hasInitializedFromUrl = useRef(false);

  // Read controls from URL once on mount.
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const q = params.get('q') || '';
    const type = params.get('type') || 'all';
    const indexing = params.get('indexing') || 'all';
    const sort = params.get('sort') || 'featured';

    if (['all', 'journal', 'conference', 'book'].includes(type)) {
      setFilter(type);
    }
    if (['all', 'SCIE', 'SSCI', 'ESCI', 'Scopus'].includes(indexing)) {
      setIndexingFilter(indexing);
    }
    if (['year-desc', 'year-asc', 'title', 'featured'].includes(sort)) {
      setSortBy(sort);
    }
    setSearchTerm(q);
    hasInitializedFromUrl.current = true;
  }, []);

  // Keep URL query params synced with current controls.
  useEffect(() => {
    if (typeof window === 'undefined' || !hasInitializedFromUrl.current) {
      return;
    }

    const params = new URLSearchParams();
    if (searchTerm) {
      params.set('q', searchTerm);
    }
    if (filter !== 'all') {
      params.set('type', filter);
    }
    if (indexingFilter !== 'all') {
      params.set('indexing', indexingFilter);
    }
    if (sortBy !== 'featured') {
      params.set('sort', sortBy);
    }

    const queryString = params.toString();
    const nextUrl = `${window.location.pathname}${queryString ? `?${queryString}` : ''}${window.location.hash || ''}`;
    window.history.replaceState({}, '', nextUrl);
  }, [searchTerm, filter, indexingFilter, sortBy]);

  // Combine all data with type labels
  const allPublications = useMemo(() => {
    const journals = journalsData.map(pub => ({ ...pub, type: 'journal', typeLabel: 'Journal' }));
    const conferences = conferencesData.map(pub => ({ ...pub, type: 'conference', typeLabel: 'Conference' }));
    const books = booksData.map(pub => ({ ...pub, type: 'book', typeLabel: 'Book/Chapter' }));
    return [...journals, ...conferences, ...books];
  }, []);

  // Assign stable chronological numbers once (oldest = 1, newest = highest)
  const allWithNumbers = useMemo(() => {
    const typePrefix = { journal: 'J', conference: 'C', book: 'B' };
    // Sort each type oldest-first to assign numbers
    const byType = { journal: [], conference: [], book: [] };
    allPublications.forEach(pub => byType[pub.type].push(pub));
    Object.values(byType).forEach(list => list.sort((a, b) => (a.year || 0) - (b.year || 0)));
    const numMap = new Map();
    Object.entries(byType).forEach(([type, list]) => {
      list.forEach((pub, idx) => {
        numMap.set(pub, `${typePrefix[type]}${idx + 1}`);
      });
    });
    return allPublications.map(pub => ({ ...pub, number: numMap.get(pub) }));
  }, [allPublications]);

  // Filter and search
  const filteredPublications = useMemo(() => {
    let result = allWithNumbers;

    if (filter !== 'all') {
      result = result.filter(pub => pub.type === filter);
    }

    if (indexingFilter !== 'all') {
      result = result.filter(pub => Array.isArray(pub.indexing) && pub.indexing.includes(indexingFilter));
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(pub =>
        pub.title.toLowerCase().includes(term) ||
        pub.authors.toLowerCase().includes(term) ||
        pub.venue.toLowerCase().includes(term)
      );
    }

    return result;
  }, [allWithNumbers, filter, indexingFilter, searchTerm]);

  // Sort
  const sortedPublications = useMemo(() => {
    const sorted = [...filteredPublications];
    
    if (sortBy === 'featured') {
      sorted.sort((a, b) => {
        const aFeatured = a.featured ? 1 : 0;
        const bFeatured = b.featured ? 1 : 0;
        return bFeatured - aFeatured || (b.year || 0) - (a.year || 0);
      });
    } else if (sortBy === 'year-desc') {
      sorted.sort((a, b) => (b.year || 0) - (a.year || 0));
    } else if (sortBy === 'year-asc') {
      sorted.sort((a, b) => (a.year || 0) - (b.year || 0));
    } else if (sortBy === 'title') {
      sorted.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    }

    return sorted;
  }, [filteredPublications, sortBy]);

  // numberedPublications is just sortedPublications — numbers are already assigned
  const numberedPublications = sortedPublications;

  const typeStats = useMemo(() => {
    return {
      all: allPublications.length,
      journal: allPublications.filter(p => p.type === 'journal').length,
      conference: allPublications.filter(p => p.type === 'conference').length,
      book: allPublications.filter(p => p.type === 'book').length,
    };
  }, [allPublications]);

  const indexingStats = useMemo(() => {
    const count = (label) => allPublications.filter(p => Array.isArray(p.indexing) && p.indexing.includes(label)).length;
    return { SCIE: count('SCIE'), SSCI: count('SSCI'), ESCI: count('ESCI'), Scopus: count('Scopus') };
  }, [allPublications]);

  const metricStats = useMemo(() => {
    const journalsOnly = allPublications.filter((pub) => pub.type === 'journal');

    const journalsScopus = journalsOnly.filter((pub) => hasAnyIndexing(pub, ['Scopus']));
    const journalsWithESCI = journalsOnly.filter((pub) => hasAnyIndexing(pub, INDEX_GROUP_WITH_ESCI));
    const journalsWithoutESCI = journalsOnly.filter((pub) => hasAnyIndexing(pub, INDEX_GROUP_WITHOUT_ESCI));

    return {
      citeScoreScopus: computeMetricStats(journalsScopus, readCiteScore),
      impactFactorAll: computeMetricStats(journalsWithESCI, readImpactFactor),
      impactFactorWithoutESCI: computeMetricStats(journalsWithoutESCI, readImpactFactor),
    };
  }, [allPublications]);

  return (
    <div className={styles.publicationsContainer}>
      <div className={styles.metricsPanel}>
        <div className={`${styles.metricCard} reveal`}>
          <p className={styles.metricLabel}>CiteScore Total (Scopus)</p>
          <p className={styles.metricValue}>{formatMetricValue(metricStats.citeScoreScopus.total)}</p>
          <p className={styles.metricMeta}>Average: {formatMetricValue(metricStats.citeScoreScopus.average)} | Data points: {metricStats.citeScoreScopus.countWithMetric}</p>
        </div>

        <div className={`${styles.metricCard} reveal`}>
          <p className={styles.metricLabel}>Impact Factor Total (SCIE/SSCI/ESCI)</p>
          <p className={styles.metricValue}>{formatMetricValue(metricStats.impactFactorAll.total)}</p>
          <p className={styles.metricMeta}>Average: {formatMetricValue(metricStats.impactFactorAll.average)} | Data points: {metricStats.impactFactorAll.countWithMetric}</p>
        </div>

        <div className={`${styles.metricCard} reveal`}>
          <p className={styles.metricLabel}>Impact Factor Total (Without ESCI)</p>
          <p className={styles.metricValue}>{formatMetricValue(metricStats.impactFactorWithoutESCI.total)}</p>
          <p className={styles.metricMeta}>Average: {formatMetricValue(metricStats.impactFactorWithoutESCI.average)} | Data points: {metricStats.impactFactorWithoutESCI.countWithMetric}</p>
        </div>
      </div>

      <div className={styles.controls}>
        {/* Search */}
        <div className={styles.searchBox}>
          <input
            type="text"
            placeholder="Search by title, author, or venue..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        {/* Filter and Sort */}
        <div className={styles.filterSort}>
          <div className={styles.filterGroup}>
            <label>Type:</label>
            <select value={filter} onChange={(e) => setFilter(e.target.value)} className={styles.select}>
              <option value="all">All Publications ({typeStats.all})</option>
              <option value="journal">Journals ({typeStats.journal})</option>
              <option value="conference">Conferences ({typeStats.conference})</option>
              <option value="book">Books/Chapters ({typeStats.book})</option>
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label>Indexing:</label>
            <select value={indexingFilter} onChange={(e) => setIndexingFilter(e.target.value)} className={styles.select}>
              <option value="all">All Indexing</option>
              <option value="SCIE">SCIE ({indexingStats.SCIE})</option>
              <option value="SSCI">SSCI ({indexingStats.SSCI})</option>
              <option value="ESCI">ESCI ({indexingStats.ESCI})</option>
              <option value="Scopus">Scopus ({indexingStats.Scopus})</option>
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label>Sort by:</label>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className={styles.select}>
              <option value="featured">Featured First</option>
              <option value="year-desc">Year (Newest First)</option>
              <option value="year-asc">Year (Oldest First)</option>
              <option value="title">Title (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Summary */}
      <div className={styles.summary}>
        Showing <strong>{sortedPublications.length}</strong> publication{sortedPublications.length !== 1 ? 's' : ''}
        {searchTerm && ` matching "${searchTerm}"`}
      </div>

      {/* Publications List */}
      <div className={styles.publicationsList}>
        {numberedPublications.length === 0 ? (
          <p className={styles.noResults}>No publications found matching your criteria.</p>
        ) : (
          numberedPublications.map((pub, idx) => (
            <PublicationItem key={`${pub.type}-${idx}`} publication={pub} />
          ))
        )}
      </div>
    </div>
  );
}

const INDEXING_STYLE = {
  'SCIE':   styles.badgeSCIE,
  'SSCI':   styles.badgeSSCI,
  'Scopus': styles.badgeScopus,
};

function PublicationItem({ publication }) {
  const { title, authors, venue, year, doi, scholar, role, typeLabel, number, indexing } = publication;

  const isCorresponding = role === 'corresponding';
  const isCoFirst = role === 'co-first';
  const citeScore = readCiteScore(publication);
  const impactFactor = readImpactFactor(publication);
  const orderedIndexing = Array.isArray(indexing)
    ? [...indexing].sort((a, b) => INDEXING_ORDER.indexOf(a) - INDEXING_ORDER.indexOf(b))
    : [];

  return (
    <div className={`${styles.publicationItem} reveal ${publication.featured ? styles.publicationFeatured : ''}`}>
      <div className={styles.itemHeader}>
        <span className={styles.itemNumber}>{number}</span>
        <span className={`${styles.badge} ${styles[publication.type]}`}>
          {typeLabel}
        </span>
        {publication.featured && <span className={styles.badgeFeatured}>Featured</span>}
        {year && <span className={styles.year}>{year}</span>}
        {Number.isFinite(citeScore) && (
          <span className={styles.metricBadge}>CiteScore: {citeScore.toFixed(2)}</span>
        )}
        {Number.isFinite(impactFactor) && (
          <span className={styles.metricBadge}>IF: {impactFactor.toFixed(2)}</span>
        )}
        {isCorresponding && <span className={styles.badgeCorresponding}>*Corresponding Author</span>}
        {isCoFirst && <span className={styles.badgeCoFirst}>†Co-First Author</span>}
        {orderedIndexing.map((idx) => (
          <span key={idx} className={`${styles.indexingBadge} ${INDEXING_STYLE[idx] || ''}`}>{idx}</span>
        ))}
      </div>

      <h3 className={styles.title}>{title}</h3>

      <p className={styles.authors}>
        <HighlightedAuthors authorsString={authors} />
      </p>

      <p className={styles.venue}>{venue}</p>

      <div className={styles.links}>
        {doi && (
          <a href={doi} target="_blank" rel="noopener noreferrer" className={styles.link}>
            DOI
          </a>
        )}
        {scholar && (
          <a href={scholar} target="_blank" rel="noopener noreferrer" className={styles.link}>
            Google Scholar
          </a>
        )}
      </div>
    </div>
  );
}
