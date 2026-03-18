import { getFirstJsonPath, getJsonPath } from './json-parser.mjs'
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

                if (graph)
                {
                    /** url */
                    metas.url = getFirstJsonPath("$..['url']", graph);
                    
                    /** description */
                    metas.description = getFirstJsonPath("$..['description']", graph);
                    
                    /** title */
                    metas.title = getFirstJsonPath("$..['name']", graph);
                    
                    /** hosts */
                    const host = getFirstJsonPath("$..['organizer']", graph);
                    const hostName = getFirstJsonPath("$..['name']", host);
                    const hostUrl = getFirstJsonPath("$..['url']", host);
                    if (hostName) {
                        metas.hosts = [{
                            name: hostName,
                            url: hostUrl
                        }];
                    }
                    
                    /** ticketsUrl and offers */
                    const mapOffer = offer => ({
                        url: getFirstJsonPath("$..['url']", offer),
                        // price: getFirstJsonPath("$..['price']", offer),
                        // priceCurrency: getFirstJsonPath("$..['priceCurrency']", offer),
                        // availability: getFirstJsonPath("$..['availability']", offer),
                        name: getFirstJsonPath("$..['name']", offer),
                    })
                    const aggregateOffers = getFirstJsonPath("$..[?(@['@type']=='AggregateOffer')]", graph);
                    if (aggregateOffers && aggregateOffers.url) {
                        metas.ticketsUrl = getFirstJsonPath("$..['url']", aggregateOffers)
                        const offers = getFirstJsonPath("$..offers", aggregateOffers)
                        if (offers && offers.length > 0) {
                            metas.offers = offers.map(mapOffer)
                        }
                    } else {
                        const offers = getJsonPath("$..[?(@['@type']=='Offer')]", graph)
                        if (offers && offers.length > 0) {
                            metas.offers = offers.map(mapOffer)
                        }
                    }

                    /** startTimestamp */
                    const startDate = getFirstJsonPath("$..['startDate']", graph);
                    metas.startTimestamp = startDate ? new Date(startDate) / 1000 : null;
                    
                    /** endTimestamp */
                    const endDate = getFirstJsonPath("$..['endDate']", graph);
                    metas.endTimestamp = endDate ? new Date(endDate) / 1000 : null;
                    
                    /** physicalAddress */
                    metas.physicalAddress = {}
                    const address = getFirstJsonPath("$..['address']", graph);
                    if (address) {
                        metas.physicalAddress = extractPhysicalAddressFromAddress(address)
                    }
                    const location = getFirstJsonPath("$..['location']", graph);
                    if (location) {
                        metas.physicalAddress = extractPhysicalAddressFromLocation(location)
                    }
                    
                    /** images */
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