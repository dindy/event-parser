
const metaParser = require('../utils/metascrapers/metascraper-default.js');
const jsonLdParser = require('../utils/json-ld-event-parser.js');
const { parseDatesFromText } = require('../utils/date-parser.js');
const { convertUrlToBase64, debugPage } = require('../utils/utils.js');

module.exports = {
    parse: async (page, metas) => { 
        
        debugPage(page);
        const parsed = await metaParser.parse(page);
        metas.description = parsed.description;        
        metas.title = parsed.title;        
        metas.url = parsed.url;  
        if (parsed.gps?.latitude && parsed.gps?.longitude) {
            metas.physicalAddress.geom = `${parsed.gps.longitude};${parsed.gps.latitude}`
        }
        
        
        let images = [];
        if (parsed.image) {
            const parsedImage = await convertUrlToBase64(parsed.image);
            if (parsedImage) {
                images.push(parsedImage);
            }
        }
        
        let parsedDates = parseDatesFromText(parsed.title + ' ' + parsed.description);
        if (parsedDates.startDateTimeCandidate) {
            metas.startTimestamp = Math.floor(parsedDates.startDateTimeCandidate / 1000);
        }
        if (parsedDates.endDateTimeCandidate) {
            metas.endTimestamp = Math.floor(parsedDates.endDateTimeCandidate / 1000);            
        }

        const parsedJsonLd = await jsonLdParser.parse(page);
        
        if (parsedJsonLd.images && parsedJsonLd.images.length > 0) {
            
            for (const src of parsedJsonLd.images) {
                const parsedImage = await convertUrlToBase64(src);
                if (parsedImage) {
                    images.push(parsedImage);
                }                
            }
        }
        
        return {
            images,
            metas: Object.assign(metas, parsedJsonLd.metas)
        }
    }
}