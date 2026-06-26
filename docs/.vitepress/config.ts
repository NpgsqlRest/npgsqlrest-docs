import { defineConfig, HeadConfig } from 'vitepress'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const isProd = process.env.NODE_ENV === 'production'

const HOSTNAME = 'https://npgsqlrest.github.io'
const DEFAULT_OG_IMAGE = `${HOSTNAME}/og-image.png`
const DOCS_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

const head: HeadConfig[] = [
  ['link', { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }],
  ['link', { rel: 'shortcut icon', href: '/favicon.ico' }],
  ['link', { rel: 'apple-touch-icon', sizes: '180x180', href: '/favicon.ico' }],
  ['link', { rel: 'alternate', type: 'application/rss+xml', title: 'NpgsqlRest Blog', href: '/feed.xml' }]
]

// Only add tracking script in production
if (isProd) {
  head.push([
    'script',
    {
      defer: '',
      'data-id': '101498393',
      src: '//static.getclicky.com/js'
    }
  ])
}

// Blog posts sidebar sections - reused across all sidebars
const blogPostsSidebar = [
  {
    text: 'Tutorials',
    collapsed: false,
    items: [
      { text: 'NpgsqlRest 3.20.0: Dart, Hooks & Tool Schemas', link: '/blog/npgsqlrest-3.20-dart-client-react-query-tool-schemas' },
      { text: 'Tests Are SQL Files Too', link: '/blog/npgsqlrest-3.19-sql-test-runner-watch-mode' },
      { text: 'PostgreSQL as MCP Tools for AI Agents', link: '/blog/mcp-server-postgresql-ai-tools-npgsqlrest' },
      { text: 'Case Study: 74 Endpoints, Zero Backend Code', link: '/blog/case-study-zero-backend-code' },
      { text: 'TypeScript Code Generation Walkthrough', link: '/blog/typescript-codegen-walkthrough' },
      { text: 'NpgsqlRest 3.13.0: Production Patterns', link: '/blog/npgsqlrest-3.13-production-patterns' },
      { text: 'SQL REST API', link: '/blog/sql-rest-api' },
      { text: 'SQL File Source', link: '/blog/sql-file-source-rest-api-from-plain-sql' },
      { text: 'Database-Level Security', link: '/blog/database-level-security-postgresql-authentication' },
      { text: 'Multiple Auth Schemes & RBAC', link: '/blog/multiple-auth-schemes-rbac-external-providers' },
      { text: 'Passkey SQL Auth', link: '/blog/passkey-sql-auth' },
      { text: 'End-to-End Type Checking', link: '/blog/end-to-end-static-type-checking-postgresql-typescript' },
      { text: 'Real-Time Chat with SSE', link: '/blog/real-time-chat-postgresql-sse-npgsqlrest' },
      { text: 'External API Calls', link: '/blog/external-api-calls-postgresql-http-types' },
      { text: 'Web Scraping with HTTP Types', link: '/blog/web-scraping-postgresql-http-types-xml' },
      { text: 'Reverse Proxy & AI Service', link: '/blog/reverse-proxy-postgresql-ai-service-npgsqlrest' },
      { text: 'Secure Image Uploads', link: '/blog/secure-image-uploads-postgresql-typescript' },
      { text: 'CSV & Excel Ingestion', link: '/blog/csv-excel-ingestion-postgresql-npgsqlrest' },
      { text: 'PostgreSQL BI Server', link: '/blog/postgresql-bi-server-excel-csv-basic-auth' },
    ]
  },
  {
    text: 'Feature Deep Dives',
    collapsed: false,
    items: [
      { text: 'Excel Exports Done Right', link: '/blog/excel-export-table-format-postgresql-npgsqlrest' },
      { text: 'Custom Types & Multiset', link: '/blog/custom-types-multiset-rest-api' },
      { text: 'Performance & High Availability', link: '/blog/performance-scalability-high-availability-npgsqlrest' },
      { text: 'What Have Stored Procedures Done for Us?', link: '/blog/what-have-stored-procedures-ever-done-for-us' },
      { text: 'The Power of Simplicity', link: '/blog/the-power-of-simplicity' },
    ]
  },
  {
    text: 'Benchmarks & Comparisons',
    collapsed: false,
    items: [
      { text: 'Benchmark 2026-07 (Series)', link: '/blog/benchmarks-2026-07/' },
      { text: 'Benchmark 2026 (January)', link: '/blog/postgresql-rest-api-benchmark-2026' },
      { text: 'NpgsqlRest vs PostgREST vs Supabase', link: '/blog/npgsqlrest-vs-postgrest-supabase-comparison' },
    ]
  }
]

