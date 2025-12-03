const fs = require('fs').promises;
const defaultParser = require('./default-event-parser.js');

module.exports = {
    parse: async (page, metas) => {
        const data = {};
        data.images = [];
        const content = await page.content();
        await fs.writeFile('page.html', content);

        const commonMetas = await defaultParser.parse(page, metas);
        metas.ticketsUrl = commonMetas.metas.url;

        data.images = commonMetas.images;
        data.metas = commonMetas.metas;
        return data;
    }
}