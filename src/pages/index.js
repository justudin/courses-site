import React, {useCallback, useEffect, useRef, useState} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import HomepageFeatures from '@site/src/components/HomepageFeatures';
import MissionVision from '@site/src/components/MissionVision';
import RecentUpdates from '@site/src/components/RecentUpdates';
import FeaturedPapers from '@site/src/components/FeaturedPapers';
import CollaborateWithUs from '@site/src/components/CollaborateWithUs';
import backgroundImg from '../assets/background.webp';
import collaborations from '@site/src/data/collaborations.json';
import LogoSlider from '@site/src/components/LogoSlider';
import Hero3D from '@site/src/components/Hero3D';

import styles from './index.module.css';

// Live figures from the DOI-resolved collaboration data
// (src/data/collaborations.json, refreshed via `npm run generate:network`).
const LAB_STATS = [
  {
    value: `${Math.floor(collaborations.totals.publications / 10) * 10}+`,
    label: 'Publications',
    detail: 'Journals, conferences, and books across AI, ML, and data science.',
    to: '/publications',
  },
  {
    value: `${Math.floor(collaborations.totals.institutions / 10) * 10}+`,
    label: 'Global collaborators',
    detail: `Partner institutions across ${Math.floor(collaborations.totals.countries / 10) * 10}+ countries.`,
    to: '/networks',
  },
  {
    value: '2019',
    label: 'Igniting since',
    detail: 'Applied intelligence, from idea to impact.',
    to: '/updates',
  },
];

const AINTLAB_PILLARS = [
  {
    title: 'Applied intelligence first',
    description: 'Research built for real environments, with usable and measurable outcomes.',
  },
  {
    title: 'A playground for discovery',
    description: 'A place to explore ideas, test hypotheses, and iterate fast.',
  },
  {
    title: 'Collaboration at the core',
    description: 'Disciplines and institutions working together on responsible AI.',
  },
];


// First-visit intro captions, keyed by the scene's timeline phases
// (see Hero3D/scene.js). Kept to one short line per beat — the 3D is the story.
const INTRO_CAPTIONS = {
  forge: 'Every idea begins as a spark.',
  rise: 'We shape it into intelligence.',
  ignite: 'Introducing Applied INTelligence Lab.',
};

const SPIRIT_WORDS = [
  'Explore',
  'Curiosity',
  'Playground',
  'Research',
  'Collaboration',
];

