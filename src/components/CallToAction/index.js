import React from 'react';
import Link from '@docusaurus/Link';
import styles from './styles.module.css';

const links = [
  {
    title: 'Explore Courses',
    description: 'Browse all courses, syllabi, and semester offerings from 2019 to the present.',
    to: '/learn',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
      </svg>
    ),
  },
  {
    title: 'Student Reviews',
    description: 'Read honest feedback from hundreds of students across every semester.',
    to: '/reviews',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    title: 'Project Showcase',
    description: 'See real-world projects our students have built using what they learned.',
    to: '/showcase',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
      </svg>
    ),
  },
  {
    title: 'About & Philosophy',
    description: 'Learn the teaching values and human-centered approach behind every course.',
    to: '/about',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 16v-4" />
        <path d="M12 8h.01" />
      </svg>
    ),
  },
];

export default function CallToAction() {
  return (
    <section className={styles.cta}>
      <div className="container">
        <p className={styles.eyebrow}>Get Started</p>
        <h2 className={styles.heading}>Ready to Learn Together?</h2>
        <p className={styles.subtitle}>
          Whether you're exploring your first programming course or diving into
          machine learning research, there's a place for you here.
        </p>

        <div className={styles.linkGrid}>
          {links.map((link) => (
            <Link key={link.to} to={link.to} className={styles.linkCard}>
              <span className={styles.linkIcon}>{link.icon}</span>
              <span className={styles.linkTitle}>{link.title}</span>
              <span className={styles.linkDesc}>{link.description}</span>
              <span className={styles.arrow}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </span>
            </Link>
          ))}
        </div>

        <div className={styles.contactRow}>
          <a
            href="https://research.muhammadsyafrudin.com/contact"
            className={styles.contactLink}
            target="_blank"
            rel="noopener noreferrer"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
            Get in touch
          </a>
          <a
            href="https://research.muhammadsyafrudin.com"
            className={styles.contactLink}
            target="_blank"
            rel="noopener noreferrer"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
            Research site
          </a>
        </div>
      </div>
    </section>
  );
}
