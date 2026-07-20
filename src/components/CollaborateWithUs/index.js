import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.css';
import Link from '@docusaurus/Link'
import CollabMap2D from '@site/src/components/CollabMap2D'


const MissionVisionList = [
  {
    title: 'Collaborate With Applied INtelligence Lab',
    description: (
      <>
        <em>We welcome research partners, visiting scholars, and industry collaborators who share our vision of advancing AI for a sustainable and connected world.</em>

        <br/><br/>At AIN Lab, <b>collaboration is at the heart of everything we do.</b> We work across disciplines—from ML and intelligent systems to sustainability and DS—to build AI solutions that matter.
        <br/><br/>
        We actively collaborate with:
        <ul>
        <li><b>Universities and research institutes</b> on <Link to="/projects">joint projects</Link> and <Link to="/publications">publications.</Link></li>
        <li><b>Industry partners</b> seeking AI expertise in data analytics, and intelligent systems.</li>
        <li><b><Link to="/prospective">Students </Link>and <Link to="/alumni/#visiting-professorsresearchers">visiting researchers</Link></b> looking to learn, contribute, and grow in an innovative environment.</li>
        </ul>
</>
    ),
  },
  {
    title: 'Collaborator Network Map',
    description: (
      <>
      <br/>
      <CollabMap2D minWorks={4} />
      <p className={styles.mapCaption}><em>Countries with 4+ co-authored works, live from our publication DOIs — or <Link to="/contact">contact us</Link> to join the map.</em></p>
      </>
    ),
  },
  
];

function Feature({ title, description }) {
  return (
    <div className={clsx('col col--6', styles.cardCol, 'reveal')}>
      <article className={styles.narrativeBlock}>
        <h2>{title}</h2>
        <div className={styles.narrativeBody}>{description}</div>
      </article>
      </div>
  );
}

export default function MissionVision() {
  return (
    <section className={styles.features} id="CollaborateWithUs">
      <div className="container">
        <p className={styles.kicker}>Partnership</p>
        <h1 className="text--center">Collaborate with us.</h1>
        <p className="text--center"><em>Academia, industry, and future researchers — together.</em></p>
        <div className="row">
          {MissionVisionList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
        
      </div>
    </section>
  );
}
