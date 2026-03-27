import React from 'react';
import Layout from '@theme/Layout';

export default function AboutPage() {
  return (
    <Layout title="About" description="About courses and learning philosophy">
      <main>
        <div className="about-page">
          <section className="about-hero">
            <div className="container">
              <p className="about-eyebrow">Learning Philosophy</p>
              <h1>About</h1>
              <p className="about-lead">
                We prioritize practical, human-centered learning where students build
                skills by solving real problems together.
              </p>
            </div>
          </section>

          <section className="about-section">
            <div className="container">
              <h2>What We Believe</h2>
              <p className="about-section-intro">
                In memory of Professor Yong-Han Lee (1965-2017), this page reflects the
                values guiding every course.
              </p>

              <div className="about-belief-grid">
                <article className="about-belief-card">
                  <p>
                    Universities are primarily <span className="about-highlight">educational</span>{' '}
                    institutions.
                  </p>
                </article>
                <article className="about-belief-card">
                  <p>
                    Teaching and <span className="about-highlight">learning</span> should come before
                    research output.
                  </p>
                </article>
                <article className="about-belief-card">
                  <p>
                    The most effective method is{' '}
                    <span className="about-highlight">learning by doing</span>.
                  </p>
                </article>
                <article className="about-belief-card">
                  <p>
                    Students should actively join{' '}
                    <span className="about-highlight">practical research</span> and real-world
                    projects.
                  </p>
                </article>
                <article className="about-belief-card">
                  <p>
                    We run many projects while focusing on{' '}
                    <span className="about-highlight">practical</span> applications.
                  </p>
                </article>
                <article className="about-belief-card">
                  <p>
                    Continuous guidance and collaboration help students grow with
                    confidence.
                  </p>
                </article>
              </div>
            </div>
          </section>

          <section className="about-section">
            <div className="container">
              <h2>Motto</h2>
              <div className="about-motto-grid">
                <div className="about-motto-item about-passion">Passion for Research</div>
                <div className="about-motto-item about-compassion">Compassion for People</div>
                <div className="about-motto-item about-collegiality">
                  Collegiality with Colleagues
                </div>
                <div className="about-motto-item about-balance">Balance in Life</div>
              </div>
            </div>
          </section>

          <section className="about-section">
            <div className="container">
              <h2>Community and Partners</h2>
              <div className="about-misc-wrap">
                <p>
                  Muhammad Syafrudin is a member of the Oracle Academy Program, and
                  the Learning Hub platform is hosted and sponsored by Oracle Cloud.
                </p>

                <div className="about-logo-row">
                  <div className="about-logo-card">
                    <img src="/img/member-ebadge-2.png" alt="Oracle Academy member badge" />
                  </div>
                  <div className="about-logo-card">
                    <img src="/img/Oracle-Academy-cmyk.png" alt="Oracle Academy logo" />
                  </div>
                  <div className="about-logo-card">
                    <img src="/img/sejong.jpg" alt="Sejong University" />
                  </div>
                </div>
              </div>

              <p className="about-footnote">In memory of Professor Yong-Han Lee (1965-2017)</p>
            </div>
          </section>
        </div>
      </main>
    </Layout>
  );
}
