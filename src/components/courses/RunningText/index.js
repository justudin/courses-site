import React from 'react';
import styles from './styles.module.css';

export default function RunningText({ text, direction = 'left', variant = 'default' }) {
  const repeated = `${text} \u00A0\u00A0\u00A0\u2022\u00A0\u00A0\u00A0`;
  const content = repeated.repeat(12);

  return (
    <div className={`${styles.runningText} ${styles[variant]}`}>
      <div
        className={styles.track}
        style={{ animationDirection: direction === 'right' ? 'reverse' : 'normal' }}
      >
        <span className={styles.content}>{content}</span>
        <span className={styles.content} aria-hidden="true">{content}</span>
      </div>
    </div>
  );
}
