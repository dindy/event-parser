const express = require("express");
const log = require('node-file-logger');
const cors = require('cors');
const scrapper = require('./scrapper.js');
const fbParser = require('./facebook-parser.js');
const fbGroupParser = require('./parsers/facebook-group-parser.js');
const instaGroupParser = require('./parsers/instagram-group-parser.js');
const defaultGroupParser = require('./parsers/default-group-parser.js');
const instaParser = require('./instagram-parser.js');
const defaultParser = require('./default-parser.js');
const helloassoParser = require('./helloasso-parser.js');
const shotgunParser = require('./shotgun-parser.js');

const app = express();
app.use(cors());
const port = 3001;

const scrapEvent = async (url, provider) => {

    let parser = null;

    const metas = {
      startTimestamp: null,
      endTimestamp: null,
      description: null,
      place: null,
      ticketsUrl: null,
      address: null,
      hosts: [],
      url: null,
      online: null,
      physicalAddress: {
        description: null,
        geom: null,
        locality: null,
        postalCode: null,
        street: null,
        country: null,
      },
      og: []
    };    
    
    switch (provider) {
        case 'facebook':
            parser = fbParser;
            break;
        case 'instagram':
            parser = instaParser;
            break;
        case 'helloasso':
            parser = helloassoParser;
            break;
        case 'shotgun':
            parser = shotgunParser;
            break;
        default:
            parser = defaultParser;
            break;
    }
    console.log(url);
    
    return await scrapper.scrap(url, parser, metas);    
}

const scrapGroup = async (url, provider) => {

    let parser = null;
    const metas = {
        logos: [],
        banners: [],
        name: null,
        url: null,
        description: null,
        physicalAddress: null
    }
    
    switch (provider) {
        case 'facebook':
            parser = fbGroupParser;
            break;
        case 'instagram':
            parser = instaGroupParser;
            break;
        default:
            parser = defaultGroupParser;
            break;
    }

    return await scrapper.scrap(url, parser, metas);    
}

app.get("/scrap", async (req, res) => {

    const query = req.query;
    const url = query.url;
    const provider = query.provider;
    const type = query.type;
    
    if (!query.url) return req.reject();

    let buff = new Buffer(url, 'base64');
    let decodedUrl = buff.toString('ascii');

    log.Info('Request for ' + decodedUrl);
    let data = null
    if (type == 'event') {
        data = await scrapEvent(decodedUrl, provider)
    } else {
        data = await scrapGroup(decodedUrl, provider)
    }
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({data}));
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}!`);
});
