const express = require("express");
const log = require('node-file-logger');
const cors = require('cors');
const scrapper = require('./scrapper.js');
const fbParser = require('./facebook-parser.js');
const instaParser = require('./instagram-parser.js');

const app = express();
app.use(cors());
const port = 3001;

app.get("/scrap", async (req, res) => {

    const query = req.query;
    const url = query.url;
    const provider = query.provider;
    let cookies_file = null;
    
    if (!query.url) return req.reject();

    let buff = new Buffer(url, 'base64');
    let decodedUrl = buff.toString('ascii');
    let parser = null;

    log.Info('Request for ' + decodedUrl);

    switch (provider) {
        case 'facebook':
            // cookies_file = 'cookies_facebook.json';
            parser = fbParser;
            break;
        case 'instagram':
            // cookies_file = 'cookies_instagram.json';
            parser = instaParser;
            break;
        default:
            // cookies_file = null;
            break;
    }

    const data = await scrapper.scrap(decodedUrl, parser, cookies_file);

    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({data}));
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}!`);
});
