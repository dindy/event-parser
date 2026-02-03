import { debugPage } from '../utils/utils.mjs';
import { getJsonPath, getFirstJsonPath } from '../utils/json-parser.mjs';

const parse = async (page, metas) => {
    
    debugPage(page)

    const scripts = await page.$$eval('script', scripts => scripts
        .filter(script => script.type === "application/json")
        .map(script => script.textContent)
    );     
    
    for (const scriptContent of scripts) {
        try {
            const json = JSON.parse(scriptContent)
            const events = getJsonPath('$..[*][?@.__typename=="Event"]', json)
            if (!events || events.length === 0) continue
            console.log(events);
            
        } catch (e) {
            console.log('Erreur parsing JSON : ', e);
        }
    }

    return metas
}

export default { parse };