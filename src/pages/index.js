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
import CinematicIntro from '@site/src/components/CinematicIntro';
import introSound from '@site/src/assets/intro-sound.mpeg';

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
  ignite: 'Introducing Applied INtelligence Lab.',
};

const SPIRIT_WORDS = [
  'Explore',
  'Curiosity',
  'Playground',
  'Research',
  'Collaboration',
];

// Accents the letters that spell the acronym in "Applied INtelligence Lab":
// the leading "A" of "Applied" plus the "IN" of "INtelligence" (A + IN = AIN).
function AccentedTitle({title}) {
  const idx = title.indexOf('IN');
  if (idx === -1) {
    return title;
  }
  return (
    <>
      <span className={styles.titleAccent}>{title.slice(0, 1)}</span>
      {title.slice(1, idx)}
      <span className={styles.titleAccent}>IN</span>
      {title.slice(idx + 2)}
    </>
  );
}

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  // null = no intro (returning visitor / reduced motion / no WebGL).
  // 'pending'…'spirit' = playing; 'done' = overlay fading out; 'closed' = gone.
  const [introPhase, setIntroPhase] = useState(null);
  const introApiRef = useRef(null);
  // Cinematic first-visit intro (CinematicIntro) replaces Hero3D's forge
  // intro. 'deciding' = pre-hydration/unknown (SSR renders this), 'show' =
  // covering the page, 'handoff' = timeline done, overlay fading over the
  // still-veiled page, 'reveal' = overlay still fading but the veil is
  // dropped so navbar/hero/main transition in underneath it, 'off' = gone.
  const [cinematic, setCinematic] = useState('deciding');

  // Same gating as Hero3D's forge intro: first visit, motion allowed, WebGL
  // available. When the cinematic plays, Hero3D stays unmounted until the
  // handoff so the forge intro doesn't start (or mark the intro seen) early.
  useEffect(() => {
    let play = false;
    try {
      play = window.localStorage.getItem('aintlab.introSeen.v1') !== '1';
    } catch (err) {
      play = false;
    }
    if (play && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      play = false;
    }
    if (play) {
      const probe = document.createElement('canvas');
      if (!(probe.getContext('webgl2') || probe.getContext('webgl'))) {
        play = false;
      }
    }
    if (play) {
      // Docusaurus rewrites <html>'s className during hydration, clobbering
      // the pre-paint intro-pending veil. Re-veil synchronously in this same
      // effects flush — waiting for the 'show' re-render's effect would leave
      // a frame or two of raw homepage before the gate mounts.
      document.documentElement.classList.add('intro-running');
    }
    setCinematic(play ? 'show' : 'off');
  }, []);

  const handleCinematicDone = useCallback(() => {
    // CinematicIntro wrote the seen-flag before firing this, so the Hero3D
    // that mounts now declines its forge intro. The overlay fades over ~1.9s
    // (styles.module.css); part-way through, the veil drops ('reveal') so the
    // navbar glide / hero resize / page fade all finish under the thinning
    // overlay — one continuous motion into the homepage.
    setCinematic('handoff');
    window.setTimeout(() => {
      setCinematic((current) => (current === 'handoff' ? 'reveal' : current));
    }, 800);
    window.setTimeout(() => {
      setCinematic((current) => (current === 'reveal' ? 'off' : current));
    }, 2500);
  }, []);

  const handleCinematicSkip = useCallback(() => {
    // CinematicIntro wrote the seen-flag already, so the Hero3D that mounts
    // here declines its own intro and the page reveals immediately.
    setCinematic('off');
  }, []);

  const replayIntro = useCallback(() => {
    // Re-arm and re-mount the cinematic on demand so it isn't a one-time-only
    // experience. Clearing the seen-flag lets it run its full course again;
    // 'show' unmounts Hero3D and re-veils the chrome while the gate is up.
    try {
      window.localStorage.removeItem('aintlab.introSeen.v1');
    } catch (err) {
      // Best effort.
    }
    document.documentElement.classList.add('intro-running');
    window.scrollTo({top: 0, behavior: 'auto'});
    setCinematic('show');
  }, []);

  const handleIntroPhase = useCallback((phase) => {
    // 'none' = Hero3D decided the intro won't play (returning visitor,
    // reduced motion, no WebGL) — jump straight to the closed state so the
    // pre-paint intro-pending veil is lifted.
    setIntroPhase(phase === 'none' ? 'closed' : phase);
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
  // Overlay mounted (still visible or fading)…
  const cinematicMounted =
    cinematic === 'show' || cinematic === 'handoff' || cinematic === 'reveal';
  // …vs. page chrome veiled ('reveal' keeps the overlay but frees the page).
  const cinematicVeiled = cinematic === 'show' || cinematic === 'handoff';
  const caption = INTRO_CAPTIONS[introPhase];

  // Cinema mode: hide the navbar (and progress bar) while either intro plays —
  // the class is styled in custom.css. Scrolling away mid-forge-intro counts
  // as a skip so the chrome is never left hidden (the cinematic overlay is
  // opaque and fixed, so scrolling under it is invisible and harmless).
  //
  // html.intro-pending (set pre-paint by the head script) is only cleared once
  // the intro's fate is known: either Hero3D reported a phase, or the
  // cinematic decision landed. Clearing it earlier would flash the navbar for
  // a frame between hydration and the veil class arriving.
  useEffect(() => {
    const root = document.documentElement;
    // Keep the pre-paint veil up until the cinematic decision has landed —
    // Hero3D's early 'none' relay (while suppressed) must not lift it, or the
    // homepage flashes for a frame before the cinematic gate mounts.
    if (cinematicMounted || (cinematic === 'off' && introPhase !== null)) {
      root.classList.remove('intro-pending');
      root.removeAttribute('data-intro-pending');
    }
    root.classList.toggle('intro-running', cinematicVeiled || introRunning);
    if (!introRunning) {
      return undefined;
    }
    const onScroll = () => {
      if (window.scrollY > window.innerHeight * 0.5 && introApiRef.current) {
        introApiRef.current.skip();
      }
    };
    window.addEventListener('scroll', onScroll, {passive: true});
    return () => {
      window.removeEventListener('scroll', onScroll);
    };
  }, [introRunning, introPhase, cinematic, cinematicMounted, cinematicVeiled]);

  // Safety net: never leave the veil class behind when the header unmounts.
  useEffect(() => {
    return () => {
      document.documentElement.classList.remove('intro-running');
    };
  }, []);

  return (
    <header id="hero" className={clsx('hero hero--primary', styles.heroBanner)}>
      {/* Hero3D is unmounted while the cinematic covers the page, then
          mounted fresh at the handoff. By then the seen-flag is set (done or
          skipped), so it declines its own forge intro and the page reveals
          under the fading overlay. */}
      {cinematic !== 'show' && (
        <Hero3D
          posterSrc={backgroundImg}
          alt={siteConfig.tagline}
          onIntroPhase={handleIntroPhase}
          introApiRef={introApiRef}
          suppressIntro={cinematic === 'deciding'}
        />
      )}
      {cinematicMounted && (
        <CinematicIntro
          audioSrc={introSound}
          fading={cinematic === 'handoff' || cinematic === 'reveal'}
          onDone={handleCinematicDone}
          onSkip={handleCinematicSkip}
        />
      )}
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
                <p className={styles.introEyebrow}>The spirit of Applied INtelligence Lab</p>
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
      {cinematic === 'off' && !introRunning && (
        <button
          type="button"
          className={clsx(styles.replayIntro, introRunning && styles.heroContentHidden)}
          onClick={replayIntro}
        >
          ▶ Replay intro
        </button>
      )}
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
        <h1 className="text--center">Why Applied INtelligence Lab.</h1>
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
            <Link className="button cta-secondary-btn button--lg" to="/prospective">Join The Lab</Link>
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
        <p className="text--center"><em>The scholarly lineage behind Applied INtelligence Lab.</em></p>
        <div className="row">
          <div className={clsx('col col--12')}>
            <div className={clsx(styles.genealogyFrame, 'reveal')}>
              <Svg loading="lazy" className={styles.genealogySvg} aria-label="Applied INtelligence Lab academic genealogy" role="img" />
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
