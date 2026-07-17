import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.css';

const MissionVisionList = [
  {
    title: 'Our Mission',
    description: (
      <>
      Advance the science and application of <b>AI, machine learning, and data science</b> to create intelligent, sustainable, and interconnected systems — from smart cities and IoT to green computing.

      <br/><br/>Our research bridges theory and <b>real-world impact</b>, combining academic excellence with practical innovation.
      <br/><br/>
      <em>"AINTLab is not just a lab — it's a playground for ideas, collaboration, and discovery." (–Director, AINTLab)</em>
      </>
    ),
  },
  {
    title: 'Our Vision',
    description: (
      <>
        A world where <b>intelligent systems enhance human life responsibly and sustainably</b> — a hub where curiosity meets purpose.
<br/><br/>
We are committed to:
<br/>
        <ul>
        <li>Advancing <b>AI and intelligent systems</b> that are explainable and scalable.</li>
        <li>Building <b>collaborative bridges</b> across academia, industry, and research communities.</li>
        <li>Educating the next generation of <b>AI innovators</b>.</li>
        </ul>
      </>
    ),
  },

];

function Feature({ title, description }) {
  return (
    <div className={clsx('col col--6', styles.cardCol, 'reveal')}>
      <article className={styles.narrativeBlock}>
        <h2 className={styles.blockTitle}>{title}</h2>
        <div className={styles.blockContent}>{description}</div>
      </article>
    </div>
  );
}

export default function MissionVision() {
  return (
    <section className={styles.features} id="mission">
      <div className="container">
        <p className={styles.kicker}>Purpose</p>
        <h1 className="text--center">Mission & vision.</h1>
        <p className="text--center"><em>Where curiosity meets purpose.</em></p>
        <div className="row">
          {MissionVisionList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
        
      </div>
    </section>
  );
}
