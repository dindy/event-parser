import { getFirstJsonPath } from './json-parser.mjs'
import {
    extractImageUrl,
    extractPhysicalAddressFromAddress,
    extractPhysicalAddressFromLocation
} from './json-ld-helper.mjs'

const eventTypes = [
    'BusinessEvent',
    'ChildrensEvent',
    'ComedyEvent',
    'CourseInstance',
    'DanceEvent',
    'DeliveryEvent',
    'EducationEvent',
    'EventSeries',
    'ExhibitionEvent',
    'Festival',
    'FoodEvent',
    'Hackathon',
    'LiteraryEvent',
    'MusicEvent',
    'PublicationEvent',
    'SaleEvent',
    'ScreeningEvent',
    'SocialEvent',
    'SportsEvent',
    'TheaterEvent',
    'VisualArtsEvent',
];

export default {
    parse: async (page) => {
        const scripts = await page.$$eval('script', scripts => scripts
            .filter(script => script.type === "application/ld+json")
            .map(script => script.textContent)
        );
        const metas = {};
        let images = [];
        for (const scriptContent of scripts) {
            
            try {
                const json = JSON.parse(scriptContent);
                
                let graph = getFirstJsonPath("$['@graph'][?(@['@type']=='Event')]", json);
                
                if (!graph) {
                    if (json['@type'] && (eventTypes.includes(json['@type']) || json['@type'].indexOf('Event') !== -1)) {
                        graph = json;
                    }
                }

                if (graph) {
                    metas.url = getFirstJsonPath("$..['url']", graph);
                    metas.description = getFirstJsonPath("$..['description']", graph);
                    metas.title = getFirstJsonPath("$..['name']", graph);
                    const host = getFirstJsonPath("$..['organizer']", graph);
                    const hostName = getFirstJsonPath("$..['name']", host);
                    const hostUrl = getFirstJsonPath("$..['url']", host);
                    if (hostName) {
                        metas.hosts = [{
                            name: hostName,
                            url: hostUrl
                        }];
                    }
                    const offers = getFirstJsonPath("$..['offers']", graph);
                    if (offers && offers.length > 0) {
                        const offer = offers[0];
                        metas.ticketsUrl = getFirstJsonPath("$..['url']", offer);
                    }
                    
                    const startDate = getFirstJsonPath("$..['startDate']", graph);
                    metas.startTimestamp = startDate ? new Date(startDate) / 1000 : null;
                    const endDate = getFirstJsonPath("$..['endDate']", graph);
                    metas.endTimestamp = endDate ? new Date(endDate) / 1000 : null;
                    
                    metas.physicalAddress = {}
                    const address = getFirstJsonPath("$..['address']", graph);
                    if (address) {
                        metas.physicalAddress = extractPhysicalAddressFromAddress(address)
                    }
                    const location = getFirstJsonPath("$..['location']", graph);
                    if (location) {
                        metas.physicalAddress = extractPhysicalAddressFromLocation(location)
                    }
                    
                    let foundImage = extractImageUrl(getFirstJsonPath("$..['logo']", graph))
                    if (foundImage) images = [foundImage]
                    foundImage = extractImageUrl(getFirstJsonPath("$..['image']", graph))
                    if (foundImage) images = [foundImage]
                }
            } catch (e) {
                console.log('Erreur parsing JSON : ', e)
                throw e
            }
        }

        return {
            metas,
            images
        };
    }
}