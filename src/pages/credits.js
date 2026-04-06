import React, { useState } from 'react';
import Layout from '@theme/Layout';
import credits from '@site/src/data/credits.json';
import styles from './credits.module.css';

function DepTable({ deps, showSource }) {
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Package</th>
            <th>Version</th>
            <th>License</th>
            {showSource && <th>Source</th>}
          </tr>
        </thead>
        <tbody>
          {deps.map((d) => (
            <tr key={d.name}>
              <td className={styles.pkgName}>{d.name}</td>
              <td>{d.version}</td>
              <td><span className={styles.licenseBadge}>{d.license}</span></td>
              {showSource && (
                <td>
                  <a
                    href={`https://www.npmjs.com/package/${d.name}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.npmLink}>
                    npm
                  </a>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function CreditsPage() {
  const [showTransitive, setShowTransitive] = useState(false);

  return (
    <Layout
      title="Credits"
      description="Open-source acknowledgements and dependency credits">
      <main className={styles.page}>
        {/* Hero */}
        <section className={styles.hero}>
          <div className="container">
            <p className={styles.eyebrow}>Gratitude</p>
            <h1>Credits and Open-Source Acknowledgements</h1>
            <p className={styles.subtitle}>
              With thanks to the open-source community that helps power this site.
            </p>

            <div className={styles.statsGrid}>
              <article className={styles.statCard}>
                <span className={styles.statLabel}>Generated</span>
                <strong>{credits.generated}</strong>
              </article>
              <article className={styles.statCard}>
                <span className={styles.statLabel}>Runtime Packages</span>
                <strong>{credits.runtimeCount}</strong>
              </article>
              <article className={styles.statCard}>
                <span className={styles.statLabel}>Tooling Packages</span>
                <strong>{credits.devCount}</strong>
              </article>
              <article className={styles.statCard}>
                <span className={styles.statLabel}>Transitive Packages</span>
                <strong>{credits.transitiveCount}</strong>
              </article>
            </div>
          </div>
        </section>

        {/* Gratitude */}
        <section className={styles.section}>
          <div className="container">
            <h2 className={styles.sectionTitle}>Gratitude</h2>
            <div className={styles.gratitudeGrid}>
              <article className={styles.card}>
                <h3 className={styles.cardTitle}>Teaching and learning</h3>
                <ul className={styles.cardList}>
                  <li>Students who share feedback and make every semester better</li>
                  <li>Teaching assistants and colleagues who support course delivery</li>
                  <li>The broader education community sharing open knowledge</li>
                </ul>
              </article>
              <article className={styles.card}>
                <h3 className={styles.cardTitle}>Open-source communities</h3>
                <ul className={styles.cardList}>
                  <li>Docusaurus maintainers and contributors</li>
                  <li>React and MDX communities</li>
                  <li>Open-source maintainers across the JavaScript ecosystem</li>
                </ul>
              </article>
            </div>
          </div>
        </section>

        {/* License summary */}
        <section className={styles.section}>
          <div className="container">
            <h2 className={styles.sectionTitle}>License Summary</h2>
            <div className={styles.licensePills}>
              {credits.licenseSummary.map((l) => (
                <span key={l.license} className={styles.licensePill}>
                  {l.license} <strong>{l.count}</strong>
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Runtime deps */}
        <section className={styles.section}>
          <div className="container">
            <h2 className={styles.sectionTitle}>Runtime Dependencies</h2>
            <DepTable deps={credits.runtimeDeps} showSource />
          </div>
        </section>

        {/* Dev deps */}
        <section className={styles.section}>
          <div className="container">
            <h2 className={styles.sectionTitle}>Build and Tooling Dependencies</h2>
            <DepTable deps={credits.devDeps} showSource />
          </div>
        </section>

        {/* Transitive deps */}
        <section className={styles.section}>
          <div className="container">
            <h2 className={styles.sectionTitle}>
              Transitive Dependencies ({credits.transitiveCount})
            </h2>
            <button
              className={styles.toggleBtn}
              onClick={() => setShowTransitive(!showTransitive)}
              aria-expanded={showTransitive}>
              {showTransitive ? 'Hide' : 'Show'} full dependency list
              <svg
                className={`${styles.toggleIcon} ${showTransitive ? styles.rotated : ''}`}
                viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M7.41,8.58L12,13.17L16.59,8.58L18,10L12,16L6,10L7.41,8.58Z"
                />
              </svg>
            </button>
            {showTransitive && <DepTable deps={credits.transitiveDeps} />}
          </div>
        </section>

        {/* Footer note */}
        <section className={styles.section}>
          <div className="container">
            <p className={styles.footnote}>
              This page is auto-generated at build time from <code>package.json</code> and{' '}
              <code>package-lock.json</code>. Generator script:{' '}
              <code>scripts/generate-credits-page.js</code>
            </p>
          </div>
        </section>
      </main>
    </Layout>
  );
}
