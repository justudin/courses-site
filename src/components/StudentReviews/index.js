import React, { useState, useEffect } from 'react';
import clsx from 'clsx';
import { studentReviews } from '@site/src/data/studentReviews';
import styles from './styles.module.css';

function ReviewCard({ review, isActive }) {
  return (
    <div className={clsx(styles.reviewCard, isActive && styles.active)}>
      <div className={styles.quoteIcon}>
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M6,17C6,15 4,10.5 4,6C4,4.5 4.5,4 6,4V2C3.5,2 2,3.5 2,6C2,11.5 4,16 6,17M18,17C18,15 16,10.5 16,6C16,4.5 16.5,4 18,4V2C15.5,2 14,3.5 14,6C14,11.5 16,16 18,17"/>
        </svg>
      </div>
      
      <div className={styles.reviewContent}>
        <p className={styles.reviewText}>{review.reviewText}</p>
        
        <div className={styles.reviewMeta}>
          <div className={styles.courseInfo}>
            <span className={styles.courseName}>{review.courseName}</span>
            <span className={styles.semester}>{review.semester} {review.year}</span>
          </div>
          <div className={styles.studentName}>{review.studentName}</div>
        </div>
      </div>
    </div>
  );
}

function NavigationDots({ currentIndex, totalReviews, onDotClick }) {
  return (
    <div className={styles.navigationDots}>
      {Array.from({ length: totalReviews }, (_, index) => (
        <button
          key={index}
          className={clsx(styles.dot, index === currentIndex && styles.activeDot)}
          onClick={() => onDotClick(index)}
          aria-label={`Go to review ${index + 1}`} />
      ))}
    </div>
  );
}

export default function StudentReviews() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Detect mobile devices
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (!isAutoPlaying) return;

    // Longer interval on mobile for better UX
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => 
        prevIndex === studentReviews.length - 1 ? 0 : prevIndex + 1
      );
    }, isMobile ? 8000 : 6000); // 8s on mobile, 6s on desktop

    return () => clearInterval(interval);
  }, [isAutoPlaying, isMobile]);

  const handleDotClick = (index) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false);
    
    // Resume auto-play after longer timeout on mobile
    setTimeout(() => setIsAutoPlaying(true), isMobile ? 15000 : 10000);
  };

  const handlePrevClick = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? studentReviews.length - 1 : prevIndex - 1
    );
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), isMobile ? 15000 : 10000);
  };

  const handleNextClick = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === studentReviews.length - 1 ? 0 : prevIndex + 1
    );
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), isMobile ? 15000 : 10000);
  };

  return (
    <section className={styles.reviewsSection}>
      <div className="container">
        <div className={styles.reviewsHeader}>
          <h2>What Students Say</h2>
          <p>
            Discover how our courses have transformed careers and opened new opportunities
            for students across different disciplines and backgrounds.
          </p>
        </div>

        <div className={styles.reviewsSlider}>
          {!isMobile && (
            <button 
              className={clsx(styles.navButton, styles.prevButton)}
              onClick={handlePrevClick}
              aria-label="Previous review">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M15.41,16.58L10.83,12L15.41,7.41L14,6L8,12L14,18L15.41,16.58Z"/>
              </svg>
            </button>
          )}

          <div className={styles.reviewsContainer}>
            <div 
              className={styles.reviewsTrack}
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}>
              {studentReviews.map((review, index) => (
                <ReviewCard
                  key={review.id}
                  review={review}
                  isActive={index === currentIndex} />
              ))}
            </div>
          </div>

          {!isMobile && (
            <button 
              className={clsx(styles.navButton, styles.nextButton)}
              onClick={handleNextClick}
              aria-label="Next review">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M8.59,16.58L13.17,12L8.59,7.41L10,6L16,12L10,18L8.59,16.58Z"/>
              </svg>
            </button>
          )}
        </div>

        <NavigationDots
          currentIndex={currentIndex}
          totalReviews={studentReviews.length}
          onDotClick={handleDotClick} />

        <div className={styles.autoPlayIndicator}>
          <div className={clsx(styles.playIcon, isAutoPlaying && styles.playing)}>
            <svg viewBox="0 0 24 24" fill="currentColor">
              {isAutoPlaying ? (
                <path d="M8,5.14V19.14L19,12.14L8,5.14Z" />
              ) : (
                <path d="M14,19.14H18V5.14H14M6,19.14H10V5.14H6V19.14Z" />
              )}
            </svg>
          </div>
          <span className={styles.autoPlayText}>
            {isAutoPlaying ? 'Auto-playing' : 'Paused'}
          </span>
        </div>
      </div>
    </section>
  );
}