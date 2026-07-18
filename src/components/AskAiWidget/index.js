import React, {Suspense, lazy, useEffect, useState} from 'react';

// The DocSearch sidepanel (and its chunk of @docsearch/react) loads lazily
// and only in the browser: SSR renders nothing, hydration renders nothing,
// and the chunk is fetched after the page is interactive so the widget never
// competes with page content. Until it arrives there is simply no bubble —
// progressive enhancement, no layout shift.
const AskAiPanel = lazy(() => import(/* webpackChunkName: "ask-ai" */ './panel'));

export default function AskAiWidget() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setReady(true);
  }, []);
  if (!ready) {
    return null;
  }
  return (
    <Suspense fallback={null}>
      <AskAiPanel />
    </Suspense>
  );
}
