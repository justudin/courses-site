import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.css';

const FeatureList = [
  {
    title: 'User-centered',
    Svg: require('@site/static/img/undraw_mountain_learning.svg').default,
    description: (
      <>
        Designed with respect to students' and current industry needs.
      </>
    ),
  },
  {
    title: 'Focus on What Matters',
    Svg: require('@site/static/img/undraw_tree_learning.svg').default,
    description: (
      <>
       Weekly outlines are provided in detail.
      </>
    ),
  },
  {
    title: 'Learning by doing',
    Svg: require('@site/static/img/undraw_react_learning.svg').default,
    description: (
      <>
        Practical assignments to experience the scenario in real life.
      </>
    ),
  },
];

function Feature({Svg, title, description}) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center">
        <Svg className={styles.featureSvg} role="img" />
      </div>
      <div className="text--center padding-horiz--md">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures() {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
