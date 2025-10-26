const fs = require('fs').promises;
const metaParser = require('./meta-parser.js');
const jsonLdParser = require('./json-ld-parser.js');
const { parseDatesFromText } = require('./parse-date.js');
const { convertUrlToBase64 } = require('./utils.js');

module.exports = {
    parse: async (page, metas) => { 
        const content = await page.content();
        await fs.writeFile('page.html', content);
        const parsed = await metaParser.parse(page);
        
        metas.description = parsed.description;        
        metas.title = parsed.title;        
        metas.url = parsed.url;        
        
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