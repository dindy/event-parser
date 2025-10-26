var axios = require('axios');

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
    }
}