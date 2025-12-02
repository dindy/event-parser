'use strict'

const { toRule, description } = require('@metascraper/helpers')

module.exports = opts => {
  const toDescription = toRule(description, opts)

  const rules = {
    description: [
      toDescription($ => $('meta[name="description"]').attr('content')),
    ]
  }

  rules.pkgName = 'metascraper-instagram-description'

  return rules
}
