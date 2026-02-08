import { scrap as pageScrap } from '../libs/scrappers/page-scrapper/scrapper.mjs';
import fbParser from '../libs/parsers/web-parsers/event/facebook-event-parser.mjs';
import fbGroupParser from '../libs/parsers/web-parsers/group/facebook-group-parser.mjs';
import instaGroupParser from '../libs/parsers/web-parsers/group/instagram-group-parser.mjs';
import defaultGroupParser from '../libs/parsers/web-parsers/group/default-group-parser.mjs';
import instaParser from '../libs/parsers/web-parsers/event/instagram-event-parser.mjs';
import defaultParser from '../libs/parsers/web-parsers/event/default-event-parser.mjs';
import helloassoParser from '../libs/parsers/web-parsers/event/helloasso-event-parser.mjs';
import shotgunParser from '../libs/parsers/web-parsers/event/shotgun-event-parser.mjs';
import log from 'node-file-logger';
import {
    getEventModel,
    getGroupModel
} from '../libs/parsers/web-parsers/models.mjs'

const scrapEvent = async (url, provider) => {

    let parser = null;
    
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
    
    return await pageScrap(url, parser, getEventModel());    
}

const scrapGroup = async (url, provider) => {

    let parser = null;
    
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

    return await pageScrap(url, parser, getGroupModel());    
}

const scrap = async (req, res) => {

    const query = req.query;
    const url = query.url;
    const provider = query.provider;
    const type = query.type;
    
    if (!query.url) return res.end('No url parameter found');

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

export { scrap };