const fs = require('fs').promises;
const metaParser = require('../meta-parser.js');
const jsonLdParser = require('../json-ld-parser.js');
const { parseDatesFromText } = require('../parse-date.js');
const { convertUrlToBase64 } = require('../utils.js');

module.exports = {
    parse: async (page, metas) => { 
        const content = await page.content();
        await fs.writeFile('page.html', content);
        const parsed = await metaParser.parse(page);
        
        metas.description = parsed.description;        
        metas.name = parsed.title;        
        metas.url = parsed.url;  
        if (parsed.gps?.latitude && parsed.gps?.longitude) {
            metas.physicalAddress.geom = `${parsed.gps.longitude};${parsed.gps.latitude}`
        }
        
        if (parsed.image) {
            const parsedImage = await convertUrlToBase64(parsed.image);
            if (parsedImage) {
                metas.logos.push(parsedImage);
            }
        }    
        
        const parsedJsonLd = await jsonLdParser.parse(page);
        
        if (parsedJsonLd.images && parsedJsonLd.images.length > 0) {
            
            for (const src of parsedJsonLd.images) {
                const parsedImage = await convertUrlToBase64(src);
                if (parsedImage) {
                    metas.logo.push(parsedImage);
                }                
            }
        }        

        return metas;
    }
}