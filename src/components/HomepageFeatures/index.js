import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.css';


const FeatureList = [
  {
    title: 'Data',
    Svg: require('@site/static/img/undraw_mountain_learning.svg').default,
    items: [
      {
        label: 'Sensor & multimodal inputs',
        detail: 'IoT sensors, images/3D scans, biosignals and multimodal fusion.',
      },
      {
        label: 'Time-series & sequence streams',
        detail: 'Forecasting, fusion, sequence modelling pipelines.',
      },
      {
        label: 'Representation & features',
        detail: 'Autoencoders, representation learning, transfer & pixel-level feature engineering.',
      },
    ],
  },
  {
    title: 'Intelligence',
    Svg: require('@site/static/img/undraw_react_learning.svg').default,
    items: [
      {
        label: 'Deep & sequence learners + transformers',
        detail: 'CNNs, LSTM, hybrids, Tab/domain transformers and LLM methods.',
      },
      {
        label: 'Ensembles & optimization',
        detail: 'Stacking/bagging/meta-ensembles, hyperparameter tuning and meta-heuristics.',
      },
      {
        label: 'Explainability & structured models',
        detail: 'Explainable AI, graph-attention/graph methods, statistical & signal-fusion techniques.',
      },
    ],
  },
  {
    title: 'Applications',
    Svg: require('@site/static/img/undraw_tree_learning.svg').default,
    items: [
      {
        label: 'Health & human systems',
        detail: 'Medical diagnostics, physiological monitoring, pose/physiotherapy analysis.',
      },
      {
        label: 'Agri / environment / energy',
        detail: 'Plant disease detection, crop & AQI forecasting, flood risk, battery SOH and energy forecasting.',
      },
      {
        label: 'Industry & security',
        detail: 'Manufacturing, finance, cybersecurity / fraud detection.',
      },
    ],
  },
  
];

function Feature({Svg, title, items}) {
  return (
    <div className={clsx('col col--4', styles.cardCol, 'reveal')}>
      <article className={styles.card}>
      <div className={styles.iconWrap}>
        <Svg loading="lazy" className={styles.featureSvg} alt="Applied INtelligence Lab - Research Area" role="img" />
      </div>
      <div>
        <h2 className={styles.cardTitle}>{title}</h2>
        <div className={styles.cardBody}>
          <ul className={styles.detailList}>
            {items.map((item) => (
              <li key={item.label} className={styles.detailItem}>
                <details className={styles.detailDisclosure}>
                  <summary>{item.label}</summary>
                  <p>{item.detail}</p>
                </details>
              </li>
            ))}
          </ul>
        </div>
      </div>
      </article>
    </div>
  );
}

export default function HomepageFeatures() {
  return (
    <section className={styles.features} id="ResearchArea">
      <div className="container">
        <p className={styles.kicker}>Core domains</p>
        <h1 className="text--center">Research areas.</h1>
        <p className="text--center"><em>From raw data to applied intelligence.</em></p>
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
        
      </div>
    </section>
  );
}
