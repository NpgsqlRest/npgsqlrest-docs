import { defineConfig, HeadConfig } from 'vitepress'

const isProd = process.env.NODE_ENV === 'production'

const head: HeadConfig[] = [
  ['link', { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }],
  ['link', { rel: 'shortcut icon', href: '/favicon.ico' }],
  ['link', { rel: 'apple-touch-icon', sizes: '180x180', href: '/favicon.ico' }],
  ['meta', { property: 'og:type', content: 'website' }],
  ['meta', { property: 'og:title', content: 'NpgsqlRest - Automatic PostgreSQL Web Server' }],
  ['meta', { property: 'og:description', content: 'Create REST APIs for PostgreSQL databases in minutes. Zero code, zero config, automatic endpoints from your database schema.' }],
  ['meta', { property: 'og:image', content: 'https://npgsqlrest.github.io/logo.png' }],
  ['meta', { property: 'og:url', content: 'https://npgsqlrest.github.io' }],
  ['meta', { name: 'twitter:card', content: 'summary' }],
  ['meta', { name: 'twitter:title', content: 'NpgsqlRest - Automatic PostgreSQL Web Server' }],
  ['meta', { name: 'twitter:description', content: 'Create REST APIs for PostgreSQL databases in minutes. Zero code, zero config, automatic endpoints from your database schema.' }],
  ['meta', { name: 'twitter:image', content: 'https://npgsqlrest.github.io/logo.png' }]
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
      { text: 'Zero to CRUD API', link: '/blog/zero-to-crud-api-postgresql-tables-npgsqlrest' },
      { text: 'Database-Level Security', link: '/blog/database-level-security-postgresql-authentication' },
      { text: 'Multiple Auth Schemes & RBAC', link: '/blog/multiple-auth-schemes-rbac-external-providers' },
      { text: 'Passkey SQL Auth', link: '/blog/passkey-sql-auth' },
      { text: 'End-to-End Type Checking', link: '/blog/end-to-end-static-type-checking-postgresql-typescript' },
      { text: 'Real-Time Chat with SSE', link: '/blog/real-time-chat-postgresql-sse-npgsqlrest' },
      { text: 'External API Calls', link: '/blog/external-api-calls-postgresql-http-types' },
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
      { text: 'Optimization Labels 101', link: '/blog/optimization-labels-101' },
      { text: 'What Have Stored Procedures Done for Us?', link: '/blog/what-have-stored-procedures-ever-done-for-us' },
      { text: 'The Power of Simplicity', link: '/blog/the-power-of-simplicity' },
      { text: 'The NpgsqlRest Story', link: '/blog/npgsqlrest-story-told-without-ai' },
    ]
  },
  {
    text: 'Benchmarks & Comparisons',
    collapsed: false,
    items: [
      { text: 'Benchmark 2026', link: '/blog/postgresql-rest-api-benchmark-2026' },
      { text: 'NpgsqlRest vs PostgREST vs Supabase', link: '/blog/npgsqlrest-vs-postgrest-supabase-comparison' },
    ]
  }
]

