import { getFirstJsonPath } from '../utils/json-parser.js';

const parse = async (page) => {
    const scripts = await page.$$eval('script', scripts => scripts
        .filter(script => script.type === "application/ld+json")
        .map(script => script.textContent)
    );
    const metas = {};

    for (const scriptContent of scripts) {
        
        try {
            const json = JSON.parse(scriptContent);
        } catch (e) {
            console.log('Erreur parsing JSON : ', e);
        }
    }

    return {
        metas
    };        
}

export default { parse };