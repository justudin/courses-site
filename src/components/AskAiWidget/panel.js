import React, {useEffect, useState} from 'react';
import {DocSearchSidepanel} from '@docsearch/react/sidepanel';
// Import the stylesheets from @docsearch/css directly: @docsearch/react
// declares `sideEffects: false`, so importing its style re-export
// ('@docsearch/react/style/sidepanel') gets tree-shaken to nothing in
// production and the panel renders unstyled.
import '@docsearch/css/dist/_variables.css';
import '@docsearch/css/dist/sidepanel.css';
import './styles.css';

/**
 * Standalone Ask AI chat: a floating bubble (bottom-right) that opens the
 * DocSearch v4 Sidepanel chat backed by the lab's Algolia Agent Studio
 * assistant. Deliberately separate from the navbar keyword search
 * (@docusaurus/theme-search-algolia): that modal keeps its own Ask AI tab,
 * while this widget is available on every page without opening search.
 *
 * Keyboard: Ctrl/Cmd+I toggles the panel (built into the component).
 */
const ALGOLIA = {
  appId: 'EL5FDZ45P0',
  apiKey: 'aa7c0138715588bb95f31148084ec7d4', // public search-only key
  indexName: 'AIN Website',
  assistantId: '8af6b335-c3bf-4659-92cc-7d21d8221a49',
};

// This mounts from src/theme/Root.js, which sits ABOVE the theme's
// ColorModeProvider — useColorMode() is not available here, so track the
// html[data-theme] attribute directly (same approach as Hero3D).
function useSiteTheme() {
  const [theme, setTheme] = useState('light');
  useEffect(() => {
    const read = () =>
      document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    setTheme(read());
    const observer = new MutationObserver(() => setTheme(read()));
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });
    return () => observer.disconnect();
  }, []);
  return theme;
}

export default function AskAiPanel() {
  const theme = useSiteTheme();
  return (
    <div className="askai-widget">
      <DocSearchSidepanel
        appId={ALGOLIA.appId}
        apiKey={ALGOLIA.apiKey}
        indexName={ALGOLIA.indexName}
        assistantId={ALGOLIA.assistantId}
        agentStudio
        theme={theme}
        button={{
          variant: 'floating',
          translations: {
            buttonText: 'Ask AI',
            buttonAriaLabel: 'Ask the Applied INtelligence Lab AI assistant',
          },
        }}
        // suggestedQuestions stays off: it queries an
        // algolia_ask_ai_suggested_questions index this app doesn't have,
        // which throws an ApiError on every panel open.
        panel={{
          translations: {
            newConversationScreen: {
              introductionText:
                'Ask about our research, publications, projects, or how to collaborate with Applied INtelligence Lab.',
            },
            promptForm: {
              promptPlaceholderText: 'Ask about the lab…',
            },
          },
        }}
      />
    </div>
  );
}
