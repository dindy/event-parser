const fs = require('fs').promises;
const metaParser = require('./meta-parser.js');
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
        
        const images = [];
        if (parsed.image) {
            images.push(await convertUrlToBase64(parsed.image));
        }
        
        let parsedDates = parseDatesFromText(parsed.title + ' ' + parsed.description);
        if (parsedDates.startDateTimeCandidate) {
            metas.startTimestamp = Math.floor(parsedDates.startDateTimeCandidate / 1000);
        }
        if (parsedDates.endDateTimeCandidate) {
            metas.endTimestamp = Math.floor(parsedDates.endDateTimeCandidate / 1000);            
        }

        return {
            images,
            metas
        }
    }
}