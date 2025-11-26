const { convertUrlToBase64, extractAddressParts } = require('../utils.js');
const { getJsonPath, getFirstJsonPath } = require('../json-parser.js');
const fs = require('fs').promises;
var he = require('he');
const defaultParser = require('../default-parser.js');

module.exports = {
    parse: async (page, metas) => { 
        const data = {};
        data.images = [];
        const content = await page.content();
        await fs.writeFile('page.html', content);
        const commonMetas = await defaultParser.parse(page, metas);
        const url = commonMetas.metas.url;        
        metas.description = commonMetas.metas.description;
        metas.url = commonMetas.metas.url;
        
        const scripts = await page.$$eval('script', scripts => scripts
            .filter(script => script.type === "application/json")
            .map(script => script.textContent)
        );     
        
        for (const scriptContent of scripts) {    
            try {
                const json = JSON.parse(scriptContent);
                const contextItems = getJsonPath("$..[*].context_item.title.text", json);
                if (contextItems && contextItems.length > 0) {
                    for (const item of contextItems) {
                        const addressCandidate = extractAddressParts(item);
                        if (addressCandidate) {
                            metas.physicalAddress = addressCandidate;
                        }
                    }
                }   
                
                const description = getFirstJsonPath("$..[*].profile_status_text.text", json);
                if (description) {
                    metas.description = description;
                }

                const name = getFirstJsonPath("$..[*].result.data.user..node..owning_profile.name", json);
                if (name) {
                    metas.name = name
                    
                }                   
            } catch (e) {
                console.log('Erreur parsing JSON : ', e);
            }

        };             
        
        // Image
        const banners = await page.$$eval('img', images => images
            .filter(image => "imgperflogname" in image.dataset && image.dataset.imgperflogname === 'profileCoverPhoto')
            .map(image => image.src)
        );
        
        for (const src of banners) {
            const parsedImage = await convertUrlToBase64(src);
            if (parsedImage) {
                metas.banners.push(parsedImage);
            }            
        }        

        // TODO: Keep bigger logo
        let logos = await page.$$eval(`a svg[aria-label="${metas.name}"] image`, images => images
            .map(image => image.getAttribute('xlink:href'))
        );

        for (const src of logos) {
            const parsedImage = await convertUrlToBase64(src);
            if (parsedImage) {
                metas.logos.push(parsedImage);
            }            
        }   
        
        console.log(metas);
        
        return metas;
    }
}