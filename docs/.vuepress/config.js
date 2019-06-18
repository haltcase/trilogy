'use strict'

const { readFileSync } = require('fs')
const addContainers = require('./containers')

const changelogTitle = '# changelog\n\n'

module.exports = {
  title: 'trilogy',
  description: 'No-hassle SQLite with a document store style API',
  plugins: [
    '@vuepress/back-to-top'
  ],
  additionalPages: [
    {
      path: '/about/changelog.html',
      content: changelogTitle + readFileSync('changelog.md')
    },
    {
      path: '/about/license.html',
      frontmatter: {
        sidebar: false
      },
      content: readFileSync('license')
    }
  ],
  themeConfig: {
    repo: 'citycide/trilogy',
    nav: [
      {
        text: 'home',
        link: '/'
      },
      {
        text: 'learn',
        items: [
          {
            text: 'Guide',
            link: '/guide/'
          },
          {
            text: 'API',
            link: '/reference/api'
          },
          {
            text: 'Backends',
            link: '/reference/backends'
          }
        ]
      },
      {
        text: 'contribute',
        items: [
          {
            text: 'Issues',
            link: 'https://github.com/citycide/trilogy/issues'
          },
          {
            text: 'Pull Requests',
            link: 'https://github.com/citycide/trilogy/pulls'
          },
          {
            items: [
              {
                text: 'Contributor Guide',
                link: 'https://github.com/citycide/trilogy/blob/next/.github/contributing.md#contributor-guide'
              },
              {
                text: 'Code of Conduct',
                link: 'https://github.com/citycide/trilogy/blob/next/.github/code_of_conduct.md#contributor-covenant-code-of-conduct'
              }
            ]
          }
        ]
      },
      {
        text: 'about',
        items: [
          {
            text: 'Changelog',
            link: '/about/changelog'
          },
          {
            text: 'License',
            link: '/about/license'
          }
        ]
      }
    ],
    sidebar: {
      '/guide/': [
        {
          title: 'Guide',
          collapsable: false,
          children: [
            '',
            'getting-started',
            'defining-models',
            'advanced-model-options',
            'lifecycle-hooks'
          ]
        }
      ],
      // TODO: fallback to 'auto' sidebar
      // https://github.com/vuejs/vuepress/issues/1252
      '/': []
    },
    editLinks: true,
    lastUpdated: 'Last updated'
  },
  markdown: {
    extendMarkdown: md => {
      addContainers(md)
    }
  },
  host: process.env.IP,
  port: process.env.PORT
}
