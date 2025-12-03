const scrapper = require('../libs/scrapper.js');
const fbParser = require('../libs/parsers/event/facebook-event-parser.js');
const fbGroupParser = require('../libs/parsers/group/facebook-group-parser.js');
const instaGroupParser = require('../libs/parsers/group/instagram-group-parser.js');
const defaultGroupParser = require('../libs/parsers/group/default-group-parser.js');
const instaParser = require('../libs/parsers/event/instagram-event-parser.js');
const defaultParser = require('../libs/parsers/event/default-event-parser.js');
const helloassoParser = require('../libs/parsers/event/helloasso-event-parser.js');
const shotgunParser = require('../libs/parsers/event/shotgun-event-parser.js');
const log = require('node-file-logger');

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

module.exports = {
    scrap: async (req, res) => {

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
        res.end(JSON.stringify({ data }));
    }
}