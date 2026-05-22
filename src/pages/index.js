import React from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import HomepageFeatures from '@site/src/components/HomepageFeatures';
import MissionVision from '@site/src/components/MissionVision';
import RecentUpdates from '@site/src/components/RecentUpdates';
import FeaturedPapers from '@site/src/components/FeaturedPapers';
import CollaborateWithUs from '@site/src/components/CollaborateWithUs';
import backgroundVideo from '../assets/background.mp4';
import backgroundImg from '../assets/background.webp';
import LogoSlider from '@site/src/components/LogoSlider';

import styles from './index.module.css';

const LAB_STATS = [
  { value: '100+', label: 'Research Publications', detail: 'Journals, conferences, and books spanning AI, ML, and DS.' },
  { value: '20+', label: 'Global Collaborators', detail: 'Universities and research centers across multiple regions.' },
  { value: '2019-', label: 'Applied AI Journey', detail: 'Consistent output focused on practical and impactful intelligence.' },
];

const AINTLAB_PILLARS = [
  {
    title: 'Applied Intelligence First',
    description:
      'We build systems for real environments, translating advanced research into usable and measurable outcomes.',
  },
  {
    title: 'Playground for Discovery',
    description:
      'AINTLab is not only a laboratory but also a playground to explore ideas, test hypotheses, and iterate quickly.',
  },
  {
    title: 'Collaboration at the Core',
    description:
      'Our team works across disciplines and institutions to create responsible and scalable AI innovation.',
  },
];


function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header id="hero" className={clsx('hero hero--primary', styles.heroBanner)}>
    <video
        autoPlay
        loop
        muted
        playsInline
        className="background-video" 
      >
        <source src={backgroundVideo} type="video/mp4" alt={siteConfig.tagline}/>
        <img src={backgroundImg} alt={siteConfig.tagline} /> 
      </video>
      <div className="container">
        <h1 className="hero__title">{siteConfig.title}</h1>
        <p className="hero__subtitle">{siteConfig.tagline}</p>
        <div className={styles.buttons}>
          <Link
            className="button button--secondary"
            to="#lab-stats">
            Learn more about AINTLab
          </Link>
          <Link
            className="button white-btn"
            to="/contact">
            Collaborate with Us
          </Link>
        </div>
      </div>
    </header>
  );
}

function LabStats() {
  return (
    <section id="lab-stats" className={`${styles.labStats} section-with-bg-text bg-text--discovery`}>
      <div className="container">
        <h1 className="text--center">By The Numbers</h1>
        <p className="text--center"><em>AINTLab as a living playground for ideas, collaboration, and discovery.</em></p>
        <div className={styles.statMetrics}>
          {LAB_STATS.map((item) => (
            <div key={item.label} className={styles.statMetric}>
              <div className={styles.statValue}>{item.value}</div>
              <h2 className={styles.statLabel}>{item.label}</h2>
              <p className={styles.statDetail}>{item.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function WhyAINTLab() {
  return (
    <section id="why-aintlab" className={`${styles.whySection} section-with-bg-text bg-text--collaboration`}>
      <div className="container">
        <h1 className="text--center">Why AINTLab</h1>
        <p className="text--center"><em>The laboratory identity: rigorous research, human-centered design, and impactful deployment.</em></p>
        <div className={styles.pillarList}>
          {AINTLAB_PILLARS.map((pillar) => (
            <div key={pillar.title} className={styles.pillarItem}>
              <h2>{pillar.title}</h2>
              <p>{pillar.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function JoinAINTLab() {
  return (
    <section id="join-aintlab" className={`${styles.ctaSection} section-with-bg-text bg-text--future`}>
      <div className="container">
        <div className={styles.ctaCard}>
          <h1>Ready To Build The Next Applied Intelligence Breakthrough?</h1>
          <p>
            Join our ecosystem of researchers, students, and industry partners shaping AI systems for a smarter and more connected world.
          </p>
          <div className={styles.ctaActions}>
            <Link className="button button--primary button--lg" to="/publications">View Publications</Link>
            <Link className="button cta-secondary-btn button--lg" to="/prospective">Join AINTLab</Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function AcademicGenealogy() {
  const Svg = require('../assets/academic-genealogy.svg').default;
   return (
    <section className={`${styles.academic}`} id="academic-genealogy">
      <div className="container">
        <h1 className="text--center">Academic Genealogy</h1>
        <p className="text--center"><em>Tracing the scholarly lineage and academic mentorship network connected to AINTLab.</em></p>
        <div className="row">
          <div className={clsx('col col--12')}>
            <div className={styles.genealogyFrame}>
              <Svg loading="lazy" className={styles.genealogySvg} aria-label="AINTLab academic genealogy" role="img" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title={siteConfig.title}
      description={siteConfig.tagline}>
      <HomepageHeader />
      <main>
        <LabStats />
        <AcademicGenealogy />
        <WhyAINTLab />
        <section id="mission-vision">
          <MissionVision />
        </section>
        <section id="research-areas" className="section-with-bg-text bg-text--innovation">
          <HomepageFeatures />
        </section>
        <section id="collaborate" className="section-with-bg-text bg-text--aintlab">
          <CollaborateWithUs/>
        </section>
        <section id="partners">
          <LogoSlider />
        </section>
        <section id="featured-papers">
          <FeaturedPapers/>
        </section>
        <section id="recent-updates">
          <RecentUpdates />
        </section>
        <JoinAINTLab />
      </main>
    </Layout>
  );
}
