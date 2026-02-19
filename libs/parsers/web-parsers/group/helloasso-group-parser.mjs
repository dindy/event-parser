import { convertUrlToBase64DataUrl } from '../utils/utils.mjs';
import defaultParser from './default-group-parser.mjs';

const parse = async (page, metas) => { 
    
    const defaultData = await defaultParser.parse(page, metas);
    metas.logos = defaultData.logos || null
    metas.banners = defaultData.banners || null
    metas.name = defaultData.name || null
    metas.url = defaultData.url || null
    metas.description = defaultData.description || null
    metas.physicalAddress = defaultData.physicalAddress || null
    
    const logo = await page.$$eval('img', images => images
        .filter(image => image.classList.contains('Logo--Image'))
        .map(image => image.src)
    );

    if (logo && logo.length > 0) {
        const parsedImage = await convertUrlToBase64DataUrl(logo[0]);
        if (parsedImage) {
            metas.logos.push(parsedImage);
        }           
    }

    // Remove duplicates
    metas.logos = [...new Set(metas.logos)]
    metas.banners = [...new Set(metas.banners)] 

    return metas
}

export default { parse }