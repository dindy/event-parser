import axios from 'axios';
import fs from 'fs/promises';
import mimes from 'mime-db'
import { cwd } from 'node:process'
import path from 'path'
import crypto from 'node:crypto'

export const fetchData = async url => await axios.get(url, { responseType: 'arraybuffer' })

export const convertUrlToBase64 = async url => { 
    
    const response = await fetchData(url)

    return {
        base64: Buffer.from(response.data).toString('base64'),
        type: response.headers["content-type"],
        extension: mimes[response.headers["content-type"]]?.extensions?.[0] || ''
    }
}

export const convertBase64DataUrlToBase64 = base64DataUrl => { 
    const dataUrlRegexp = /^data:([^;]+);base64,(.+)$/;
    const match = dataUrlRegexp.exec(base64DataUrl);
    
    if (!match) {
        throw new Error('Invalid base64 data URL format');
    }
    
    const type = match[1];
    const base64 = match[2];

    return {
        base64: base64,
        type: type,
        extension: mimes[type]?.extensions?.[0] || ''
    };
}

export const convertUrlToBase64DataUrl = async url => {
    try {
        const image = await convertUrlToBase64(url)
        return "data:" + image.type + ";base64," + image.base64;
    } catch (e) {
        console.log('Erreur sur l\'url : ', url);
        console.log(e);
        return null;
    }
}

export const extractAddressParts = (string) => {
        
        let address = {};
        const addressRegexp = /(?:([^,]+), )?([^,]+), (?:([0-9]{5}) )?([^,]+), (.+)/;
        const addressRegexpResult = addressRegexp.exec(string);            
        
        if (addressRegexpResult) {
            if (typeof addressRegexpResult[1] !== "undefined") {                    
                address.street = addressRegexpResult[1].trim() + ', ' + addressRegexpResult[2].trim();
            } else {
                address.street = addressRegexpResult[2].trim();
            }
            if (typeof addressRegexpResult[3] !== "undefined") {
                address.postalCode = addressRegexpResult[3].trim();
            }
            address.locality = addressRegexpResult[4].trim();
            address.country = addressRegexpResult[5].trim();

            return address;
        }            

        return null;
}

export const debugPage = async (page) =>
{
    const content = await page.content();
    const filename = crypto.randomUUID() + '.html'
    const fullPath = path.join(cwd(), 'debug', `${filename}`)
    // Don't wait and return filename
    fs.writeFile(fullPath, content);

    return fullPath
}

export const isString = value => typeof value === 'string' || value instanceof String;

export const isValidUrl = urlString => {
    try { 
        return Boolean(new URL(urlString)); 
    }
    catch(e){ 
        return false; 
    }
}