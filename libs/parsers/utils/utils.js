import axios from 'axios';
import fs from 'fs/promises';

export const fetchData = async url => await axios.get(url, { responseType: 'arraybuffer' })

export const convertUrlToBase64 = async url => { 
    
    const response = await fetchData(url)

    return {
        base64: Buffer.from(response.data).toString('base64'),
        type: response.headers["content-type"]
    }
}

export const convertUrlToBase64DataUrl = async url => {
    try {
        const image = await convertUrlToBase64DataUrl(url)
        return "data:" + image.type + ";base64," + image.base64;
    } catch (e) {
        console.log('Erreur sur l\'url : ', url);
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

export const debugPage = async (page) => {
        const content = await page.content();
        await fs.writeFile(global.appDebugDir + 'page.html', content);
    }