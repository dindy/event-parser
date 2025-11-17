const metascraper = require('metascraper')([
  require('metascraper-date')(),
  require('metascraper-description')(),
  require('metascraper-image')(),
  require('metascraper-title')(),
  require('metascraper-url')(),
  require('./metascraper-geo')()
//   require('metascraper-address')()
])

module.exports = {
    parse: async (page) => { 
        const content = await page.content();
        return await metascraper({url: page.url(), html: content});        
    }
}