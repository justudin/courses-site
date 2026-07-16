import React, { useState } from 'react';
import projectsData from '../data/projects.data.json';
import styles from './projects.module.css';

const formatMonth = (dateString) => {
  if (!dateString) {
    return null;
  }

  const [year, month] = dateString.split('-');
  return `${year}.${month}`;
};

const formatPeriod = (project) => {
  if (project.periodLabel) {
    return project.periodLabel;
  }

  if (project.startDate && project.endDate) {
    return `${formatMonth(project.startDate)} - ${formatMonth(project.endDate)}`;
  }

  if (project.startDate) {
    return formatMonth(project.startDate);
  }

  return 'Dates not listed';
};

const formatFunding = (amount, currency = 'KRW') => {
  if (!amount) {
    return null;
  }

  return `${currency} ${Number(amount).toLocaleString('en-US')}`;
};

const getSortValue = (project) => {
  if (project.endDate) {
    return new Date(project.endDate).getTime();
  }

  if (project.periodLabel) {
    const years = (project.periodLabel.match(/\d{4}/g) || []).map(Number);

    if (years.length > 0) {
      return new Date(Math.max(...years), 11, 31).getTime();
    }
  }

  return 0;
};

const sortProjects = (projects) =>
  [...projects].sort((left, right) => getSortValue(right) - getSortValue(left) || left.title.localeCompare(right.title));

const currentProjects = sortProjects(projectsData.current);
const pastProjects = sortProjects(projectsData.past);
const allProjects = [...currentProjects, ...pastProjects];
const organizations = new Set(allProjects.map((project) => project.organization).filter(Boolean));
const archiveRoles = [...new Set(pastProjects.map((project) => project.role).filter(Boolean))].sort((left, right) =>
  left.localeCompare(right)
);
const archiveTypes = [...new Set(pastProjects.map((project) => project.type).filter(Boolean))].sort((left, right) =>
  left.localeCompare(right)
);
const years = allProjects.flatMap((project) => {
  if (project.startDate) {
    return [Number(project.startDate.slice(0, 4))];
  }

  return (project.periodLabel?.match(/\d{4}/g) || []).map(Number);
});

const portfolioStart = years.length > 0 ? Math.min(...years) : null;

const normalizeText = (value) => (value || '').toString().toLowerCase();

const matchesSearch = (project, query) => {
  if (!query) {
    return true;
  }

  const searchableText = [project.title, project.organization, project.program, project.role, project.type, formatPeriod(project)]
    .filter(Boolean)
    .map(normalizeText)
    .join(' ');

  return searchableText.includes(query);
};

