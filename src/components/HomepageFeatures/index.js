import React, { useState } from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import styles from './styles.module.css';

const FeatureList = [
  {
    id: 'industry-focused',
    title: 'Industry-Focused Learning',
    Svg: require('@site/static/img/undraw_mountain_learning.svg').default,
    shortDesc: 'Real-world curriculum designed with industry professionals',
    description: (
      <>
        Our curriculum is meticulously crafted in collaboration with industry experts,
        ensuring you learn the exact technologies, methodologies, and best practices
        that leading companies use in production environments.
      </>
    ),
    benefits: ['Industry-validated curriculum', 'Real company case studies', 'Current technology stack']
  },
  {
    id: 'hands-on',
    title: 'Project-Based Mastery',
    Svg: require('@site/static/img/undraw_react_learning.svg').default,
    shortDesc: 'Learn by building real applications and solving actual problems',
    description: (
      <>
        Every course centers around hands-on projects that simulate real development
        scenarios. You'll build complete applications, debug real issues, and
        experience the full software development lifecycle.
      </>
    ),
    benefits: ['Portfolio-ready projects', 'Code reviews & feedback', 'Industry workflows']
  },
  {
    id: 'progressive',
    title: 'Progressive Learning Path',
    Svg: require('@site/static/img/undraw_tree_learning.svg').default,
    shortDesc: 'Structured progression from basics to advanced mastery',
    description: (
      <>
        Our carefully designed learning path takes you from foundational concepts
        to advanced implementations. Each module builds upon previous knowledge
        with clear milestones and comprehensive assessments.
      </>
    ),
    benefits: ['Clear learning objectives', 'Progressive difficulty', 'Milestone assessments']
  }
];



function MainFeature({Svg, title, shortDesc, description, metrics, benefits, id}) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={styles.mainFeature}>
      <div className={styles.featureVisual}>
        <div className={styles.featureIconLarge}>
          <Svg className={styles.featureSvgLarge} role="img" />
        </div>
        {metrics && <div className={styles.featureMetric}>{metrics}</div>}
      </div>
      
      <div className={styles.featureContent}>
        <h3 className={styles.featureTitle}>{title}</h3>
        <p className={styles.featureShortDesc}>{shortDesc}</p>
        
        <div className={clsx(styles.featureDetail, isExpanded && styles.expanded)}>
          <div className={styles.featureDescription}>{description}</div>
          <ul className={styles.featureBenefits}>
            {benefits.map((benefit, index) => (
              <li key={index}>{benefit}</li>
            ))}
          </ul>
        </div>
        
        <button
          className={styles.expandButton}
          onClick={() => setIsExpanded(!isExpanded)}
          aria-expanded={isExpanded}
          aria-controls={`feature-${id}`}>
          {isExpanded ? 'Show Less' : 'Learn More'}
          <svg className={clsx(styles.expandIcon, isExpanded && styles.rotated)} viewBox="0 0 24 24">
            <path fill="currentColor" d="M7.41,8.58L12,13.17L16.59,8.58L18,10L12,16L6,10L7.41,8.58Z"/>
          </svg>
        </button>
      </div>
    </div>
  );
}



export default function HomepageFeatures() {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className={styles.featuresHeader}>
          <h2>Why Choose Our Courses?</h2>
          <p>
            Experience a learning environment designed for your success, with proven methodologies
            and continuous support throughout your journey.
          </p>
        </div>
        
        <div className={styles.mainFeaturesGrid}>
          {FeatureList.map((feature) => (
            <MainFeature key={feature.id} {...feature} />
          ))}
        </div>
        
        <div className={styles.featuresFooter}>
          <Link
            className={`button button--primary button--lg ${styles.ctaButton}`}
            to="/learn/">
            Start Your Journey
            <svg className={styles.buttonIcon} viewBox="0 0 24 24">
              <path fill="currentColor" d="M4,11V13H16L10.5,18.5L11.92,19.92L19.84,12L11.92,4.08L10.5,5.5L16,11H4Z"/>
            </svg>
          </Link>
          <Link
            className={`button button--secondary button--lg ${styles.ctaButton}`}
            to="/reviews">
            Read Success Stories
          </Link>
        </div>
      </div>
    </section>
  );
}