// Strip markdown syntax to plain text for JSON-LD answer extraction
function mdToText(md: string): string {
  return md
    .replace(/```[\s\S]*?```/g, '')          // code fences
    .replace(/::: *(tip|info|warning|danger|details)[^\n]*\n([\s\S]*?):::/g, '$2') // containers
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // links -> text
    .replace(/[`*_]/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

// Build FAQPage JSON-LD from the H3 questions in guide/faq.md
function buildFaqJsonLd(): string {
  const src = fs.readFileSync(path.join(DOCS_DIR, 'guide/faq.md'), 'utf-8')
  const body = src.replace(/^---[\s\S]*?---/, '')
  const questions: { q: string; a: string }[] = []
  const parts = body.split(/^### /m).slice(1)
  for (const part of parts) {
    const nl = part.indexOf('\n')
    const q = part.slice(0, nl).trim()
    const answerMd = part.slice(nl + 1).split(/^#{2,3} /m)[0]
    const a = mdToText(answerMd).slice(0, 300)
    if (q && a) questions.push({ q, a })
  }
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: questions.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a }
    }))
  })
}

// Minimal frontmatter field reader for the RSS feed (title/description/date only)
function fmField(src: string, field: string): string | undefined {
  const fm = src.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  if (!fm) return undefined
  const m = fm[1].match(new RegExp(`^${field}:\\s*(.*)$`, 'm'))
  if (!m) return undefined
  return m[1].trim().replace(/^["']|["']$/g, '')
}

function xmlEscape(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

export default defineConfig({
  title: 'NpgsqlRest - Automatic PostgreSQL Web Server',
  titleTemplate: 'NpgsqlRest',
  description: 'Automatic PostgreSQL Web Server - Create REST APIs for PostgreSQL databases in minutes.',
  base: '/',
  lastUpdated: true,
  ignoreDeadLinks: 'localhostLinks',
  outDir: '../build/npgsqlrest.github.io', // Relative to docs folder, or use absolute path
  head,

  sitemap: {
    hostname: 'https://npgsqlrest.github.io',
    transformItems: (items) =>
      // Exclude unpublished drafts and redirect stubs that canonicalize elsewhere
      items.filter(i =>
        !i.url.includes('DRAFT') &&
        !i.url.includes('benchmark-2024') &&
        !i.url.includes('benchmark-2025'))
  },

  transformPageData(pageData) {
    const fm = pageData.frontmatter
    const fmHead: HeadConfig[] = fm.head ?? []
    const has = (key: string) =>
      fmHead.some(([tag, attrs]) => attrs && (attrs['property'] === key || attrs['name'] === key || (tag === 'link' && attrs['rel'] === key)))
    const get = (key: string) => {
      const entry = fmHead.find(([, attrs]) => attrs && (attrs['property'] === key || attrs['name'] === key))
      return entry?.[1]?.['content'] as string | undefined
    }

    const add: HeadConfig[] = []
    const pagePath = pageData.relativePath
      .replace(/(^|\/)index\.md$/, '$1')
      .replace(/\.md$/, '.html')
    const canonical = typeof fm.canonicalUrl === 'string' ? fm.canonicalUrl : `${HOSTNAME}/${pagePath}`
    const isHome = pageData.relativePath === 'index.md'
    const isBlogPost = /^blog\/(?!index\.md).+\.md$/.test(pageData.relativePath)
    const isDraft = /^blog\/.*DRAFT/.test(pageData.relativePath)
    const noindex = isDraft || fmHead.some(([, attrs]) => attrs && attrs['name'] === 'robots' && String(attrs['content']).includes('noindex'))

    if (isDraft && !has('robots')) {
      add.push(['meta', { name: 'robots', content: 'noindex, nofollow' }])
    }
    if (!noindex) {
      add.push(['link', { rel: 'canonical', href: canonical }])
      add.push(['meta', { property: 'og:url', content: canonical }])
    }

    const title = pageData.title || 'NpgsqlRest'
    const description = pageData.description || ''
    const ogImage = get('og:image') ?? DEFAULT_OG_IMAGE

    if (!has('og:type')) add.push(['meta', { property: 'og:type', content: isHome ? 'website' : 'article' }])
    if (!has('og:title')) add.push(['meta', { property: 'og:title', content: title }])
    if (description && !has('og:description')) add.push(['meta', { property: 'og:description', content: description }])
    if (!has('og:image')) add.push(['meta', { property: 'og:image', content: DEFAULT_OG_IMAGE }])
    if (!has('twitter:card')) add.push(['meta', { name: 'twitter:card', content: 'summary_large_image' }])
    if (!has('twitter:title')) add.push(['meta', { name: 'twitter:title', content: get('og:title') ?? title }])
    if (description && !has('twitter:description')) add.push(['meta', { name: 'twitter:description', content: get('og:description') ?? description }])
    if (!has('twitter:image')) add.push(['meta', { name: 'twitter:image', content: ogImage }])

    if (isBlogPost && fm.date) {
      const published = new Date(fm.date).toISOString()
      const modified = pageData.lastUpdated ? new Date(pageData.lastUpdated).toISOString() : published
      add.push(['meta', { property: 'article:published_time', content: published }])
      add.push(['script', { type: 'application/ld+json' }, JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: title,
        description,
        url: canonical,
        image: ogImage,
        datePublished: published,
        dateModified: modified,
        author: { '@type': 'Person', name: 'Vedran Bilopavlović', url: 'https://github.com/vb-consulting' },
        publisher: { '@type': 'Organization', name: 'NpgsqlRest', logo: { '@type': 'ImageObject', url: `${HOSTNAME}/logo.png` } },
        mainEntityOfPage: { '@type': 'WebPage', '@id': canonical }
      })])
    }

    if (isHome) {
      add.push(['script', { type: 'application/ld+json' }, JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: 'NpgsqlRest',
        description,
        url: `${HOSTNAME}/`,
        applicationCategory: 'DeveloperApplication',
        operatingSystem: 'Windows, Linux, macOS',
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        license: 'https://github.com/NpgsqlRest/NpgsqlRest/blob/master/LICENSE',
        downloadUrl: 'https://github.com/NpgsqlRest/NpgsqlRest/releases',
        softwareHelp: `${HOSTNAME}/guide/`,
        sameAs: ['https://github.com/NpgsqlRest/NpgsqlRest']
      })])
    }

    if (pageData.relativePath === 'guide/faq.md') {
      add.push(['script', { type: 'application/ld+json' }, buildFaqJsonLd()])
    }

    fm.head = [...fmHead, ...add]
  },

  async buildEnd(siteConfig) {
    // Generate RSS feed for the blog. Top-level posts are one item each;
    // a series subdirectory contributes a single item linking to its index page.
    const blogDir = path.join(DOCS_DIR, 'blog')
    const posts = fs.readdirSync(blogDir, { withFileTypes: true })
      .filter(e => !e.name.startsWith('DRAFT'))
      .map(e => {
        if (e.isDirectory()) {
          const indexPath = path.join(blogDir, e.name, 'index.md')
          if (!fs.existsSync(indexPath)) return null
          const src = fs.readFileSync(indexPath, 'utf-8')
          return {
            slug: `${e.name}/`,
            title: fmField(src, 'title'),
            description: fmField(src, 'description'),
            date: fmField(src, 'date')
          }
        }
        if (!e.name.endsWith('.md') || e.name === 'index.md') return null
        const src = fs.readFileSync(path.join(blogDir, e.name), 'utf-8')
        return {
          slug: e.name.replace(/\.md$/, '.html'),
          title: fmField(src, 'title'),
          description: fmField(src, 'description'),
          date: fmField(src, 'date')
        }
      })
      .filter(p => p && p.title && p.date)
      .sort((a, b) => b!.date!.localeCompare(a!.date!)) as { slug: string; title: string; description?: string; date: string }[]

    const items = posts.map(p => `    <item>
      <title>${xmlEscape(p.title!)}</title>
      <link>${HOSTNAME}/blog/${p.slug}</link>
      <guid>${HOSTNAME}/blog/${p.slug}</guid>
      <pubDate>${new Date(p.date! + 'T12:00:00Z').toUTCString()}</pubDate>
      ${p.description ? `<description>${xmlEscape(p.description)}</description>` : ''}
    </item>`).join('\n')

    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>NpgsqlRest Blog</title>
    <link>${HOSTNAME}/blog/</link>
    <atom:link href="${HOSTNAME}/feed.xml" rel="self" type="application/rss+xml"/>
    <description>Tutorials, deep dives, benchmarks, and release notes for NpgsqlRest — the automatic PostgreSQL web server.</description>
    <language>en-US</language>
${items}
  </channel>
</rss>
`
    fs.writeFileSync(path.join(siteConfig.outDir, 'feed.xml'), rss)
  },

  themeConfig: {
    logo: '/favicon.ico',
    siteTitle: 'NpgsqlRest',
    nav: [
      {
        text: 'Guide',
        items: [
          {
            text: 'Getting Started',
            items: [
              { text: 'Overview', link: '/guide/' },
              { text: 'Installation', link: '/guide/installation' },
              { text: 'Quick Start', link: '/guide/quick-start' }
            ]
          },
          {
            text: 'Topics',
            items: [
              { text: 'SQL File Endpoints', link: '/guide/sql-files' },
              { text: 'Configuration Guide', link: '/guide/configuration' },
              { text: 'Comment Annotations Guide', link: '/guide/annotations' },
              { text: 'Connection Management', link: '/guide/connections' },
              { text: 'Authentication', link: '/guide/authentication' },
              { text: 'Server-Sent Events', link: '/guide/sse' },
              { text: 'HTTP Custom Types', link: '/guide/http-types' },
              { text: 'Proxy Endpoints', link: '/guide/proxy' },
              { text: 'Testing', link: '/guide/testing' },
              { text: 'Logging', link: '/guide/logging' },
              { text: 'Claude Code Skill', link: '/guide/claude-code-skill' }
            ]
          },
          {
            text: 'Reference',
            items: [
              { text: 'FAQ & Troubleshooting', link: '/guide/faq' },
              { text: 'Changelog', link: '/guide/changelog/' }
            ]
          }
        ]
      },
      { text: 'Examples', link: '/examples/' },
      {
        text: 'Reference',
        items: [
          { text: 'Annotations', link: '/annotations/' },
          { text: 'Configuration', link: '/config/' }
        ]
      },
      { text: 'Blog', link: '/blog/' },
      { text: '❤️ Sponsor', link: '/support' },
    ],

    sidebar: {
      // Benchmark 2026-07 series: dedicated sidebar (longest-prefix match wins over /blog/)
      '/blog/benchmarks-2026-07/': [
        {
          text: 'Benchmark 2026-07',
          collapsed: false,
          items: [
            { text: 'Introduction', link: '/blog/benchmarks-2026-07/' },
            { text: 'Overall Analysis', link: '/blog/benchmarks-2026-07/analysis' },
            { text: 'NpgsqlRest Deep Dive', link: '/blog/benchmarks-2026-07/npgsqlrest' },
            { text: 'Raw Results', link: '/blog/benchmarks-2026-07/results' },
          ]
        },
        {
          text: 'Frameworks',
          collapsed: false,
          items: [
            { text: 'Go (net/http)', link: '/blog/benchmarks-2026-07/go' },
            { text: 'Swoole PHP', link: '/blog/benchmarks-2026-07/swoole' },
            { text: 'FastAPI', link: '/blog/benchmarks-2026-07/fastapi' },
            { text: 'Django', link: '/blog/benchmarks-2026-07/django' },
            { text: 'Fastify', link: '/blog/benchmarks-2026-07/fastify' },
            { text: 'Express', link: '/blog/benchmarks-2026-07/express' },
            { text: 'Bun', link: '/blog/benchmarks-2026-07/bun' },
            { text: 'Deno', link: '/blog/benchmarks-2026-07/deno' },
            { text: 'Actix-web', link: '/blog/benchmarks-2026-07/actix' },
            { text: 'Axum', link: '/blog/benchmarks-2026-07/axum' },
            { text: 'Spring Boot', link: '/blog/benchmarks-2026-07/spring-boot' },
            { text: '.NET 10 (EF & Dapper)', link: '/blog/benchmarks-2026-07/dotnet' },
            { text: 'PostgREST', link: '/blog/benchmarks-2026-07/postgrest' },
          ]
        },
        {
          text: 'Source & Data (GitHub)',
          collapsed: false,
          items: [
            { text: 'Benchmark code (branch)', link: 'https://github.com/NpgsqlRest/pg_function_load_tests/tree/202607131327' },
            { text: 'Raw dataset (results.csv)', link: 'https://github.com/NpgsqlRest/pg_function_load_tests/blob/202607131327/src/_k6/results/202607131327/results.csv' },
            { text: 'All blog posts', link: '/blog/' },
          ]
        }
      ],
      '/blog/': [
        ...blogPostsSidebar,
        {
          text: 'Other Links',
          collapsed: false,
          items: [
            { text: 'Guide', link: '/guide/' },
            { text: 'Annotations Reference', link: '/annotations/' },
            { text: 'Configuration Reference', link: '/config/' }
          ]
        }
      ],
      '/guide/changelog/': [
        {
          text: 'Changelog',
          items: [
            { text: 'Overview', link: '/guide/changelog/' },
            { text: 'v3.21.0 (Latest)', link: '/guide/changelog/v3.21.0' },
            { text: 'v3.20.0', link: '/guide/changelog/v3.20.0' },
            { text: 'v3.19.0', link: '/guide/changelog/v3.19.0' },
            { text: 'v3.18.2', link: '/guide/changelog/v3.18.2' },
            { text: 'v3.18.1', link: '/guide/changelog/v3.18.1' },
            { text: 'v3.18.0', link: '/guide/changelog/v3.18.0' },
            { text: 'v3.17.0', link: '/guide/changelog/v3.17.0' },
            { text: 'v3.16.3', link: '/guide/changelog/v3.16.3' },
            { text: 'v3.16.2', link: '/guide/changelog/v3.16.2' },
            { text: 'v3.16.1', link: '/guide/changelog/v3.16.1' },
            { text: 'v3.16.0', link: '/guide/changelog/v3.16.0' },
            { text: 'v3.15.2', link: '/guide/changelog/v3.15.2' },
            { text: 'v3.15.1', link: '/guide/changelog/v3.15.1' },
            { text: 'v3.15.0', link: '/guide/changelog/v3.15.0' },
            { text: 'v3.14.0', link: '/guide/changelog/v3.14.0' },
            { text: 'v3.13.0', link: '/guide/changelog/v3.13.0' },
            { text: 'v3.12.0', link: '/guide/changelog/v3.12.0' },
            { text: 'v3.11.1', link: '/guide/changelog/v3.11.1' },
            { text: 'v3.11.0', link: '/guide/changelog/v3.11.0' },
            { text: 'v3.10.0', link: '/guide/changelog/v3.10.0' },
            { text: 'v3.9.0', link: '/guide/changelog/v3.9.0' },
            { text: 'v3.8.0', link: '/guide/changelog/v3.8.0' },
            { text: 'v3.7.0', link: '/guide/changelog/v3.7.0' },
            { text: 'v3.6.3', link: '/guide/changelog/v3.6.3' },
            { text: 'v3.6.2', link: '/guide/changelog/v3.6.2' },
            { text: 'v3.6.1', link: '/guide/changelog/v3.6.1' },
            { text: 'v3.6.0', link: '/guide/changelog/v3.6.0' },
            { text: 'v3.5.0', link: '/guide/changelog/v3.5.0' },
            { text: 'v3.4.8', link: '/guide/changelog/v3.4.8' },
            { text: 'v3.4.7', link: '/guide/changelog/v3.4.7' },
            { text: 'v3.4.6', link: '/guide/changelog/v3.4.6' },
            { text: 'v3.4.5', link: '/guide/changelog/v3.4.5' },
            { text: 'v3.4.4', link: '/guide/changelog/v3.4.4' },
            { text: 'v3.4.3', link: '/guide/changelog/v3.4.3' },
            { text: 'v3.4.2', link: '/guide/changelog/v3.4.2' },
            { text: 'v3.4.1', link: '/guide/changelog/v3.4.1' },
            { text: 'v3.4.0', link: '/guide/changelog/v3.4.0' },
            { text: 'v3.3.1', link: '/guide/changelog/v3.3.1' },
            { text: 'v3.3.0', link: '/guide/changelog/v3.3.0' },
            { text: 'v3.2.7', link: '/guide/changelog/v3.2.7' },
            { text: 'v3.2.6', link: '/guide/changelog/v3.2.6' },
            { text: 'v3.2.4', link: '/guide/changelog/v3.2.4' },
            { text: 'v3.2.3', link: '/guide/changelog/v3.2.3' },
            { text: 'v3.2.2', link: '/guide/changelog/v3.2.2' },
            { text: 'v3.2.1', link: '/guide/changelog/v3.2.1' },
            { text: 'v3.2.0', link: '/guide/changelog/v3.2.0' },
            { text: 'v3.1.3', link: '/guide/changelog/v3.1.3' },
            { text: 'v3.1.2', link: '/guide/changelog/v3.1.2' },
            { text: 'v3.1.1', link: '/guide/changelog/v3.1.1' },
            { text: 'v3.1.0', link: '/guide/changelog/v3.1.0' },
            { text: 'v3.0.1', link: '/guide/changelog/v3.0.1' },
            { text: 'v3.0.0', link: '/guide/changelog/v3.0.0' }
          ]
        },
        {
          text: 'Other Links',
          collapsed: false,
          items: [
            { text: 'Guide', link: '/guide/' },
            { text: 'Annotations Reference', link: '/annotations/' },
            { text: 'Configuration Reference', link: '/config/' }
          ]
        }
      ],
      '/examples/': [
        {
          text: 'Examples',
          items: [
            { text: 'Overview', link: '/examples/' }
          ]
        },
        {
          text: 'Reference',
          items: [
            { text: 'Guide', link: '/guide/' },
            { text: 'Annotations Reference', link: '/annotations/' },
            { text: 'Configuration Reference', link: '/config/' },
            { text: 'Changelog', link: '/guide/changelog/' }
          ]
        }
      ],
      '/guide/': [
        {
          text: 'Getting Started',
          items: [
            { text: 'Overview', link: '/guide/' },
            { text: 'Installation', link: '/guide/installation' },
            { text: 'Quick Start', link: '/guide/quick-start' }
          ]
        },
        {
          text: 'Topics',
          items: [
            { text: 'SQL File Endpoints', link: '/guide/sql-files' },
            { text: 'Configuration Guide', link: '/guide/configuration' },
            { text: 'Comment Annotations Guide', link: '/guide/annotations' },
            { text: 'Connection Management', link: '/guide/connections' },
            { text: 'Authentication', link: '/guide/authentication' },
            { text: 'Server-Sent Events', link: '/guide/sse' },
            { text: 'HTTP Custom Types', link: '/guide/http-types' },
            { text: 'Proxy Endpoints', link: '/guide/proxy' },
            { text: 'Testing', link: '/guide/testing' },
            { text: 'Logging', link: '/guide/logging' },
            { text: 'Claude Code Skill', link: '/guide/claude-code-skill' }
          ]
        },
        {
          text: 'Reference',
          items: [
            { text: 'FAQ & Troubleshooting', link: '/guide/faq' },
            { text: 'Changelog', link: '/guide/changelog/' },
            { text: 'Examples', link: '/examples/' },
            { text: 'Annotations Reference', link: '/annotations/' },
            { text: 'Configuration Reference', link: '/config/' }
          ]
        }
      ],
      '/annotations/': [
        {
          text: 'HTTP & Routing',
          items: [
            { text: 'Overview', link: '/annotations/' },
            { text: 'HTTP', link: '/annotations/http' },
            { text: 'PATH', link: '/annotations/path' },
            { text: 'PROXY', link: '/annotations/proxy' },
            { text: 'PROXY_OUT', link: '/annotations/proxy-out' },
            { text: 'INTERNAL', link: '/annotations/internal' },
            { text: 'ENABLED', link: '/annotations/enabled' },
            { text: 'DISABLED', link: '/annotations/disabled' },
            { text: 'TAGS', link: '/annotations/tags' },
            { text: 'OPENAPI', link: '/annotations/openapi' },
            { text: 'MCP', link: '/annotations/mcp' },
            { text: 'HTTP CUSTOM TYPES', link: '/annotations/http-type' }
          ]
        },
        {
          text: 'Authorization',
          items: [
            { text: 'AUTHORIZE', link: '/annotations/authorize' },
            { text: 'ALLOW_ANONYMOUS', link: '/annotations/allow-anonymous' },
            { text: 'LOGIN', link: '/annotations/login' },
            { text: 'LOGOUT', link: '/annotations/logout' },
            { text: 'BASIC_AUTH', link: '/annotations/basic-auth' },
            { text: 'BASIC_AUTH_REALM', link: '/annotations/basic-auth-realm' },
            { text: 'BASIC_AUTH_COMMAND', link: '/annotations/basic-auth-command' }
          ]
        },
        {
          text: 'Request Configuration',
          items: [
            { text: 'REQUEST_PARAM_TYPE', link: '/annotations/request-param-type' },
            { text: 'REQUEST_HEADERS_MODE', link: '/annotations/request-headers-mode' },
            { text: 'REQUEST_HEADERS_PARAMETER_NAME', link: '/annotations/request-headers-parameter-name' },
            { text: 'BODY_PARAMETER_NAME', link: '/annotations/body-parameter-name' },
            { text: 'QUERY_STRING_NULL_HANDLING', link: '/annotations/query-string-null-handling' },
            { text: 'VALIDATE', link: '/annotations/validate' }
          ]
        },
        {
          text: 'Response Configuration',
          items: [
            { text: 'Response Headers', link: '/annotations/response-headers' },
            { text: 'RESPONSE_NULL_HANDLING', link: '/annotations/response-null-handling' },
            { text: 'NESTED', link: '/annotations/nested' },
            { text: 'SINGLE', link: '/annotations/single' },
            { text: 'VOID', link: '/annotations/void' },
            { text: 'RAW', link: '/annotations/raw' },
            { text: 'SEPARATOR', link: '/annotations/separator' },
            { text: 'NEW_LINE', link: '/annotations/new-line' },
            { text: 'COLUMN_NAMES', link: '/annotations/column-names' }
          ]
        },
        {
          text: 'Caching & Performance',
          items: [
            { text: 'CACHED', link: '/annotations/cached' },
            { text: 'CACHE_EXPIRES_IN', link: '/annotations/cache-expires-in' },
            { text: 'CACHE_PROFILE', link: '/annotations/cache-profile' },
            { text: 'BUFFER_ROWS', link: '/annotations/buffer-rows' },
            { text: 'COMMAND_TIMEOUT', link: '/annotations/command-timeout' },
            { text: 'RETRY_STRATEGY', link: '/annotations/retry-strategy' },
            { text: 'Interval Format', link: '/annotations/interval-format' }
          ]
        },
        {
          text: 'Server-Sent Events',
          items: [
            { text: 'SSE', link: '/annotations/sse' },
            { text: 'SSE_EVENTS_LEVEL', link: '/annotations/sse-events-level' },
            { text: 'SSE_EVENTS_SCOPE', link: '/annotations/sse-events-scope' }
          ]
        },
        {
          text: 'Upload & Policies',
          items: [
            { text: 'UPLOAD', link: '/annotations/upload' },
            { text: 'ERROR_CODE_POLICY', link: '/annotations/error-code-policy' },
            { text: 'RATE_LIMITER_POLICY', link: '/annotations/rate-limiter-policy' }
          ]
        },
        {
          text: 'Output & Code Generation',
          items: [
            { text: 'TABLE_FORMAT', link: '/annotations/table-format' },
            { text: 'TSCLIENT', link: '/annotations/tsclient' },
            { text: 'DARTCLIENT', link: '/annotations/dartclient' }
          ]
        },
        {
          text: 'Parameters',
          items: [
            { text: 'PARAM', link: '/annotations/param' },
            { text: 'PARAMETER_HASH', link: '/annotations/parameter-hash' },
            { text: 'ENCRYPT / DECRYPT', link: '/annotations/encrypt-decrypt' },
            { text: 'Parameter Value Substitution', link: '/annotations/parameter-substitution' },
            { text: 'Resolved Parameters', link: '/annotations/resolved-parameters' }
          ]
        },
        {
          text: 'SQL File Annotations',
          items: [
            { text: 'DEFINE_PARAM', link: '/annotations/define-param' },
            { text: 'RESULT_NAME', link: '/annotations/result-name' },
            { text: 'SKIP', link: '/annotations/skip' },
            { text: 'RETURNS', link: '/annotations/returns' }
          ]
        },
        {
          text: 'Test Files (--test)',
          items: [
            { text: 'TEST @setup', link: '/annotations/test-setup' },
            { text: 'TEST @teardown', link: '/annotations/test-teardown' },
            { text: 'TEST @connection', link: '/annotations/test-connection' },
            { text: 'TEST @tag', link: '/annotations/test-tag' },
            { text: 'TEST @claim', link: '/annotations/test-claim' },
            { text: 'TEST @response', link: '/annotations/test-response' }
          ]
        },
        {
          text: 'Context & Security',
          items: [
            { text: 'USER_CONTEXT', link: '/annotations/user-context' },
            { text: 'USER_PARAMETERS', link: '/annotations/user-parameters' },
            { text: 'CONNECTION', link: '/annotations/connection' },
            { text: 'SECURITY_SENSITIVE', link: '/annotations/security-sensitive' },
            { text: 'Custom Parameters', link: '/annotations/custom-parameters' }
          ]
        },
        {
          text: 'Other Links',
          collapsed: false,
          items: [
            { text: 'Guide', link: '/guide/' },
            { text: 'Configuration Reference', link: '/config/' },
            { text: 'Changelog', link: '/guide/changelog/' }
          ]
        },
      ],
      '/config/': [
        {
          text: 'Core Settings',
          items: [
            { text: 'Overview', link: '/config/' },
            { text: 'Latest Default Configuration', link: '/config/latest' },
            { text: 'Top-Level Settings', link: '/config/top-level' },
            { text: 'Config Section', link: '/config/config-section' },
            { text: 'NpgsqlRest Options', link: '/config/npgsqlrest' },
            { text: 'Routine Options', link: '/config/routine-options' },
            { text: 'Connection Settings', link: '/config/connection' },
            { text: 'Server & SSL', link: '/config/server' }
          ]
        },
        {
          text: 'Security',
          items: [
            { text: 'Authentication', link: '/config/auth' },
            { text: 'External OAuth', link: '/config/external-auth' },
            { text: 'Passkey Authentication', link: '/config/passkey-auth' },
            { text: 'Authentication Options', link: '/config/authentication-options' },
            { text: 'Claims Mapping', link: '/config/claims-mapping' },
            { text: 'Basic Auth Config', link: '/config/basic-auth-config' },
            { text: 'Validation', link: '/config/validation' },
            { text: 'Antiforgery', link: '/config/antiforgery' },
            { text: 'Data Protection', link: '/config/data-protection' },
            { text: 'CORS', link: '/config/cors' },
            { text: 'Security Headers', link: '/config/security-headers' },
            { text: 'Forwarded Headers', link: '/config/forwarded-headers' }
          ]
        },
        {
          text: 'Features',
          items: [
            { text: 'SQL File Source', link: '/config/sql-file-source' },
            { text: 'Test Runner', link: '/config/test-runner' },
            { text: 'Watch Mode', link: '/config/watch' },
            { text: 'Proxy', link: '/config/proxy' },
            { text: 'OpenAPI', link: '/config/openapi' },
            { text: 'MCP', link: '/config/mcp' },
            { text: 'HTTP Files', link: '/config/http-files' },
            { text: 'Code Generation', link: '/config/codegen' },
            { text: 'React Query Hooks', link: '/config/react-query' },
            { text: 'Dart Code Generation', link: '/config/dart-codegen' },
            { text: 'Upload Options', link: '/config/uploads' },
            { text: 'Table Format', link: '/config/table-format' },
            { text: 'HTTP Client', link: '/config/http-client' }
          ]
        },
        {
          text: 'Performance',
          items: [
            { text: 'Response Compression', link: '/config/response-compression' },
            { text: 'Cache Options', link: '/config/cache-options' },
            { text: 'Rate Limiter', link: '/config/rate-limiter' },
            { text: 'Command Retry', link: '/config/command-retry' },
            { text: 'Thread Pool', link: '/config/thread-pool' }
          ]
        },
        {
          text: 'Infrastructure',
          items: [
            { text: 'Logging', link: '/config/logging' },
            { text: 'Static Files', link: '/config/static-files' },
            { text: 'Error Handling', link: '/config/error-handling' },
            { text: 'Health Checks', link: '/config/health-checks' },
            { text: 'Stats', link: '/config/stats' }
          ]
        },
        {
          text: 'Other Links',
          collapsed: false,
          items: [
            { text: 'Guide', link: '/guide/' },
            { text: 'Annotations Reference', link: '/annotations/' }
          ]
        },
      ]
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/NpgsqlRest/NpgsqlRest' },
      {
        icon: {
          svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor"><path d="M7.655 14.916v-.001h-.002l-.006-.003-.018-.01a22.066 22.066 0 0 1-3.744-2.584C2.045 10.731 0 8.35 0 5.5 0 2.836 2.086 1 4.25 1 5.797 1 7.153 1.802 8 3.02 8.847 1.802 10.203 1 11.75 1 13.914 1 16 2.836 16 5.5c0 2.85-2.045 5.231-3.885 6.818a22.066 22.066 0 0 1-3.744 2.584l-.018.01-.006.003h-.002a.75.75 0 0 1-.69 0Z"/></svg>'
        },
        link: 'https://github.com/sponsors/NpgsqlRest',
        ariaLabel: 'Sponsor NpgsqlRest on GitHub'
      },
      {
        icon: {
          svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M22.957 7.21c-.004-3.064-2.391-5.576-5.191-6.482-3.478-1.125-8.064-.962-11.384.604C2.357 3.231 1.093 7.391 1.046 11.54c-.039 3.411.302 7.463 3.097 9.746 2.602 2.124 6.19 2.078 9.402 1.836 1.883-.142 3.939-.358 5.477-1.528 1.564-1.19 1.873-3.298 1.972-5.151.134-2.51.187-5.016-.037-7.233zm-2.55 7.703c-.078 1.593-.383 3.473-1.795 4.334-1.351.824-3.151.973-4.686 1.083-2.891.207-6.063.276-8.514-1.399C3.106 17.39 2.924 14.34 2.95 11.67c.03-3.206.678-6.721 3.654-8.375 2.756-1.531 6.556-1.727 9.544-.872 2.339.669 4.351 2.678 4.355 5.217.007 2.583-.016 5.168-.095 7.273z"/><path d="M16.088 5.19c-1.008-.542-2.607-.48-3.441.388-.568.591-.773 1.389-.8 2.172-.034.993.068 2.013.361 2.953.307.985 1.034 1.848 2.077 2.012.878.138 1.83-.088 2.458-.732.7-.718.88-1.81.877-2.779-.003-.989-.084-1.99-.423-2.91-.268-.726-.654-1.328-1.109-1.104zm-.294 5.482c-.182.462-.581.771-1.091.696-.532-.078-.859-.533-1.04-1.005-.248-.647-.327-1.375-.312-2.06.01-.46.095-.939.371-1.313.345-.467.993-.447 1.426-.115.41.315.607.835.74 1.32.18.66.211 1.675-.094 2.477zM8.4 10.394c.233 1.084.755 2.299 1.907 2.579.934.227 1.993-.165 2.434-1.048.455-.91.346-1.995.166-2.972-.165-.893-.46-1.885-1.207-2.445-.745-.559-1.832-.457-2.479.192-.84.843-.958 2.138-.955 3.277.001.147.119.364.134.417zm1.363-2.808c.302-.321.805-.336 1.14-.054.445.375.618 1.015.75 1.558.131.54.212 1.156.082 1.703-.1.423-.378.821-.84.882-.469.062-.886-.306-1.088-.704-.326-.644-.401-1.426-.381-2.148.013-.465.104-.993.337-1.237z"/></svg>'
        },
        link: 'https://patreon.com/vbconsulting',
        ariaLabel: 'Patreon'
      },
      {
        icon: {
          svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M20.216 6.415l-.132-.666c-.119-.598-.388-1.163-1.001-1.379-.197-.069-.42-.098-.57-.241-.152-.143-.196-.366-.231-.572-.065-.378-.125-.756-.192-1.133-.057-.325-.102-.69-.25-.987-.195-.4-.597-.634-.996-.788a5.723 5.723 0 00-.626-.194c-1-.263-2.05-.36-3.077-.416a25.834 25.834 0 00-3.7.062c-.915.083-1.88.184-2.75.5-.318.116-.646.256-.888.501-.297.302-.393.77-.177 1.146.154.267.415.456.692.58.36.162.737.284 1.123.366 1.075.238 2.189.331 3.287.37 1.218.05 2.437.01 3.65-.118.299-.033.598-.073.896-.119.352-.054.578-.513.474-.834-.124-.383-.457-.531-.834-.473-.466.074-.96.108-1.382.146-1.177.08-2.358.082-3.536.006a22.228 22.228 0 01-1.157-.107c-.086-.01-.18-.025-.258-.036-.243-.036-.484-.08-.724-.13-.111-.027-.111-.185 0-.212h.005c.277-.06.557-.108.838-.147h.002c.131-.009.263-.032.394-.048a25.076 25.076 0 013.426-.12c.674.019 1.347.067 2.017.144l.228.031c.267.04.533.088.798.145.392.085.895.113 1.07.542.055.137.08.288.111.431l.319 1.484a.237.237 0 01-.199.284h-.003c-.037.006-.075.01-.112.015a36.704 36.704 0 01-4.743.295 37.059 37.059 0 01-4.699-.304c-.14-.017-.293-.042-.417-.06-.326-.048-.649-.108-.973-.161-.393-.065-.768-.032-1.123.161-.29.16-.527.404-.675.701-.154.316-.199.66-.267 1-.069.34-.176.707-.135 1.056.087.753.613 1.365 1.37 1.502a39.69 39.69 0 0011.343.376.483.483 0 01.535.53l-.071.697-1.018 9.907c-.041.41-.047.832-.125 1.237-.122.637-.553 1.028-1.182 1.171-.577.131-1.165.2-1.756.205-.656.004-1.31-.025-1.966-.022-.699.004-1.556-.06-2.095-.58-.475-.458-.54-1.174-.605-1.793l-.731-7.013-.322-3.094c-.037-.351-.286-.695-.678-.678-.336.015-.718.3-.678.679l.228 2.185.949 9.112c.147 1.344 1.174 2.068 2.446 2.272.742.12 1.503.144 2.257.156.966.016 1.942.053 2.892-.122 1.408-.258 2.465-1.198 2.616-2.657.34-3.332.683-6.663 1.024-9.995l.215-2.087a.484.484 0 01.39-.426c.402-.078.787-.212 1.074-.518.455-.488.546-1.124.385-1.766zm-1.478.772c-.145.137-.363.201-.578.233-2.416.359-4.866.54-7.308.46-1.748-.06-3.477-.254-5.207-.498-.17-.024-.353-.055-.47-.18-.22-.236-.111-.71-.054-.995.052-.26.152-.609.463-.646.484-.057 1.046.148 1.526.22.577.088 1.156.159 1.737.212 2.48.226 5.002.19 7.472-.14.45-.06.899-.13 1.345-.21.399-.072.84-.206 1.08.206.166.281.188.657.162.974a.544.544 0 01-.169.364z"/></svg>'
        },
        link: 'https://buymeacoffee.com/vbilopavu',
        ariaLabel: 'Buy Me a Coffee'
      }
    ],


    editLink: {
      pattern: 'https://github.com/NpgsqlRest/npgsqlrest-docs/edit/main/docs/:path',
      text: 'Edit this page on GitHub'
    },

    search: {
      provider: 'local'
    }
  },

  markdown: {
    theme: {
      light: 'catppuccin-latte',
      dark: 'catppuccin-mocha'
    },
    lineNumbers: true,
    config: (md) => {
      // Wrap tables in a scrollable container for mobile
      const defaultTableOpen = md.renderer.rules.table_open || function (tokens, idx, options, env, self) {
        return self.renderToken(tokens, idx, options)
      }
      const defaultTableClose = md.renderer.rules.table_close || function (tokens, idx, options, env, self) {
        return self.renderToken(tokens, idx, options)
      }
      md.renderer.rules.table_open = function (tokens, idx, options, env, self) {
        return '<div class="table-container"><div class="table-wrapper">' + defaultTableOpen(tokens, idx, options, env, self)
      }
      md.renderer.rules.table_close = function (tokens, idx, options, env, self) {
        return defaultTableClose(tokens, idx, options, env, self) + '</div></div>'
      }

      const fence = md.renderer.rules.fence!
      md.renderer.rules.fence = (...args) => {
        const [tokens, idx, , env] = args
        const result = fence(...args)

        // Don't wrap frontpage or mermaid code blocks
        if (env?.relativePath === 'index.md') {
          return result
        }
        const lang = tokens[idx].info.trim().split(/\s+/)[0]
        if (lang === 'mermaid') {
          return result
        }

        // Don't wrap fences inside a ::: code-group container — the tab switcher
        // toggles the `active` class on the direct children of its .blocks div,
        // so an interposed <details> breaks tab switching.
        for (let i = idx - 1; i >= 0; i--) {
          const type = tokens[i].type
          if (type === 'container_code-group_open') {
            return result
          }
          if (type === 'container_code-group_close') {
            break
          }
        }

        const label = lang || 'code'
        return `<details class="code-collapsible" open><summary>${label}</summary>${result}</details>`
      }
    }
  }
})