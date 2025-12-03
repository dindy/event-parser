import metaMetascraper from 'metascraper';
import metascraperDate from 'metascraper-date';
import metascraperDescription from 'metascraper-description';
import metascraperImage from 'metascraper-image';
import metascraperTitle from 'metascraper-title';
import metascraperUrl from 'metascraper-url';
import metascraperGeo from './metascraper-geo.js';

const metascraper = metaMetascraper([
  metascraperDate(),
  metascraperDescription(),
  metascraperImage(),
  metascraperTitle(),
  metascraperUrl(),
  metascraperGeo()
//   require('metascraper-address')()
])

const parse = async (page) => { 
        const content = await page.content();
        return await metascraper({url: page.url(), html: content});        
}
    
export default { parse }