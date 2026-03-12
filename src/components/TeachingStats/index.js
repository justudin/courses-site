import React, { useEffect, useState } from 'react';
import { calculateStats } from '@site/src/data/teachingStats';
import styles from './styles.module.css';

const StatCard = ({ icon, number, label, suffix = '' }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const target = parseFloat(number);
    const increment = target / 100;
    const timer = setInterval(() => {
      setCount((prevCount) => {
        const newCount = prevCount + increment;
        if (newCount >= target) {
          clearInterval(timer);
          return target;
        }
        return newCount;
      });
    }, 20);

    return () => clearInterval(timer);
  }, [number]);

  const formatNumber = (num) => {
    if (typeof num === 'number' && !Number.isInteger(num)) {
      return num.toFixed(1);
    }
    return Math.floor(num);
  };

  return (
    <div className={styles.statCard}>
      <div className={styles.statIcon}>
        {icon}
      </div>
      <div className={styles.statNumber}>
        {formatNumber(count)}{suffix}
      </div>
      <div className={styles.statLabel}>
        {label}
      </div>
    </div>
  );
};

export default function TeachingStats() {
  const stats = calculateStats();

  return (
    <section id="TeachingExcellence" className={styles.statsSection}>
      <div className="container">
        <div className={styles.statsHeader}>
          <h2>Teaching Excellence</h2>
          <p>Delivering quality education with proven results</p>
        </div>
        
        <div className={styles.statsGrid}>
          <StatCard
            icon={
              <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 7.5V9M15 10.5V19L13.5 21H10.5L9 19V10.5L10.5 9H13.5M7 15.5C7.8 15.8 8.4 16.6 8.4 17.5H9V19.5H3V17.5H3.6C3.6 16.6 4.2 15.8 5 15.5V13.5L3.5 12H6.5L7 13.5"/>
              </svg>
            }
            number={stats.yearsExperience}
            label="Years of Experience"
            suffix="+"
          />
          
          <StatCard
            icon={
              <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3M5 19V5H19V19H5M17 17H7V15H17V17M17 13H7V11H17V13M17 9H7V7H17V9"/>
              </svg>
            }
            number={stats.totalCourses}
            label="Courses Taught"
          />
          
          <StatCard
            icon={
              <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                <path d="M16 4C16.55 4 17 4.45 17 5V19L14 17L12 18L10 17L7 19V5C7 4.45 7.45 4 8 4H16M8.5 8.5C8.5 9.33 9.17 10 10 10S11.5 9.33 11.5 8.5S10.83 7 10 7S8.5 7.67 8.5 8.5M14 8.5H15.5V7H14V8.5M10 14C8.67 14 7 14.67 7 16V16.5H13V16C13 14.67 11.33 14 10 14M14 12H15.5V10.5H14V12Z"/>
              </svg>
            }
            number={stats.totalStudents}
            label="Students Taught"
            suffix="+"
          />
          
          <StatCard
            icon={
              <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 17.27L18.18 21L16.54 13.97L22 9.24L14.81 8.62L12 2L9.19 8.62L2 9.24L7.46 13.97L5.82 21L12 17.27Z"/>
              </svg>
            }
            number={stats.averageEvaluation}
            label="Average Rating"
            suffix="/5.0"
          />
        </div>
        
        <div className={styles.statsFooter}>
          <p>
            *Statistics are automatically calculated from course evaluations and enrollment data
          </p>
        </div>
      </div>
    </section>
  );
}