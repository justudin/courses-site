import React from 'react';
import Layout from '@theme/Layout';
import styles from './about.module.css';

export default function AboutPage() {
  return (
    <Layout title="About" description="About courses and learning philosophy">
      <main className={styles.page}>
        <section className={styles.hero}>
          <div className="container">
            <p className={styles.eyebrow}>Learning Philosophy</p>
            <h1>About</h1>
            <p className={styles.subtitle}>
              We prioritize practical, human-centered learning where students build
              skills by solving real problems together.
            </p>
          </div>
        </section>

        <section className={styles.section}>
          <div className="container">
            <h2 className={styles.sectionTitle}>What We Believe</h2>
            <p className={styles.sectionIntro}>
              In memory of Professor Yong-Han Lee (1965-2017), this page reflects the
              values guiding every course.
            </p>

            <div className={styles.beliefGrid}>
              <article className={styles.beliefCard}>
                <p>
                  Universities are primarily <span className={styles.highlight}>educational</span>{' '}
                  institutions.
                </p>
              </article>
              <article className={styles.beliefCard}>
                <p>
                  Teaching and <span className={styles.highlight}>learning</span> should come before
                  research output.
                </p>
              </article>
              <article className={styles.beliefCard}>
                <p>
                  The most effective method is{' '}
                  <span className={styles.highlight}>learning by doing</span>.
                </p>
              </article>
              <article className={styles.beliefCard}>
                <p>
                  Students should actively join{' '}
                  <span className={styles.highlight}>practical research</span> and real-world
                  projects.
                </p>
              </article>
              <article className={styles.beliefCard}>
                <p>
                  We run many projects while focusing on{' '}
                  <span className={styles.highlight}>practical</span> applications.
                </p>
              </article>
              <article className={styles.beliefCard}>
                <p>
                  Continuous guidance and collaboration help students grow with
                  confidence.
                </p>
              </article>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <div className="container">
            <h2 className={styles.sectionTitle}>Motto</h2>
            <div className={styles.mottoGrid}>
              <div className={`${styles.mottoItem} ${styles.passion}`}>Passion for Research</div>
              <div className={`${styles.mottoItem} ${styles.compassion}`}>Compassion for People</div>
              <div className={`${styles.mottoItem} ${styles.collegiality}`}>
                Collegiality with Colleagues
              </div>
              <div className={`${styles.mottoItem} ${styles.balance}`}>Balance in Life</div>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <div className="container">
            <h2 className={styles.sectionTitle}>Community and Partners</h2>
            <div className={styles.communityWrap}>
              <p>
                Muhammad Syafrudin is a member of the Oracle Academy Program, and
                the Learning Hub platform is hosted and sponsored by Oracle Cloud.
              </p>

              <div className={styles.logoRow}>
                <div className={styles.logoCard}>
                  <img src="/img/member-ebadge-2.png" alt="Oracle Academy member badge" />
                </div>
                <div className={styles.logoCard}>
                  <img src="/img/Oracle-Academy-cmyk.png" alt="Oracle Academy logo" />
                </div>
                <div className={styles.logoCard}>
                  <img src="/img/sejong.jpg" alt="Sejong University" />
                </div>
              </div>
            </div>

            <p className={styles.footnote}>In memory of Professor Yong-Han Lee (1965-2017)</p>
          </div>
        </section>
      </main>
    </Layout>
  );
}
