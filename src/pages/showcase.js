import React, { useMemo, useState } from 'react';
import Layout from '@theme/Layout';
import showcaseProjects from '@site/src/data/showcaseProjects';
import styles from './showcase.module.css';

const SORT_OPTIONS = {
  featured: 'Featured',
  newest: 'Newest First',
  az: 'A → Z',
};

export default function ShowcasePage() {
  const [courseFilter, setCourseFilter] = useState('all');
  const [sortBy, setSortBy] = useState('featured');
  const [searchTerm, setSearchTerm] = useState('');

  const courses = useMemo(() => {
    const set = new Set(showcaseProjects.map((p) => p.course));
    return Array.from(set).sort();
  }, []);

  const stats = useMemo(() => {
    const totalProjects = showcaseProjects.length;
    const totalCourses = new Set(showcaseProjects.map((p) => p.course)).size;
    const totalTools = new Set(showcaseProjects.flatMap((p) => p.tools)).size;
    return { totalProjects, totalCourses, totalTools };
  }, []);

  const visibleProjects = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    const filtered = showcaseProjects.filter((project) => {
      const coursePass = courseFilter === 'all' || project.course === courseFilter;
      const searchPass =
        normalizedSearch.length === 0 ||
        project.title.toLowerCase().includes(normalizedSearch) ||
        project.team.toLowerCase().includes(normalizedSearch) ||
        project.description.toLowerCase().includes(normalizedSearch) ||
        project.tools.join(' ').toLowerCase().includes(normalizedSearch);
      return coursePass && searchPass;
    });

    if (sortBy === 'newest') {
      return [...filtered].sort((a, b) => b.id - a.id);
    }
    if (sortBy === 'az') {
      return [...filtered].sort((a, b) => a.title.localeCompare(b.title));
    }
    // featured first
    return [...filtered].sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
  }, [courseFilter, searchTerm, sortBy]);

  return (
    <Layout
      title="Showcase"
      description="Student project showcase from courses taught by Muhammad Syafrudin">
      <main className={styles.page}>
        <section className={styles.hero}>
          <div className="container">
            <p className={styles.eyebrow}>Student Projects</p>
            <h1>Showcase</h1>
            <p className={styles.subtitle}>
              Explore outstanding projects built by students across semesters — from web apps
              and dashboards to deep learning models and data pipelines.
            </p>

            <div className={styles.statsGrid}>
              <article className={styles.statCard}>
                <span>Total Projects</span>
                <strong>{stats.totalProjects}</strong>
              </article>
              <article className={styles.statCard}>
                <span>Courses</span>
                <strong>{stats.totalCourses}</strong>
              </article>
              <article className={styles.statCard}>
                <span>Tools &amp; Technologies</span>
                <strong>{stats.totalTools}</strong>
              </article>
            </div>
          </div>
        </section>

        <section className={styles.filtersSection}>
          <div className="container">
            <div className={styles.controls}>
              <label className={styles.searchWrap}>
                <span>Search</span>
                <input
                  type="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Try: dashboard, React, deep learning"
                  aria-label="Search projects"
                />
              </label>

              <label className={styles.courseWrap}>
                <span>Course</span>
                <select
                  value={courseFilter}
                  onChange={(e) => setCourseFilter(e.target.value)}>
                  <option value="all">All Courses</option>
                  {courses.map((course) => (
                    <option key={course} value={course}>
                      {course}
                    </option>
                  ))}
                </select>
              </label>

              <label className={styles.sortWrap}>
                <span>Sort</span>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                  {Object.entries(SORT_OPTIONS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <p className={styles.resultInfo}>
              Showing {visibleProjects.length} of {showcaseProjects.length} projects.
            </p>

            <div className={styles.projectGrid}>
              {visibleProjects.map((project) => (
                <article key={project.id} className={styles.projectCard}>
                  <div className={styles.screenshotWrap}>
                    <img
                      src={project.screenshot}
                      alt={`${project.title} screenshot`}
                      className={styles.screenshot}
                      loading="lazy"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                    <div className={styles.screenshotFallback} style={{ display: 'none' }}>
                      <span>📸</span>
                      <p>Screenshot coming soon</p>
                    </div>
                    {project.featured && (
                      <span className={styles.featuredBadge}>★ Featured</span>
                    )}
                  </div>

                  <div className={styles.cardBody}>
                    <div className={styles.cardMeta}>
                      <span className={styles.courseBadge}>{project.course}</span>
                      <span className={styles.semesterBadge}>{project.semester}</span>
                    </div>

                    <h3 className={styles.projectTitle}>{project.title}</h3>

                    <p className={styles.teamName}>
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                      </svg>
                      {project.team}
                    </p>

                    <p className={styles.description}>{project.description}</p>

                    <div className={styles.toolsRow}>
                      {project.tools.map((tool) => (
                        <span key={`${project.id}-${tool}`} className={styles.toolTag}>
                          {tool}
                        </span>
                      ))}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}
