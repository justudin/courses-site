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

// Brand fit-ups the library exposes no props for: a stable custom id on the
// panel (CSS hook for the AIN Lab watermark background) and stripping the
// utm_* tracking params from the powered-by link (attribution + plain URL
// stays). The panel is in the DOM from mount, so this lands immediately; the
// observer keeps it applied if the library ever re-renders the footer.
function useBrandFixups() {
  useEffect(() => {
    const apply = () => {
      const panel = document.querySelector('.DocSearch-Sidepanel');
      if (!panel) return;
      if (panel.id !== 'docsearch-sidepanel') {
        panel.id = 'docsearch-sidepanel';
      }
      // The stacking z-index lives on the library's body-level portal
      // wrapper, not on .DocSearch-Sidepanel — lift it above the floating
      // bubble (z 1190) so the open panel isn't overlapped in its corner,
      // still below the cinematic intro overlay (z 1200).
      let wrapper = panel;
      while (wrapper.parentElement && wrapper.parentElement !== document.body) {
        wrapper = wrapper.parentElement;
      }
      if (wrapper !== panel || wrapper.parentElement === document.body) {
        if (wrapper.style.zIndex !== '1195') wrapper.style.zIndex = '1195';
      }
      // The library doesn't forward header translations in this version
      // (panel.translations.header is accepted but never reaches the Header
      // component), so the title is renamed here. Exact-match so the
      // conversation-history screen title is left alone.
      const title = panel.querySelector('.DocSearch-Sidepanel-Title');
      if (title && title.textContent === 'Ask AI') {
        title.textContent = 'Ask AINBot';
      }
      // Powered-by link: attribution text stays, tracking goes — bare origin
      // only (no utm_* params, no referral path).
      panel.querySelectorAll('a[href*="algolia.com"]').forEach((a) => {
        try {
          const clean = new URL(a.href).origin + '/';
          if (a.getAttribute('href') !== clean) a.href = clean;
        } catch (e) { /* leave the link untouched */ }
      });
    };
    apply();
    const observer = new MutationObserver(apply);
    observer.observe(document.body, {childList: true, subtree: true});
    return () => observer.disconnect();
  }, []);
}

export default function AskAiPanel() {
  const theme = useSiteTheme();
  useBrandFixups();
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
            buttonText: 'Ask AINBot',
            buttonAriaLabel: 'Ask AINBot — the Applied INtelligence Lab AI assistant',
          },
        }}
        // suggestedQuestions stays off: it queries an
        // algolia_ask_ai_suggested_questions index this app doesn't have,
        // which throws an ApiError on every panel open.
        panel={{
          translations: {
            header: {
              title: 'Ask AINBot',
            },
            newConversationScreen: {
              introductionText:
                'Ask about our research, publications, projects, or how to collaborate with Applied INtelligence Lab.',
            },
            promptForm: {
              promptPlaceholderText: 'Ask AINBot about the lab…',
            },
            logo: {
              poweredByText: 'Powered by',
            },
          },
        }}
      />
    </div>
  );
}
