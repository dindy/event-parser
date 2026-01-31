'use strict'

import helpers from '@metascraper/helpers'
const { toRule, isString } = helpers

const gpsCoordinates = (value) => {
  if (!isString(value)) return undefined

  // Parse format: "latitude;longitude"
  const match = value.match(/^([+-]?\d+\.?\d*)\s*;\s*([+-]?\d+\.?\d*)$/)
  if (!match) return undefined

  const latitude = parseFloat(match[1])
  const longitude = parseFloat(match[2])

  // Validate GPS coordinate ranges
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return undefined
  }

  return {
    latitude,
    longitude
  }
}

export default (opts) => {
  const toGPS = toRule(gpsCoordinates, opts)

  const rules = {
    gps: [
      toGPS($ => $('meta[name="geo.position"]').attr('content')),
      toGPS($ => $('meta[property="geo.position"]').attr('content')),
      toGPS($ => $('meta[name="ICBM"]').attr('content'))
    ]
  }

  rules.pkgName = 'metascraper-geo'

  return rules
}
