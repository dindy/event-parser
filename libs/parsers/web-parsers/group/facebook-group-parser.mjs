import { convertUrlToBase64DataUrl, extractAddressParts, debugPage } from '../utils/utils.mjs';
import { getJsonPath, getFirstJsonPath } from '../utils/json-parser.mjs';
import fs from 'fs/promises';
import he from 'he';
import defaultParser from '../event/default-event-parser.mjs';

const parse = async (page, metas) => { 
    const data = {};
    data.images = [];
    const commonMetas = await defaultParser.parse(page, metas);
    const url = commonMetas.metas.url;        
    metas.description = commonMetas.metas.description;
    metas.url = commonMetas.metas.url;
    metas.name = commonMetas.metas.title;

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

            // const name = getFirstJsonPath("$..[*].result.data.user..node..owning_profile.name", json);
            // if (name) {
            //     metas.name = name
                
            // }     
            
            const pic = getFirstJsonPath("$..[*].profilePicLarge.uri", json);
            if (pic) {
                const parsed = await convertUrlToBase64DataUrl(pic)
                if (parsed) metas.logos.push(parsed);
            }

            const cover = getFirstJsonPath("$..[*].cover_photo.photo.image.uri", json);
            if (cover) {
                const parsed = await convertUrlToBase64DataUrl(cover)
                if (parsed) metas.banners.push(parsed);
            }
        } catch (e) {
            console.log('Erreur parsing JSON : ', e)
            throw e
        }

    };             
    
    const banners = await page.$$eval('img', images => images
        .filter(image => "imgperflogname" in image.dataset && image.dataset.imgperflogname === 'profileCoverPhoto')
        .map(image => image.src)
    );
    
    for (const src of banners) {
        const parsedImage = await convertUrlToBase64DataUrl(src);
        if (parsedImage) {
            metas.banners.push(parsedImage);
        }            
    }        

    // TODO: Keep bigger logo
    let logos = await page.$$eval(`svg[aria-label="${metas.name}"] image`, images => images
        .map(image => image.getAttribute('xlink:href'))
    );

    for (const src of logos) {
        const parsedImage = await convertUrlToBase64DataUrl(src);
        if (parsedImage) {
            metas.logos.push(parsedImage);
        }            
    }   
        
    return metas;
}

export default { parse };