import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Zirodelta',
  description: 'Funding rate arbitrage for AI agents',
  base: '/',
  
  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }],
    ['meta', { name: 'theme-color', content: '#10b981' }]
  ],

  themeConfig: {
    
    nav: [
      { text: 'Home', link: '/' },
      { text: 'For Humans', link: '/humans/' },
      { text: 'For Agents', link: '/agents/' },
      { text: 'API', link: '/api/' },
      { text: 'Examples', link: '/examples/' }
    ],

    sidebar: {
      '/humans/': [
        {
          text: 'Getting Started',
          items: [
            { text: 'Installation', link: '/humans/' },
            { text: 'Quick Start', link: '/humans/quickstart' },
            { text: 'CLI Reference', link: '/humans/cli' },
            { text: 'TUI Dashboard', link: '/humans/tui' }
          ]
        },
        {
          text: 'Strategy Engine',
          items: [
            { text: 'Overview', link: '/humans/strategy' },
            { text: 'Risk Profiles', link: '/humans/risk-profiles' }
          ]
        }
      ],
      '/agents/': [
        {
          text: 'Agent Integration',
          items: [
            { text: 'SKILL.md', link: '/agents/' },
            { text: 'Autonomous Loop', link: '/agents/autonomous' },
            { text: 'Authentication', link: '/agents/auth' }
          ]
        }
      ],
      '/api/': [
        {
          text: 'API Reference',
          items: [
            { text: 'Overview', link: '/api/' },
            { text: 'SDK Methods', link: '/api/sdk' },
            { text: 'JSON-RPC', link: '/api/jsonrpc' }
          ]
        }
      ],
      '/examples/': [
        {
          text: 'Examples',
          items: [
            { text: 'Basic Usage', link: '/examples/' },
            { text: 'Strategy Engine', link: '/examples/strategy' },
            { text: 'Full Agent', link: '/examples/full-agent' }
          ]
        }
      ]
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/Zirodelta/agent-toolkit' },
      { icon: 'twitter', link: 'https://twitter.com/zirodelta' }
    ],

    footer: {
      message: 'Built for agents, by agents.',
      copyright: '© 2026 Zirodelta'
    },

    search: {
      provider: 'local'
    }
  }
})
