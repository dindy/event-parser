var axios = require('axios');
const fs = require('fs').promises;

module.exports = {
    convertUrlToBase64: async (url) => {
        try {
            const image = await axios.get(url, { responseType: 'arraybuffer' });
            const raw = Buffer.from(image.data).toString('base64');
            return "data:" + image.headers["content-type"] + ";base64," + raw;
        } catch (e) {
            console.log('Erreur sur l\'url : ', url);
            return null;
        }
    },
    extractAddressParts: (string) => {
        
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
    },    
    async debugPage(page) {
        const content = await page.content();
        await fs.writeFile(global.appDebugDir + 'page.html', content);
    }
}