function ProjectsCatalog() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [sortMode, setSortMode] = useState('period-desc');

  const normalizedQuery = normalizeText(searchQuery.trim());
  const displayedPastProjects = pastProjects
    .filter((project) => selectedRole === 'all' || project.role === selectedRole)
    .filter((project) => selectedType === 'all' || project.type === selectedType)
    .filter((project) => matchesSearch(project, normalizedQuery))
    .sort((left, right) => {
      if (sortMode === 'period-asc') {
        return getSortValue(left) - getSortValue(right) || left.title.localeCompare(right.title);
      }

      if (sortMode === 'period-desc') {
        return getSortValue(right) - getSortValue(left) || left.title.localeCompare(right.title);
      }

      if (sortMode === 'role-asc') {
        return left.role.localeCompare(right.role) || getSortValue(right) - getSortValue(left);
      }

      if (sortMode === 'role-desc') {
        return right.role.localeCompare(left.role) || getSortValue(right) - getSortValue(left);
      }

      if (sortMode === 'org-asc') {
        return left.organization.localeCompare(right.organization) || getSortValue(right) - getSortValue(left);
      }

      return left.title.localeCompare(right.title) || getSortValue(right) - getSortValue(left);
  });

  const resetArchiveControls = () => {
    setSearchQuery('');
    setSelectedRole('all');
    setSelectedType('all');
    setSortMode('period-desc');
  };

  return (
    <div className={styles.projectsCatalog}>
      <section className={styles.overviewPanel}>
    
        <div className={styles.metricsGrid}>
          <div className={`${styles.metricCard} reveal`}>
            <p className={styles.metricLabel}>Active</p>
            <p className={styles.metricValue}>{currentProjects.length}</p>
          </div>
          <div className={`${styles.metricCard} reveal`}>
            <p className={styles.metricLabel}>Archive</p>
            <p className={styles.metricValue}>{pastProjects.length}</p>
          </div>
          <div className={`${styles.metricCard} reveal`}>
            <p className={styles.metricLabel}>Institutions</p>
            <p className={styles.metricValue}>{organizations.size}</p>
          </div>
          <div className={`${styles.metricCard} reveal`}>
            <p className={styles.metricLabel}>Coverage</p>
            <p className={styles.metricValue}>{portfolioStart ? `${portfolioStart}-2026` : 'Portfolio'}</p>
          </div>
        </div>
      </section>

      <section className={styles.sectionBlock}>
        <div className={styles.sectionHeader}>
          <div>
            <p className={styles.sectionKicker}>Live Portfolio</p>
            <h2>Current projects</h2>
          </div>
        </div>

        <div className={styles.currentGrid}>
          {currentProjects.map((project) => (
            <article key={project.id} className={`${styles.currentCard} reveal`}>
              <div className={styles.cardBadgeRow}>
                <span className={styles.statusBadge}>Active</span>
                <span className={styles.typeBadge}>{project.type}</span>
              </div>

              <h3>{project.title}</h3>
              <p className={styles.cardOrg}>{project.organization}</p>
              {project.program ? <p className={styles.cardProgram}>{project.program}</p> : null}

              <dl className={styles.cardFacts}>
                <div>
                  <dt>Period</dt>
                  <dd>{formatPeriod(project)}</dd>
                </div>
                <div>
                  <dt>Role</dt>
                  <dd>{project.role}</dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.sectionBlock}>
        <div className={styles.sectionHeader}>
          <div>
            <p className={styles.sectionKicker}>Archive</p>
            <h2>Past projects</h2>
          </div>
        </div>

        <div className={styles.archiveToolbar}>
          <label className={`${styles.controlGroup} ${styles.searchControl}`}>
            <span className={styles.controlLabel}>Search archive</span>
            <input
              type="search"
              className={styles.controlField}
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search title, organization, role, or program"
            />
          </label>

          <label className={styles.controlGroup}>
            <span className={styles.controlLabel}>Filter by role</span>
            <select className={styles.controlField} value={selectedRole} onChange={(event) => setSelectedRole(event.target.value)}>
              <option value="all">All roles</option>
              {archiveRoles.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </label>

          <label className={styles.controlGroup}>
            <span className={styles.controlLabel}>Filter by type</span>
            <select className={styles.controlField} value={selectedType} onChange={(event) => setSelectedType(event.target.value)}>
              <option value="all">All types</option>
              {archiveTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>

          <label className={styles.controlGroup}>
            <span className={styles.controlLabel}>Order archive</span>
            <select className={styles.controlField} value={sortMode} onChange={(event) => setSortMode(event.target.value)}>
              <option value="period-desc">Period: Newest first</option>
              <option value="period-asc">Period: Oldest first</option>
              <option value="role-asc">Role A-Z</option>
              <option value="role-desc">Role Z-A</option>
              <option value="org-asc">Organization A-Z</option>
              <option value="title-asc">Title A-Z</option>
            </select>
          </label>

          <button type="button" className={styles.resetButton} onClick={resetArchiveControls}>
            Reset
          </button>
        </div>

        <p className={styles.resultsSummary}>{displayedPastProjects.length} archive project(s) shown.</p>

        <div className={styles.archiveFrame}>
          <table className={styles.archiveTable}>
            <thead>
              <tr>
                <th>Project</th>
                <th>Organization</th>
                <th>Program</th>
                <th>Period</th>
                <th>Role</th>
              </tr>
            </thead>
            <tbody>
              {displayedPastProjects.map((project) => (
                <tr key={project.id}>
                  <td data-label="Project">
                    <div className={styles.tableProjectCell}>
                      <p className={styles.tableTitle}>{project.title}</p>
                      <div className={styles.tableBadges}>
                        <span className={styles.typeBadge}>{project.type}</span>
                        {project.funding ? <span className={styles.fundingBadge}>{formatFunding(project.funding, project.currency)}</span> : null}
                      </div>
                    </div>
                  </td>
                  <td data-label="Organization">{project.organization}</td>
                  <td data-label="Program">{project.program || 'Collaborative research'}</td>
                  <td data-label="Period">{formatPeriod(project)}</td>
                  <td data-label="Role">
                    <span className={styles.rolePill}>{project.role}</span>
                  </td>
                </tr>
              ))}

              {displayedPastProjects.length === 0 ? (
                <tr>
                  <td data-label="Project" colSpan="5">
                    <p className={styles.emptyState}>No archive projects match the current search and filters.</p>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default ProjectsCatalog;