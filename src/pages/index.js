import React from 'react';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import HomepageFeatures from '@site/src/components/HomepageFeatures';
import HeroSlider from '@site/src/components/HeroSlider';
import TeachingStats from '@site/src/components/TeachingStats';
import StudentReviews from '@site/src/components/StudentReviews';
import CallToAction from '@site/src/components/CallToAction';
import RunningText from '@site/src/components/RunningText';

export default function Home() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title={`Learning together with Muhammad Syafrudin`}
      description="Learning together with Muhammad Syafrudin">
      <HeroSlider />
      <main>
        <TeachingStats />
        <RunningText text="Teaching Excellence" variant="subtle" direction="right" />
        <StudentReviews />
        <RunningText text="Student Success" variant="subtle" />
        <HomepageFeatures />
        <RunningText text="Shaping the Future" variant="accent" direction="right" />
        <CallToAction />
      </main>
    </Layout>
  );
}