// Wraps the "INT" in "Applied INTelligence Lab" in a gradient accent span.
function AccentedTitle({title}) {
  const idx = title.indexOf('INT');
  if (idx === -1) {
    return title;
  }
  return (
    <>
      {title.slice(0, idx)}
      <span className={styles.titleAccent}>INT</span>
      {title.slice(idx + 3)}
    </>
  );
}

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  // null = no intro (returning visitor / reduced motion / no WebGL).
  // 'pending'…'spirit' = playing; 'done' = overlay fading out; 'closed' = gone.
  const [introPhase, setIntroPhase] = useState(null);
  const introApiRef = useRef(null);

  const handleIntroPhase = useCallback((phase) => {
    setIntroPhase(phase);
    if (phase === 'done') {
      window.setTimeout(() => {
        setIntroPhase((current) => (current === 'done' ? 'closed' : current));
      }, 1000);
    }
  }, []);

  const skipIntro = useCallback(() => {
    if (introApiRef.current) {
      introApiRef.current.skip();
    }
  }, []);

  const introRunning = introPhase !== null && introPhase !== 'done' && introPhase !== 'closed';
  const caption = INTRO_CAPTIONS[introPhase];

  // Cinema mode: hide the navbar (and progress bar) while the intro plays —
  // the class is styled in custom.css. Scrolling away mid-intro counts as a
  // skip so the chrome is never left hidden.
  useEffect(() => {
    const root = document.documentElement;
    if (!introRunning) {
      root.classList.remove('intro-running');
      return undefined;
    }
    root.classList.add('intro-running');
    const onScroll = () => {
      if (window.scrollY > window.innerHeight * 0.5 && introApiRef.current) {
        introApiRef.current.skip();
      }
    };
    window.addEventListener('scroll', onScroll, {passive: true});
    return () => {
      window.removeEventListener('scroll', onScroll);
      root.classList.remove('intro-running');
    };
  }, [introRunning]);

  return (
    <header id="hero" className={clsx('hero hero--primary', styles.heroBanner)}>
      <Hero3D
        posterSrc={backgroundImg}
        alt={siteConfig.tagline}
        onIntroPhase={handleIntroPhase}
        introApiRef={introApiRef}
      />
      {introPhase !== null && introPhase !== 'closed' && (
        <div
          className={clsx(styles.introOverlay, introPhase === 'done' && styles.introOverlayDone)}
        >
          <div className={styles.introCaptions} aria-live="polite">
            {caption && (
              <p key={introPhase} className={styles.introCaption}>
                {caption}
              </p>
            )}
            {introPhase === 'spirit' && (
              <div className={styles.introSpiritWrap}>
                <p className={styles.introEyebrow}>The spirit of AINTLab</p>
                <ul className={styles.introSpirit}>
                  {SPIRIT_WORDS.map((word, i) => (
                    <li key={word} style={{animationDelay: `${0.15 + i * 0.3}s`}}>
                      {word}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          {introRunning && (
            <button type="button" className={styles.introSkip} onClick={skipIntro}>
              Skip intro
            </button>
          )}
        </div>
      )}
      <div
        className={clsx(
          'container',
          styles.heroContent,
          introRunning && styles.heroContentHidden,
        )}
      >
        <h1 className="hero__title">
          <AccentedTitle title={siteConfig.title} />
        </h1>
        <p className="hero__subtitle">
          Not just a laboratory — a playground for applied intelligence.
        </p>
        <div className={styles.buttons}>
          <Link className="button button--secondary" to="#lab-stats">
            Explore the lab
          </Link>
          <Link className="button white-btn" to="/contact">
            Collaborate with us
          </Link>
        </div>
      </div>
      <a
        className={clsx(styles.scrollCue, introRunning && styles.heroContentHidden)}
        href="#lab-stats"
        aria-label="Scroll to explore"
      >
        <span className={styles.scrollCueChevron} aria-hidden="true" />
      </a>
    </header>
  );
}

function LabStats() {
  return (
    <section id="lab-stats" className={`${styles.labStats} section-with-bg-text bg-text--discovery`}>
      <div className="container">
        <p className={clsx(styles.kicker, 'text--center')}>Impact</p>
        <h1 className="text--center">By the numbers.</h1>
        <div className={styles.statMetrics}>
          {LAB_STATS.map((item) => (
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
      </div>
    </section>
  );
}

function WhyAINTLab() {
  return (
    <section id="why-aintlab" className={`${styles.whySection} section-with-bg-text bg-text--collaboration`}>
      <div className="container">
        <p className={clsx(styles.kicker, 'text--center')}>Identity</p>
        <h1 className="text--center">Why AINTLab.</h1>
        <p className="text--center"><em>Rigor, curiosity, and impact — by design.</em></p>
        <div className={styles.pillarList}>
          {AINTLAB_PILLARS.map((pillar) => (
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

function JoinAINTLab() {
  return (
    <section id="join-aintlab" className={`${styles.ctaSection} section-with-bg-text bg-text--future`}>
      <div className="container">
        <div className={clsx(styles.ctaCard, 'reveal')}>
          <p className={styles.kicker}>Get involved</p>
          <h1>Ready to ignite the next breakthrough?</h1>
          <p>
            Join researchers, students, and partners shaping applied intelligence.
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
        <p className={clsx(styles.kicker, 'text--center')}>Lineage</p>
        <h1 className="text--center">Academic genealogy.</h1>
        <p className="text--center"><em>The scholarly lineage behind AINTLab.</em></p>
        <div className="row">
          <div className={clsx('col col--12')}>
            <div className={clsx(styles.genealogyFrame, 'reveal')}>
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
