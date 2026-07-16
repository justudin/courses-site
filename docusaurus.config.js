// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const {themes: prismThemes} = require('prism-react-renderer');

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Applied INTelligence Lab',
  tagline: 'Applied INTelligence Lab (AINTLab) is not only a laboratory but also a playground to learn and explore things related to applied intelligence.',
  url: 'https://research.muhammadsyafrudin.com',
  baseUrl: '/',
  onBrokenLinks: 'throw',
  favicon: '/img/favicon.png',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  markdown: {
    format: 'detect',
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    },
  },

  plugins: [require.resolve('docusaurus-lunr-search')],

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: false,
        blog: {
          routeBasePath: '/updates',
          blogTitle: 'Recent updates',
          blogSidebarCount: 0,
          postsPerPage: 7,
          showReadingTime: true,
          feedOptions: {
            type: 'all',
            copyright: `Copyright © ${new Date().getFullYear()} Applied INTelligence Lab; Lead by Muhammad Syafrudin.`,
          },
        },
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      }),
    ],
  ],

  headTags: [
    // Preload the two most-used self-hosted Inter weights (body text + bold
    // headings) so they're discovered by the browser's preload scanner
    // immediately, instead of waiting on CSS to be parsed.
    {
      tagName: 'link',
      attributes: {
        rel: 'preload',
        href: '/fonts/inter/inter-400-latin.woff2',
        as: 'font',
        type: 'font/woff2',
        crossorigin: 'anonymous',
      },
    },
    {
      tagName: 'link',
      attributes: {
        rel: 'preload',
        href: '/fonts/inter/inter-700-latin.woff2',
        as: 'font',
        type: 'font/woff2',
        crossorigin: 'anonymous',
      },
    },
    // Declare some json-ld structured data
    {
      tagName: 'script',
      attributes: {
        type: 'application/ld+json',
      },
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org/',
        '@type': 'Organization',
        name: 'Applied INTelligence Lab',
        url: 'https://research.muhammadsyafrudin.com/',
        description: 'Applied INTelligence Lab - AINTLab is not only a laboratory but also a playground to learn and explore things related to applied intelligence. We explore the frontier of artificial intelligence, data science, and intelligent systems. We design AI-driven solutions that connect systems, enhance communication, and promote sustainability. Through collaboration across academia and industry, we aim to build systems that shape a smarter, more connected world. AINTLab is a hub for learning and innovation in applied intelligence and IoT. Pioneering Artificial Intelligence research, AINTLab focuses on machine learning, deep learning, IoT, and self-supervised learning. Our expertise drives agricultural innovation, vessel detection, human action recognition, and predictive analytics, promoting sustainable agriculture and global food security. Explore our extensive collection of research publications on AI, machine learning, IoT, and sustainable agriculture, featuring groundbreaking work on transformer models, predictive analytics, and more.',
        foundingDate: '2019',
        founder: {
          '@type': 'Person',
          name: 'Muhammad Syafrudin',
          identifier: [
            'https://www.wikidata.org/entity/Q61147698',
            'https://mathgenealogy.org/id.php?id=297235',
            'https://www.google.com/search?kgmid=/g/11fmgyc_gp',
            'https://orcid.org/0000-0002-5640-4413',
            'https://scholar.google.co.kr/citations?user=WLTzkOMAAAAJ&hl=en',
            'https://muhammadsyafrudin.com/',
            'https://courses.muhammadsyafrudin.com/',
            'https://research.muhammadsyafrudin.com/',
          ]
        },
        address: {
          '@type': 'PostalAddress',
          addressLocality: 'Seoul',
          addressCountry: 'KR'
        },
        contactPoint: {
          '@type': 'ContactPoint',
          'contactType': 'Contact Support',
          'email': 'hello@aintlab.com',
          'telephone': '+82-2-3408-1879'
        },
        sameAs: [
          'https://www.linkedin.com/company/aintlab',
        ],
        logo: 'https://research.muhammadsyafrudin.com/img/favicon.png',
      }),
    },
  ],

  themeConfig:{
    // Declare some <meta> tags
    metadata: [
      {name: 'keywords', content: 'Applied Intelligence Lab, AINTLab, AI research publications, artificial intelligence papers, machine learning publications, deep learning research, IoT research, RFID in supply chain, sustainable agriculture papers, self-supervised learning, self-organizing maps, vessel detection, human action recognition, transformer models, agricultural technology research, AgriTech publications, predictive analytics papers, AI for agriculture, AI-powered innovation, scientific articles, AI in agriculture, academic publications, AI research, machine learning, deep learning, artificial intelligence lab, IoT, RFID, sustainable agriculture, satellite imagery, AI-powered solutions, food security, agricultural data analysis, AgriTech solutions, AI innovation, Applied INTelligence Lab (AINTLab), Department of Artificial Intelligence and Data Science, Sejong University, Seoul 05006, Republic of Korea'},
      {name: 'twitter:card', content: 'Applied INTelligence Lab (AINTLab) - AINTLab is not only a laboratory but also a playground to learn and explore things related to applied intelligence. We explore the frontier of artificial intelligence, data science, and intelligent systems. We design AI-driven solutions that connect systems, enhance communication, and promote sustainability. Through collaboration across academia and industry, we aim to build systems that shape a smarter, more connected world. AINTLab is a hub for learning and innovation in applied intelligence and IoT. Pioneering Artificial Intelligence research, AINTLab focuses on machine learning, deep learning, IoT, and self-supervised learning. Our expertise drives agricultural innovation, vessel detection, human action recognition, and predictive analytics, promoting sustainable agriculture and global food security. Explore our extensive collection of research publications on AI, machine learning, IoT, and sustainable agriculture, featuring groundbreaking work on transformer models, predictive analytics, and more.'},
      {name: 'description', content: 'Applied INTelligence Lab (AINTLab) - AINTLab is not only a laboratory but also a playground to learn and explore things related to applied intelligence. We explore the frontier of artificial intelligence, data science, and intelligent systems. We design AI-driven solutions that connect systems, enhance communication, and promote sustainability. Through collaboration across academia and industry, we aim to build systems that shape a smarter, more connected world. AINTLab is a hub for learning and innovation in applied intelligence and IoT. Pioneering Artificial Intelligence research, AINTLab focuses on machine learning, deep learning, IoT, and self-supervised learning. Our expertise drives agricultural innovation, vessel detection, human action recognition, and predictive analytics, promoting sustainable agriculture and global food security. Explore our extensive collection of research publications on AI, machine learning, IoT, and sustainable agriculture, featuring groundbreaking work on transformer models, predictive analytics, and more.'},
      {name: 'og:image',content: 'https://research.muhammadsyafrudin.com/img/aintlab-social-media.png'},
    
    ],
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
      navbar: {
        title: '',
        logo: {
          alt: 'AINTLab is not only a laboratory but also a playground to learn and explore things related to applied intelligence. We explore the frontier of artificial intelligence, data science, and intelligent systems. We design AI-driven solutions that connect systems, enhance communication, and promote sustainability. Through collaboration across academia and industry, we aim to build systems that shape a smarter, more connected world.',
          src: '/img/favicon.svg',
          srcDark: '/img/favicon-dark.svg',
          width: 64,
          height: 64,
        },
        items: [
          {
            to: 'team',
            position: 'left',
            label: 'The Team',
          },
          {
            to: 'projects',
            position: 'left',
            label: 'Projects',
          },
          {
            to: 'publications',
            position: 'left',
            label: 'Publications',
          },
          {
            to: 'gallery',
            position: 'left',
            label: 'Gallery',
          },
          {
            to: 'updates',
            position: 'left',
            label: 'Updates',
          },
          {
            to: 'contact',
            position: 'left',
            label: 'Contact',
          },
          {
            href: 'https://courses.muhammadsyafrudin.com',
            position: 'right',
            label: 'Courses',
          }
        ],
      },
      footer: {
        style: 'dark',
        copyright: `<div class="footer-shell">
          <div class="footer-nav-row">
            <a href="/">Home</a>
            <a href="/team">The Team</a>
            <a href="/projects">Projects</a>
            <a href="/publications">Publications</a>
            <a href="/gallery">Gallery</a>
            <a href="/updates">Updates</a>
            <a href="/contact">Contact</a>
            <a href="/email-policy">Email Policy</a>
          </div>

          <p class="footer-copy">Copyright © ${new Date().getFullYear()} Applied INTelligence Lab; Lead by Muhammad Syafrudin. <br/>Built with <a href="/credits">Docusaurus & others.</a> Assisted with 🤖. <span>Follow us on</span>
            <a class="footer-social" href="https://www.linkedin.com/company/aintlab" target="_blank" rel="noopener noreferrer" aria-label="AINTLab LinkedIn">
              <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <title>Applied INTelligence Lab @ LinkedIn</title>
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"></path>
              </svg>
            </a></p>
        </div>`,
      },
      prism: {
        theme: prismThemes.github,
        darkTheme: prismThemes.dracula,
      },
  },
};

module.exports = config;
