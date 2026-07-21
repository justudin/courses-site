import React, { useMemo, useState } from 'react';
import Layout from '@theme/Layout';
import reviewsData from '@site/src/data/courses/reviews.json';
import styles from './reviews.module.css';

const SORT_OPTIONS = {
  featured: 'Featured',
  longest: 'Longest First',
  shortest: 'Shortest First',
};

function getProjectMentions(reviews) {
  const keywords = ['project', 'practice', '실습', '과제'];
  return reviews.filter((review) => {
    const normalized = review.quote.toLowerCase();
    return keywords.some((keyword) => normalized.includes(keyword.toLowerCase()));
  }).length;
}

export default function ReviewsPage() {
  const [languageFilter, setLanguageFilter] = useState('all');
  const [sortBy, setSortBy] = useState('featured');
  const [searchTerm, setSearchTerm] = useState('');

  const stats = useMemo(() => {
    const total = reviewsData.length;
    const korean = reviewsData.filter((review) => review.language === 'ko').length;
    const english = reviewsData.filter((review) => review.language === 'en').length;
    const projectMentions = getProjectMentions(reviewsData);

    return {
      total,
      korean,
      english,
      projectMentions,
    };
  }, []);

  const visibleReviews = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    const filtered = reviewsData.filter((review) => {
      const languagePass = languageFilter === 'all' || review.language === languageFilter;
      const searchPass =
        normalizedSearch.length === 0 ||
        review.quote.toLowerCase().includes(normalizedSearch) ||
        review.focus.join(' ').toLowerCase().includes(normalizedSearch);

      return languagePass && searchPass;
    });

    if (sortBy === 'longest') {
      return [...filtered].sort((a, b) => b.quote.length - a.quote.length);
    }

    if (sortBy === 'shortest') {
      return [...filtered].sort((a, b) => a.quote.length - b.quote.length);
    }

    return filtered;
  }, [languageFilter, searchTerm, sortBy]);

  return (
    <Layout
      title="Reviews"
      description="Student testimonials from courses taught by Muhammad Syafrudin">
      {/* container--fluid + page-shell matches the JSX-page pattern used by
          networks.jsx, so the courses pages get the same gutters as MDX pages. */}
      <main className="container container--fluid margin-vert--lg">
        <section className="section-with-bg-logo">
          <div className="page-shell">
          <div className="page-header">
            <p className="page-kicker">Student Voiceboard</p>
            <h1>Reviews</h1>
            <p className="page-lead">
              <em>
                A curated collection of student feedback across semesters, focused on
                practical learning, mentorship quality, and course impact.
              </em>
            </p>
          </div>

          <div className="page-quickfacts">
            <div className="page-quickfact reveal">
              <p className="page-quickfact-label">Total Reviews</p>
              <p className="page-quickfact-value">{stats.total}</p>
            </div>
            <div className="page-quickfact reveal">
              <p className="page-quickfact-label">Korean / English</p>
              <p className="page-quickfact-value">
                {stats.korean} / {stats.english}
              </p>
            </div>
            <div className="page-quickfact reveal">
              <p className="page-quickfact-label">Project + Practice Mentions</p>
              <p className="page-quickfact-value">{stats.projectMentions}</p>
            </div>
          </div>

          <div className="page-content">
            <div className={styles.controls}>
              <label className={styles.searchWrap}>
                <span>Search</span>
                <input
                  type="search"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Try: project, 실습, feedback"
                  aria-label="Search reviews"
                />
              </label>

              <div className={styles.languageToggle} role="group" aria-label="Filter by language">
                <button
                  type="button"
                  className={languageFilter === 'all' ? styles.activeButton : ''}
                  onClick={() => setLanguageFilter('all')}>
                  All
                </button>
                <button
                  type="button"
                  className={languageFilter === 'ko' ? styles.activeButton : ''}
                  onClick={() => setLanguageFilter('ko')}>
                  Korean
                </button>
                <button
                  type="button"
                  className={languageFilter === 'en' ? styles.activeButton : ''}
                  onClick={() => setLanguageFilter('en')}>
                  English
                </button>
              </div>

              <label className={styles.sortWrap}>
                <span>Sort</span>
                <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
                  {Object.entries(SORT_OPTIONS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <p className={styles.resultInfo}>
              Showing {visibleReviews.length} of {reviewsData.length} reviews.
            </p>

            <div className={styles.reviewGrid}>
              {visibleReviews.map((review) => (
                <article key={review.id} className={styles.reviewCard}>
                  <div className={styles.cardTopRow}>
                    <span className={styles.languageBadge}>
                      {review.language === 'ko' ? 'Korean' : 'English'}
                    </span>
                    <span className={styles.idBadge}>#{review.id}</span>
                  </div>

                  <p className={styles.quoteMark}>“</p>
                  <p className={styles.quote}>{review.quote}</p>

                  <div className={styles.focusRow}>
                    {review.focus.map((item) => (
                      <span key={`${review.id}-${item}`} className={styles.focusTag}>
                        {item}
                      </span>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}