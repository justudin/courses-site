import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.css';
import Link from '@docusaurus/Link'


const MissionVisionList = [
  {
    title: 'Collaborate With AINTLab',
    description: (
      <>
        <em>We welcome research partners, visiting scholars, and industry collaborators who share our vision of advancing AI for a sustainable and connected world.</em>

        <br/><br/>At AINTLab, <b>collaboration is at the heart of everything we do.</b> We work across disciplines—from ML and intelligent systems to sustainability and DS—to build AI solutions that matter.
        <br/><br/>
        We actively collaborate with:
        <ul>
        <li><b>Universities and research institutes</b> on <Link to="/projects">joint projects</Link> and <Link to="/publications">publications.</Link></li>
        <li><b>Industry partners</b> seeking AI expertise in data analytics, and intelligent systems.</li>
        <li><b><Link to="/prospective">Students </Link>and <Link to="/alumni/#visiting-professorsresearchers">visiting researchers</Link></b> looking to learn, contribute, and grow in an innovative environment.</li>
        </ul>
        Meet <b><Link to="/team">Our Team</Link></b> or if you are interested in joining us, please read the <b><Link to="/prospective">Guidelines for Prospective Students.</Link></b>
</>
    ),
  },
  {
    title: 'Collaborator Network Map',
    description: (
      <>
      <em>Our collaboration map from the past five years.</em>
      <br/>
      <img loading="lazy" alt="Our collaboration map from the past five years" src="/team/collaboration_map.webp" width="686" height="364" className={styles.mapImage}/>
      <p className={styles.mapCaption}><em>If you are interested in collaborating with us, please <Link to="/contact">contact us.</Link></em></p>
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
        <h1 className="text--center">Collaborate With Us</h1>
        <p className="text--center"><em>A global collaboration ecosystem for academia, industry, and future researchers.</em></p>
        <div className="row">
          {MissionVisionList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
        
      </div>
    </section>
  );
}
