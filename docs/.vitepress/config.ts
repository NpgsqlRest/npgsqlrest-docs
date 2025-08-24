import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'NpgsqlRest - Automatic PostgreSQL Web Server',
  description: 'Automatic PostgreSQL Web Server - Create REST APIs for PostgreSQL databases in minutes.',
  base: '/',
  ignoreDeadLinks: true,
  outDir: '../build/npgsqlrest.github.io', // Relative to docs folder, or use absolute path
  head: [
    ['link', { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }],
    ['link', { rel: 'shortcut icon', href: '/favicon.ico' }],
    ['link', { rel: 'apple-touch-icon', sizes: '180x180', href: '/favicon.ico' }]
  ],
  
  themeConfig: {
    logo: '/favicon.ico',
    siteTitle: 'NpgsqlRest',
    nav: [
      { text: 'Guide', link: '/guide/' },
      { text: 'Configuration', link: '/config/' },
      { text: 'Examples', link: '/examples/' },
    ],

    sidebar: {
      '/guide/': [
        {
          text: 'Getting Started',
          items: [
            { text: 'Introduction', link: '/guide/' },
            { text: 'Quick Start', link: '/guide/quick-start' },
            { text: 'Installation', link: '/guide/installation' }
          ]
        },
        {
          text: 'Configuration',
          items: [
            { text: 'Options', link: '/guide/options' },
            { text: 'Authentication', link: '/guide/authentication' },
            { text: 'File Uploads', link: '/guide/uploads' }
          ]
        },
        {
          text: 'Advanced',
          items: [
            { text: 'Plugins', link: '/guide/plugins' },
            { text: 'CRUD Operations', link: '/guide/crud' },
            { text: 'Custom Types', link: '/guide/custom-types' }
          ]
        }
      ],

      '/config/': [
        {
          text: 'API Reference',
          items: [
            { text: 'Overview', link: '/api/' },
            { text: 'Middleware', link: '/api/middleware' },
            { text: 'Options', link: '/api/options' },
            { text: 'Extensions', link: '/api/extensions' }
          ]
        }
      ],
      '/examples/': [
        {
          text: 'Examples',
          items: [
            { text: 'Basic Setup', link: '/examples/' },
            { text: 'Authentication', link: '/examples/auth' },
            { text: 'File Upload', link: '/examples/upload' },
            { text: 'TypeScript Client', link: '/examples/typescript' }
          ]
        }
      ]

    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/vb-consulting/NpgsqlRest' }
    ],

    footer: {
      message:
        'Released under the MIT License.',
      copyright: 'Copyright © 2024 VB Consulting'
    },

    editLink: {
      pattern: 'https://github.com/vb-consulting/NpgsqlRest/edit/main/docs/:path',
      text: 'Edit this page on GitHub'
    },

    search: {
      provider: 'local'
    }
  },

  markdown: {
    theme: {
      light: 'github-light',
      dark: 'github-dark'
    },
    lineNumbers: true
  }
})