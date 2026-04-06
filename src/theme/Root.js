import React from 'react';
import BackToTop from '@site/src/components/BackToTop';

export default function Root({ children }) {
  return (
    <>
      {children}
      <BackToTop />
    </>
  );
}
