'use strict'

const container = require('markdown-it-container')

const createContainer = (className, defaultTitle) => {
  return [container, className, {
    render (tokens, idx) {
      const token = tokens[idx]
      const info = token.info.trim().slice(className.length).trim()
      if (token.nesting === 1) {
        return `<div class="${className} custom-block"><p class="custom-block-title">${info || defaultTitle}</p>\n`
      } else {
        return `</div>\n`
      }
    }
  }]
}

module.exports = md => {
  md.use(...createContainer('arguments', 'ARGUMENTS'))
  md.use(...createContainer('returns', 'RETURNS'))
  md.use(...createContainer('usage', 'USAGE'))
  md.use(...createContainer('throws', 'THROWS'))
}
