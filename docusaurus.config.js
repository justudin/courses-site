// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const lightCodeTheme = require('prism-react-renderer/themes/github');
const darkCodeTheme = require('prism-react-renderer/themes/dracula');

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Courses',
  tagline: 'Learning together with Muhammad Syafrudin',
  url: 'https://courses.muhammadsyafrudin.com',
  baseUrl: '/',
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',
  favicon: '/img/favicon.png',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'justudin', // Usually your GitHub org/user name.
  projectName: 'courses-site', // Usually your repo name.

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
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl:
            'https://github.com/justudin/courses-site/blob/main/',
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
            to: 'about',
            position: 'right',
            label: 'About',
          },
          {
            to: 'reviews',
            position: 'right',
            label: 'Reviews',
          },
          {
            href: 'https://learning.muhammadsyafrudin.com',
            position: 'right',
            label: 'Learning Hub',
          },
          {
            href: 'https://research.muhammadsyafrudin.com',
            position: 'right',
            label: 'Research',
          },
          {
            href: 'https://github.com/justudin/courses-site',
            label: 'GitHub',
            position: 'right',
          },
        ],
      },
      footer: {
        style: 'dark',
        copyright: `Copyright © ${new Date().getFullYear()} Courses by <a href="https://muhammadsyafrudin.com/" style="color:white"target="_blank">Muhammad Syafrudin</a>. Built with Docusaurus.`,
      },
      prism: {
        theme: lightCodeTheme,
        darkTheme: darkCodeTheme,
      },
    }),
};

module.exports = config;
