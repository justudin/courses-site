import React from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import StudentReviews from '@site/src/components/courses/StudentReviews';
import {calculateStats} from '@site/src/data/courses/teachingStats';

import styles from './index.module.css';

// Live figures from the course evaluation data
// (src/data/courses/teachingStats.js).
const stats = calculateStats();

const TEACHING_STATS = [
  {
    value: `${stats.yearsExperience}+`,
    label: 'Years teaching',
    detail: 'Lecturing since 2015, across two universities.',
    to: '/courses/learn',
  },
  {
    value: `${stats.totalCourses}`,
    label: 'Course offerings',
    detail: 'Semester by semester, from 2019 to the present.',
    to: '/courses/learn',
  },
  {
    value: `${stats.totalStudents}+`,
    label: 'Students taught',
    detail: 'Undergraduate and graduate, in Korean and English.',
    to: '/courses/showcase',
  },
  {
    value: `${stats.averageEvaluation}`,
    label: 'Average rating',
    detail: 'Out of 5.0, from official course evaluations.',
    to: '/courses/reviews',
  },
];

// The three ideas the courses are built on. Content comes from the former
// courses site's feature cards, reduced to the pillar form the research
// homepage uses for the same job.
const COURSE_PILLARS = [
  {
    title: 'Industry-focused learning',
    description:
      'Curriculum built with industry practice in mind, so the tools and methods are the ones used in production.',
  },
  {
    title: 'Project-based mastery',
    description:
      'Every course centres on building something real — complete applications, actual debugging, the full development cycle.',
  },
  {
    title: 'A progressive path',
    description:
      'Foundations first, then advanced work, with clear milestones so each module builds on the last.',
  },
];

function CoursesHero() {
  return (
    <header id="hero" className={clsx('hero hero--primary', styles.heroBanner)}>
      {/* Sits where Hero3D sits on the research homepage, so the global .hero
          scrim and bottom-anchored type treatment apply unchanged. */}
      <video
        className={styles.heroVideo}
        src="/courses/welcome.mp4"
        autoPlay
        muted
        loop
        playsInline
        aria-hidden="true"
      />
      <div className={clsx('container', styles.heroContent)}>
        <h1 className="hero__title">Begin your learning journey.</h1>
        <p className="hero__subtitle">
          Courses in programming, data, and machine learning — learn by building, and
          grow together.
        </p>
        <div className={styles.buttons}>
          <Link className="button button--secondary" to="/courses/learn">
            Explore courses
          </Link>
          <Link className="button white-btn" to="/courses/reviews">
            Read student reviews
          </Link>
        </div>
      </div>
      <a className={styles.scrollCue} href="#teaching-numbers" aria-label="Scroll to explore">
        <span className={styles.scrollCueChevron} aria-hidden="true" />
      </a>
    </header>
  );
}

function TeachingNumbers() {
  return (
    <section
      id="teaching-numbers"
      className={`${styles.numbersSection} section-with-bg-text bg-text--teaching`}>
      <div className="container">
        <p className={clsx(styles.kicker, 'text--center')}>Impact</p>
        <h1 className="text--center">By the numbers.</h1>
        <div className={styles.statMetrics}>
          {TEACHING_STATS.map((item) => (
            <Link
              key={item.label}
              to={item.to}
              className={clsx(styles.statMetric, styles.statLink, 'reveal')}>
              <div className={styles.statValue}>{item.value}</div>
              <h2 className={styles.statLabel}>{item.label}</h2>
              <p className={styles.statDetail}>{item.detail}</p>
            </Link>
          ))}
        </div>
        <p className={styles.statsFootnote}>
          Calculated from official course evaluations and enrolment data since 2019.
        </p>
      </div>
    </section>
  );
}

function WhyLearnHere() {
  return (
    <section
      id="why-learn-here"
      className={`${styles.whySection} section-with-bg-text bg-text--learning`}>
      <div className="container">
        <p className={clsx(styles.kicker, 'text--center')}>Approach</p>
        <h1 className="text--center">Why learn here.</h1>
        <p className="text--center">
          <em>Practical, hands-on, and built to carry into real work.</em>
        </p>
        <div className={styles.pillarList}>
          {COURSE_PILLARS.map((pillar) => (
            <div key={pillar.title} className={clsx(styles.pillarItem, 'reveal')}>
              <h2>{pillar.title}</h2>
              <p>{pillar.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function StartLearning() {
  return (
    <section
      id="start-learning"
      className={`${styles.ctaSection} section-with-bg-text bg-text--future`}>
      <div className="container">
        <div className={clsx(styles.ctaCard, 'reveal')}>
          <p className={styles.kicker}>Get started</p>
          <h1>Ready to start learning?</h1>
          <p>
            Browse the full catalog, see what students have built, or read how the
            courses are taught.
          </p>
          <div className={styles.ctaActions}>
            <Link className="button button--primary button--lg" to="/courses/learn">
              Browse the catalog
            </Link>
            <Link className="button cta-secondary-btn button--lg" to="/courses/about">
              How these courses work
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function CoursesHome() {
  return (
    <Layout
      title="Courses"
      description="Courses in programming, data, and machine learning, taught by Muhammad Syafrudin.">
      <CoursesHero />
      <main>
        <TeachingNumbers />
        <WhyLearnHere />
        <section id="student-voices" className="section-with-bg-text bg-text--success">
          <StudentReviews />
        </section>
        <StartLearning />
      </main>
    </Layout>
  );
}
