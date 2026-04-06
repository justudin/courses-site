import React from 'react';
import Link from '@docusaurus/Link';
import RunningText from '@site/src/components/RunningText';
import styles from './styles.module.css';

export default function HeroSlider() {
  return (
    <div className={styles.heroSlider}>
      <div className={styles.sliderContainer}>
        <div className={styles.slideContent}>
          <div className={styles.slideBackground}>
            <video
              src="/welcome.mp4"
              autoPlay
              muted
              loop
              playsInline
              className={styles.slideVideo}
            />
            <div className={styles.slideOverlay}></div>
          </div>

          <div className="container">
            <div className={styles.slideText}>
              <h1 className={styles.slideTitle}>
                Begin Your Learning Journey
              </h1>
              <p className={styles.slideSubtitle}>
                Comprehensive courses designed to elevate your programming and
                data science skills — learn, build, and grow together.
              </p>
              <div className={styles.slideActions}>
                <Link
                  className={`button button--primary button--lg ${styles.primaryButton}`}
                  to="/learn/">
                  Explore Courses
                </Link>
                <Link
                  className={`button button--outline button--lg ${styles.secondaryButton}`}
                  to="#TeachingExcellence">
                  Learn More
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
      <RunningText text="Learning Together" />
    </div>
  );
}