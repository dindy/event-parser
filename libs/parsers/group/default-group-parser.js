const fs = require('fs').promises;
const metaParser = require('../utils/metascrapers/metascraper-default.js');
const jsonLdParser = require('../utils/json-ld-event-parser.js');
const { convertUrlToBase64, debugPage } = require('../utils/utils.js');

module.exports = {
    parse: async (page, metas) => { 
        debugPage(page);
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