export default defineConfig({
  title: 'NpgsqlRest - Automatic PostgreSQL Web Server',
  description: 'Automatic PostgreSQL Web Server - Create REST APIs for PostgreSQL databases in minutes.',
  base: '/',
  ignoreDeadLinks: 'localhostLinks',
  outDir: '../build/npgsqlrest.github.io', // Relative to docs folder, or use absolute path
  head,

  sitemap: {
    hostname: 'https://npgsqlrest.github.io'
  },

  themeConfig: {
    logo: '/favicon.ico',
    siteTitle: 'NpgsqlRest',
    nav: [
      { text: 'Guide', link: '/guide/' },
      { text: 'Examples', link: '/examples/' },
      {
        text: 'Reference',
        items: [
          { text: 'Annotations', link: '/annotations/' },
          { text: 'Configuration', link: '/config/' }
        ]
      },
      {
        text: 'Blog',
        items: [
          { text: 'Blog Posts', link: '/blog/' },
          { text: 'Changelog', link: '/guide/changelog/' }
        ]
      },
    ],

    sidebar: {
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
            { text: 'v3.12.0 (Latest)', link: '/guide/changelog/v3.12.0' },
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
      '/reference/': [
        {
          text: 'Annotations',
          items: [
            { text: 'Overview', link: '/reference/' }
          ]
        },
        {
          text: 'HTTP & Routing',
          items: [
            { text: 'HTTP', link: '/annotations/http' },
            { text: 'PATH', link: '/annotations/path' },
            { text: 'PROXY', link: '/annotations/proxy' },
            { text: 'PROXY_OUT', link: '/annotations/proxy-out' },
            { text: 'INTERNAL', link: '/annotations/internal' },
            { text: 'ENABLED', link: '/annotations/enabled' },
            { text: 'DISABLED', link: '/annotations/disabled' },
            { text: 'TAGS', link: '/annotations/tags' },
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
          text: 'Context & Security',
          items: [
            { text: 'USER_CONTEXT', link: '/annotations/user-context' },
            { text: 'USER_PARAMETERS', link: '/annotations/user-parameters' },
            { text: 'PARAM', link: '/annotations/param' },
            { text: 'PARAMETER_HASH', link: '/annotations/parameter-hash' },
            { text: 'DEFINE_PARAM', link: '/annotations/define-param' },
            { text: 'RESULT_NAME', link: '/annotations/result-name' },
            { text: 'SKIP', link: '/annotations/skip' },
            { text: 'CONNECTION', link: '/annotations/connection' },
            { text: 'SECURITY_SENSITIVE', link: '/annotations/security-sensitive' },
            { text: 'Custom Parameters', link: '/annotations/custom-parameters' }
          ]
        },
        {
          text: 'Configuration - Core',
          items: [
            { text: 'Top-Level Settings', link: '/config/top-level' },
            { text: 'Config Section', link: '/config/config-section' },
            { text: 'NpgsqlRest Options', link: '/config/npgsqlrest' },
            { text: 'Routine Options', link: '/config/routine-options' },
            { text: 'Connection Settings', link: '/config/connection' },
            { text: 'Server & SSL', link: '/config/server' }
          ]
        },
        {
          text: 'Configuration - Security',
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
          text: 'Configuration - Features',
          items: [
            { text: 'CRUD Source', link: '/config/crud' },
            { text: 'SQL File Source', link: '/config/sql-file-source' },
            { text: 'Proxy', link: '/config/proxy' },
            { text: 'OpenAPI', link: '/config/openapi' },
            { text: 'HTTP Files', link: '/config/http-files' },
            { text: 'Code Generation', link: '/config/codegen' },
            { text: 'Upload Options', link: '/config/uploads' },
            { text: 'Table Format', link: '/config/table-format' },
            { text: 'HTTP Client', link: '/config/http-client' }
          ]
        },
        {
          text: 'Configuration - Performance',
          items: [
            { text: 'Response Compression', link: '/config/response-compression' },
            { text: 'Cache Options', link: '/config/cache-options' },
            { text: 'Rate Limiter', link: '/config/rate-limiter' },
            { text: 'Command Retry', link: '/config/command-retry' },
            { text: 'Thread Pool', link: '/config/thread-pool' }
          ]
        },
        {
          text: 'Configuration - Infrastructure',
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
            { text: 'Changelog', link: '/guide/changelog/' }
          ]
        },
        ...blogPostsSidebar
      ],
      '/guide/': [
        {
          text: 'Getting Started',
          items: [
            { text: 'Overview', link: '/guide/' },
            { text: 'Installation', link: '/guide/installation' },
            { text: 'Quick Start', link: '/guide/quick-start' },
            { text: 'Configuration Guide', link: '/guide/configuration' },
            { text: 'Comment Annotations Guide', link: '/guide/annotations' },
            { text: 'FAQ & Troubleshooting', link: '/guide/faq' }
          ]
        },
        {
          text: 'Changelog',
          collapsed: false,
          items: [
            { text: 'Overview', link: '/guide/changelog/' },
            { text: 'v3.12.0 (Latest)', link: '/guide/changelog/v3.12.0' },
            { text: 'v3.11.x', link: '/guide/changelog/v3.11.1' },
            { text: 'v3.10.0', link: '/guide/changelog/v3.10.0' },
            { text: 'v3.9.0', link: '/guide/changelog/v3.9.0' },
            { text: 'v3.8.0', link: '/guide/changelog/v3.8.0' },
            { text: 'v3.7.0', link: '/guide/changelog/v3.7.0' },
            { text: 'v3.6.x', link: '/guide/changelog/v3.6.3' },
            { text: 'v3.5.0', link: '/guide/changelog/v3.5.0' },
            { text: 'v3.4.x', link: '/guide/changelog/v3.4.8' },
            { text: 'v3.3.x', link: '/guide/changelog/v3.3.1' },
            { text: 'v3.2.x', link: '/guide/changelog/v3.2.7' },
            { text: 'v3.1.x', link: '/guide/changelog/v3.1.3' },
            { text: 'v3.0.x', link: '/guide/changelog/v3.0.1' }
          ]
        },
        {
          text: 'Reference Links',
          collapsed: false,
          items: [
            { text: 'Examples', link: '/examples/' },
            { text: 'Annotations Reference', link: '/annotations/' },
            { text: 'Configuration Reference', link: '/config/' }
          ]
        },
        ...blogPostsSidebar
      ],
      '/annotations/': [
        {
          text: 'HTTP & Routing',
          items: [
            { text: 'Overview', link: '/annotations/' },
            { text: 'HTTP', link: '/annotations/http' },
            { text: 'PATH', link: '/annotations/path' },
            { text: 'INTERNAL', link: '/annotations/internal' },
            { text: 'ENABLED', link: '/annotations/enabled' },
            { text: 'DISABLED', link: '/annotations/disabled' },
            { text: 'TAGS', link: '/annotations/tags' },
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
            { text: 'TSCLIENT', link: '/annotations/tsclient' }
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
        ...blogPostsSidebar
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
            { text: 'CRUD Source', link: '/config/crud' },
            { text: 'SQL File Source', link: '/config/sql-file-source' },
            { text: 'Proxy', link: '/config/proxy' },
            { text: 'OpenAPI', link: '/config/openapi' },
            { text: 'HTTP Files', link: '/config/http-files' },
            { text: 'Code Generation', link: '/config/codegen' },
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
        ...blogPostsSidebar
      ]
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/NpgsqlRest/NpgsqlRest' },
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
      light: 'github-light',
      dark: 'github-dark'
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

        const label = lang || 'code'
        return `<details class="code-collapsible" open><summary>${label}</summary>${result}</details>`
      }
    }
  }
})