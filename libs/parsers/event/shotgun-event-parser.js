import fs from 'fs/promises';
import defaultParser from './default-event-parser.js';

const parse = async (page, metas) => {
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

export default { parse };