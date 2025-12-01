const defaultGroupParser = require('./default-group-parser.js');
const { getJsonPath, getFirstJsonPath } = require('../json-parser.js');
const metascraper = require('metascraper')([
    require('../metascraper-instagram-description')(),
])
module.exports = {
    parse: async (page, metas) => {

        metas = await defaultGroupParser.parse(page, metas)
        
        let name = metas.name;
        name = name.replace(' • Photos et vidéos Instagram', '');
        name = name.replace(/ \(@[\w\W]+\)[\w\W]*/, '');
        metas.name = name;
        
        const content = await page.content();
        const metasScrapped = await metascraper({url: page.url(), html: content}); 
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
                
            }
        }      
        
        return metas;
    }
}