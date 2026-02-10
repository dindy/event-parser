import defaultGroupParser from './default-group-parser.mjs';
import { getFirstJsonPath } from '../utils/json-parser.mjs';
import metascraper from 'metascraper';
import metascraperInstagramDescription from '../utils/metascrapers/metascraper-instagram-description.mjs';

const metascraperInstance = metascraper([
    metascraperInstagramDescription(),
])

const parse = async (page, metas) => {

    metas = await defaultGroupParser.parse(page, metas)
    
    let name = metas.name;
    name = name.replace(' • Photos et vidéos Instagram', '');
    name = name.replace(/ \(@[\w\W]+\)[\w\W]*/, '');
    metas.name = name;
    
    const content = await page.content();
    const metasScrapped = await metascraperInstance({url: page.url(), html: content}); 
    const parsed = metasScrapped.description;
    const regex = /«([\w\W]+)»/;
    const match = parsed.match(regex);
    if (match) {
        metas.description = match[1].trim();
    }

    const scripts = await page.$$eval('script', scripts => scripts
        .filter(script => script.type === "application/json")
        .map(script => script.textContent)
    );     
    
    for (const scriptContent of scripts) {
        try {
            const json = JSON.parse(scriptContent);
            const bio = getFirstJsonPath("$..[*].biography", json);
            if (bio) {
                metas.description = bio;
            }
            const name = getFirstJsonPath("$..[*].full_name", json);
            if (name) {
                metas.name = name;
            }
        } catch (e) {
            console.log('Erreur parsing JSON : ', e)
            throw e
        }
    }      
    
    return metas;
}

export default { parse };