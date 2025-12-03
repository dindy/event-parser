'use strict'

import helpers from '@metascraper/helpers'
const { toRule, description } = helpers

export default (opts) => {
  const toDescription = toRule(description, opts)

  const rules = {
    description: [
      toDescription($ => $('meta[name="description"]').attr('content')),
    ]
  }

  rules.pkgName = 'metascraper-instagram-description'

  return rules
}
