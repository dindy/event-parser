import fs from 'fs/promises';
import metaParser from '../utils/metascrapers/metascraper-default.mjs';
import jsonLdParser from '../utils/json-ld-event-parser.mjs';
import { convertUrlToBase64DataUrl, debugPage } from '../utils/utils.mjs';

const parse = async (page, metas) => { 
    debugPage(page);
    const parsed = await metaParser.parse(page);
    metas.description = parsed.description;        
    metas.name = parsed.title;        
    metas.url = parsed.url;  
    if (parsed.gps?.latitude && parsed.gps?.longitude) {
        metas.physicalAddress.geom = `${parsed.gps.longitude};${parsed.gps.latitude}`
    }
    
    if (parsed.image) {
        const parsedImage = await convertUrlToBase64DataUrl(parsed.image);
        if (parsedImage) {
            metas.logos.push(parsedImage);
        }
    }    
    
    const parsedJsonLd = await jsonLdParser.parse(page);
    
    if (parsedJsonLd.images && parsedJsonLd.images.length > 0) {
        
        for (const src of parsedJsonLd.images) {
            const parsedImage = await convertUrlToBase64DataUrl(src);
            if (parsedImage) {
                metas.logo.push(parsedImage);
            }                
        }
    }        

    return metas;
}

export default { parse };