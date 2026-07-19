import React, {useEffect} from 'react';
import SearchBar from '@theme-original/SearchBar';
import {useThemeConfig} from '@docusaurus/theme-common';

// Wraps the Algolia SearchBar for two site-specific fit-ups:
//
// 1. Adds `agentStudio: true` to the Ask AI config: our assistant lives in
//    Algolia Agent Studio, but the theme's config validator rejects that flag
//    (as of @docusaurus/theme-search-algolia 3.10.2), so it can't be set in
//    docusaurus.config.js directly. Props passed here override
//    themeConfig.algolia (facebook/docusaurus#11581). Drop this once the
//    validator accepts `askAi.agentStudio`.
//
// 2. Strips the utm_* tracking params from the modal footer's "Powered by
//    Algolia" link, keeping the attribution and the bare website URL. The
//    modal mounts lazily into a body-level portal on first open, so this
//    watches the DOM rather than render output (same approach as
//    AskAiWidget/panel.js for the sidepanel).
export default function SearchBarWrapper(props) {
  const {algolia} = useThemeConfig();

  useEffect(() => {
    const clean = () => {
      document.querySelectorAll('.DocSearch-Logo a[href*="algolia.com"]').forEach((a) => {
        try {
          const bare = new URL(a.href).origin + '/';
          if (a.getAttribute('href') !== bare) a.href = bare;
        } catch (e) { /* leave the link untouched */ }
      });
    };
    clean();
    const observer = new MutationObserver(clean);
    observer.observe(document.body, {childList: true, subtree: true});
    return () => observer.disconnect();
  }, []);

  return (
    <SearchBar {...props} askAi={{...algolia.askAi, agentStudio: true}} />
  );
}
