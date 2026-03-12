import React from 'react';
import Link from '@docusaurus/Link';
import styles from './styles.module.css';

const slides = [
  {
    id: 1,
    image: '/welcome.mp4',
    title: 'Begin Your Learning Journey',
    subtitle: 'Comprehensive courses designed to elevate your programming and data science skills',
    buttonText: 'Explore Courses',
    buttonLink: '/learn/',
    type: 'video'
  },
];

export default function HeroSlider() {
  const current = slides[0]; // Since we only have one slide

  return (
    <div className={styles.heroSlider}>
      <div className={styles.sliderContainer}>
        {/* Main slide content */}
        <div className={styles.slideContent}>
          <div className={styles.slideBackground}>
            {current.type === 'image' ? (
              <img
                src={current.image}
                alt={current.title}
                className={styles.slideImage}
              />
            ) : (
              <video
                src={current.image}
                autoPlay
                muted
                loop
                className={styles.slideVideo}
              />
            )}
            <div className={styles.slideOverlay}></div>
          </div>
          
          <div className="container">
            <div className={styles.slideText}>
              <h1 className={styles.slideTitle}>{current.title}</h1>
              <p className={styles.slideSubtitle}>{current.subtitle}</p>
              <div className={styles.slideActions}>
                <Link
                  className={`button button--primary button--lg ${styles.primaryButton}`}
                  to={current.buttonLink}>
                  {current.buttonText}
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
    </div>
  );
}