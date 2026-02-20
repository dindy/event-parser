import fs from 'fs/promises';
import metaParser from '../utils/metascrapers/metascraper-default.mjs';
import jsonLdParser from '../utils/json-ld-group-parser.mjs';
import { convertUrlToBase64DataUrl } from '../utils/utils.mjs';

const parse = async (page, metas) => { 
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
    
    if (parsedJsonLd.physicalAddress) { 
        metas.physicalAddress = parsedJsonLd.physicalAddress
    }        
    if (parsedJsonLd.name) {
        metas.name = parsedJsonLd.name
    }
    if (parsedJsonLd.url) {
        metas.url = parsedJsonLd.url
    }    
    if (parsedJsonLd.description) {
        metas.description = parsedJsonLd.description
    }    
    if (parsedJsonLd.image) {        
        const parsedImage = await convertUrlToBase64DataUrl(parsedJsonLd.image);
        if (parsedImage) {
            metas.banners.push(parsedImage);
        }                
    }        
    if (parsedJsonLd.logo) {        
        const parsedImage = await convertUrlToBase64DataUrl(parsedJsonLd.logo);
        if (parsedImage) {
            metas.logos.push(parsedImage);
        }                
    }        

    return metas;
}

export default { parse };