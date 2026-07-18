import React from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import CollabGlobe from '@site/src/components/CollabGlobe';
import collaborations from '@site/src/data/collaborations.json';
import styles from './networks.module.css';

// ISO 3166-1 alpha-2 code → flag emoji (regional indicator symbols).
function flagEmoji(code) {
  return String.fromCodePoint(...[...code.toUpperCase()].map((ch) => 0x1f1a5 + ch.charCodeAt(0)));
}

// The affiliation cards show the strongest partnerships; the globe and the
// chip strip above still cover every country. collaborations.countries is
// pre-sorted by number of co-authored works (descending).
const TOP_COUNTRIES = 10;

const STATS = [
  {value: collaborations.totals.countries, label: 'Countries'},
  {value: collaborations.totals.institutions, label: 'Institutions'},
  {value: collaborations.totals.resolved, label: 'Works'},
];

function CountryCard({country}) {
  const shown = country.institutions.slice(0, 4);
  const more = country.institutions.length - shown.length;
  return (
    <div className={styles.countryCard}>
      <div className={styles.countryHead}>
        <span className={styles.countryFlag} aria-hidden="true">
          {flagEmoji(country.code)}
        </span>
        <h3 className={styles.countryName}>{country.name}</h3>
        <span className={styles.countryWorks}>
          {country.works} {country.works === 1 ? 'work' : 'works'}
        </span>
      </div>
      <ul className={styles.institutionList}>
        {shown.map((inst) => (
          <li key={inst}>{inst}</li>
        ))}
      </ul>
      {more > 0 && (
        <details className={styles.moreInstitutions}>
          <summary>+{more} more</summary>
          <ul className={styles.institutionList}>
            {country.institutions.slice(4).map((inst) => (
              <li key={inst}>{inst}</li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

export default function Networks() {
  return (
    <Layout
      title="Networks"
      description="AINTLab's global collaboration network — co-author affiliations from our publications, visualized from Seoul to the world.">
      {/* Wrapper classes mirror Docusaurus's MDX page layout exactly, and the
          section-with-bg-logo watermark matches every other content page. */}
      <main className="container container--fluid margin-vert--lg">
        <section className="section-with-bg-logo">
        <div className="page-shell">
          <div className="page-header">
            <p className="page-kicker">Global network</p>
            <h1>From Seoul to the world.</h1>
            <p className="page-lead">
              Every co-author affiliation behind our <Link to="/publications">publications</Link>,
              resolved from their DOIs and drawn live — {collaborations.totals.countries} countries,
              one blue thread from home.
            </p>
          </div>

          <CollabGlobe
            home={collaborations.home}
            countries={collaborations.countries}
            totals={collaborations.totals}
          />

          <div className={styles.statRow}>
            {STATS.map((stat) => (
              <div key={stat.label} className={styles.statTile}>
                <span className={styles.statValue}>{stat.value}</span>
                <span className={styles.statLabel}>{stat.label}</span>
              </div>
            ))}
          </div>

          <section className={styles.affiliations}>
            <h2>Affiliations by country.</h2>
            <p className={styles.affiliationsLead}>
              Our top {TOP_COUNTRIES} country partnerships by shared output, from{' '}
              {collaborations.totals.resolved} DOI-resolved works. All{' '}
              {collaborations.totals.countries} countries appear on the globe and chip strip above.
            </p>
            <div className={styles.countryGrid}>
              {collaborations.countries.slice(0, TOP_COUNTRIES).map((country) => (
                <CountryCard key={country.code} country={country} />
              ))}
            </div>
            <p className={styles.dataNote}>
              <em>Affiliation data derived from publication DOIs automatically via{' '}
              <a href="https://openalex.org" target="_blank" rel="noopener noreferrer">
                OpenAlex
              </a>{' '} and may content incorrect data.</em>
            </p>
          </section>
        </div>
        </section>
      </main>
    </Layout>
  );
}
