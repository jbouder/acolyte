import type * as Preset from '@docusaurus/preset-classic';
import type { Config } from '@docusaurus/types';
import { themes as prismThemes } from 'prism-react-renderer';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: 'Acolyte',
  tagline: 'A comprehensive web app of developer tools — API testing, analysis, and utilities',
  favicon: 'img/favicon.ico',

  // Set the production url of your site here
  url: 'https://jbouder.github.io',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/acolyte/',

  // GitHub pages deployment config.
  organizationName: 'jbouder', // Usually your GitHub org/user name.
  projectName: 'acolyte', // Usually your repo name.
  trailingSlash: false,

  onBrokenLinks: 'throw',
  markdown: {
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    },
  },

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang.
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          routeBasePath: '/', // Serve docs at the site root (docs-only mode)
          sidebarPath: './sidebars.ts',
          editUrl: 'https://github.com/jbouder/acolyte/tree/main/docs/',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/social-card.png',
    colorMode: {
      defaultMode: 'dark',
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'Acolyte',
      logo: {
        alt: 'Acolyte Logo',
        src: 'img/logo.png',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'docsSidebar',
          position: 'left',
          label: 'Docs',
        },
        {
          href: 'https://project-acolyte.vercel.app/',
          label: 'Live App',
          position: 'right',
        },
        {
          href: 'https://github.com/jbouder/acolyte',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            { label: 'Introduction', to: '/' },
            { label: 'Getting Started', to: '/getting-started/installation' },
            { label: 'Tools', to: '/tools/' },
          ],
        },
        {
          title: 'Project',
          items: [
            { label: 'GitHub', href: 'https://github.com/jbouder/acolyte' },
            { label: 'Issues', href: 'https://github.com/jbouder/acolyte/issues' },
            { label: 'Releases', href: 'https://github.com/jbouder/acolyte/releases' },
          ],
        },
        {
          title: 'More',
          items: [
            { label: 'License', href: 'https://github.com/jbouder/acolyte/blob/main/LICENSE.md' },
            { label: 'Next.js', href: 'https://nextjs.org/' },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Acolyte. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['bash', 'json', 'diff'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
