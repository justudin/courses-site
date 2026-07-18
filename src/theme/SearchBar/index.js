import React from 'react';
import SearchBar from '@theme-original/SearchBar';
import {useThemeConfig} from '@docusaurus/theme-common';

// Wraps the Algolia SearchBar only to add `agentStudio: true` to the Ask AI
// config: our assistant lives in Algolia Agent Studio, but the theme's config
// validator rejects that flag (as of @docusaurus/theme-search-algolia 3.10.2),
// so it can't be set in docusaurus.config.js directly. Props passed here
// override themeConfig.algolia (facebook/docusaurus#11581). Drop this wrapper
// once the validator accepts `askAi.agentStudio`.
export default function SearchBarWrapper(props) {
  const {algolia} = useThemeConfig();
  return (
    <SearchBar {...props} askAi={{...algolia.askAi, agentStudio: true}} />
  );
}
