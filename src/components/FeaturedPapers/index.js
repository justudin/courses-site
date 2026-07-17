import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.css';
import Link from '@docusaurus/Link';


const FeatureList = [
  {
    title: 'FLTrans-Net: Transformer-based feature learning network for wheat head detection',
    img_url: "/img/wheat.webp",
    imgWidth: 700,
    imgHeight: 290,
    doi: "https://doi.org/10.1016/j.compag.2024.109706",
    outlet: "Published in Computers and Electronics in Agriculture (Elsevier, 2025) - SCIE (Q1); IF=8.9; Rank=2/94; IF(%)=1.6%.",
    details: [
      {
        label: 'Data',
        content: 'Wheat-field images with overlapping small spikes, complex backgrounds; multi-scale visual features for detection.',
      },
      {
        label: 'Intelligence',
        content: 'FLTrans-Net: transformer-based multi-scale fusion, spatial attention, and lightweight RetinaNet for noise-robust feature learning.',
      },
      {
        label: 'Applications',
        content: 'Real-time wheat-head detection for yield assessment and field management on resource-constrained devices.',
      },
    ],
  },
  {
    title: 'AE-BPNN: autoencoder and backpropagation neural network-based model for lithium-ion battery state of health estimation',
    img_url: "/img/battery.webp",
    imgWidth: 685,
    imgHeight: 247,
    doi: "https://doi.org/10.1038/s41598-025-12771-4",
    outlet: "Published in Scientific Reports (Nature Portfolio, 2025) - SCIE (Q1); IF=3.9; Rank=25/136; IF(%)=18.0%.",
    details: [
      {
        label: 'Data',
        content: 'EIS measurements from Li-ion cells across multiple temperatures and operating states.',
      },
      {
        label: 'Intelligence',
        content: 'AE-BPNN with SCG/RBP optimization for feature reduction and State-of-Health (SOH) estimation.',
      },
      {
        label: 'Applications',
        content: 'Accurate battery SOH prediction for energy storage systems.',
      },
    ],
  },
  {
    title: 'Tweeting Circular Economy: Unveiling Current Discourse Through Natural Language Processing',
    img_url: "/img/circulareconomy.webp",
    imgWidth: 700,
    imgHeight: 352,
    doi: "https://doi.org/10.1002/sd.3323",
    outlet: "Published in Sustainable Development (Wiley, 2025) - SSCI (Q1); IF=9.9; Rank=1/63; IF(%)=0.8%.",
    details: [
      {
        label: 'Data',
        content: '389k Twitter posts on circular economy (CE) (2012-2022).',
      },
      {
        label: 'Intelligence',
        content: 'NLP-based theme extraction and trend analysis.',
      },
      {
        label: 'Applications',
        content: 'Public insight for CE policy and stakeholder engagement.',
      },
    ],
  },
  
];

function Feature({img_url, imgWidth, imgHeight, doi, title, outlet, details}) {
  return (
    <div className={clsx('col col--4', styles.cardCol, 'reveal')}>
      <article className={styles.card}>
      <div className={styles.mediaWrap}>
        <img loading="lazy" alt={title} className={styles.featureSvg} role="img" src={img_url} width={imgWidth} height={imgHeight}/>
      </div>
      <div className={styles.contentWrap}>
        <h2 className={styles.paperTitle}>
        <Link to={doi}>{title}</Link>
        </h2>
        <div className={styles.paperBody}>
          <details className={styles.detailDisclosure}>
            <summary>Research Summary</summary>
            <ul className={styles.detailList}>
              {details.map((item) => (
                <li key={item.label} className={styles.detailItem}>
                  <span className={styles.summaryKey}>{item.label}</span>
                  <span className={styles.summaryValue}>{item.content}</span>
                </li>
              ))}
            </ul>
          </details>
        </div>
        <p className={styles.outlet}>{outlet}</p>
      </div>
      </article>
    </div>
  );
}

export default function HomepageFeatures() {
  return (
    <section className={styles.features} id="FeaturedResearch">
      <div className="container">
        <p className={styles.kicker}>Selected works</p>
        <h1 className="text--center">Featured research.</h1>
        <p className="text--center"><em>Highlights from Q1 journals — <Link to="/publications">view all publications</Link>.</em></p>
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      
      </div>
    </section>
  );
}
