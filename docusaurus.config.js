// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const {themes: prismThemes} = require('prism-react-renderer');

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Courses',
  tagline: 'Learning together with Muhammad Syafrudin',
  url: 'https://courses.muhammadsyafrudin.com',
  baseUrl: '/',
  onBrokenLinks: 'throw',
  favicon: '/img/favicon.png',

  markdown: {
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    },
  },

  // Even if you don't use internalization, you can use this field to set useful
  // metadata like html lang. For example, if your site is Chinese, you may want
  // to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          routeBasePath: '/learn',
          sidebarPath: require.resolve('./sidebars.js'),
        },
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      navbar: {
        title: '',
        logo: {
          alt: 'Learning together with Muhammad Syafrudin',
          src: '/img/courses.svg',
          srcDark: '/img/courses-dark.svg',
        },
        items: [
          {
            type: 'doc',
            docId: 'index',
            position: 'left',
            label: 'All Courses',
          },

          {
            to: 'reviews',
            position: 'left',
            label: 'Reviews',
          },
          {
            to: 'showcase',
            position: 'left',
            label: 'Showcase',
          },
          {
            to: 'about',
            position: 'left',
            label: 'About',
          },
          {
            to: 'https://research.muhammadsyafrudin.com/contact',
            position: 'right',
            label: 'Contact',
          },
          /**
          {
            href: 'https://learning.muhammadsyafrudin.com',
            position: 'right',
            label: 'Learning Hub',
          },
          */
          {
            href: 'https://research.muhammadsyafrudin.com',
            position: 'right',
            label: 'Research',
          },
        ],
      },
      footer: {
        style: 'dark',
        copyright: `<span class="footer-quote">"The beautiful thing about learning is that no one can take it away from you." - B.B. King</span><br />Copyright © 2019-${new Date().getFullYear()} Courses by Muhammad Syafrudin. Built with Docusaurus & assisted with 🤖.`,
      },
      docs: {
        sidebar: {
          hideable: true,
          autoCollapseCategories: true,
        },
      },
      prism: {
        theme: prismThemes.github,
        darkTheme: prismThemes.dracula,
      },
    }),
};

module.exports = config;
