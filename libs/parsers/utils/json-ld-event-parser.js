const { getJsonPath, getFirstJsonPath } = require('./json-parser.js');

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

module.exports = {
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
                    if (json['@type'] && (eventTypes.includes(json['@type']) || json['@type'].indexOf('Event') !== -1 )) {
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
                    metas.hosts = [{
                        name: hostName,
                        url: hostUrl
                    }];
                    const offers = getFirstJsonPath("$..['offers']", graph); 
                    if (offers && offers.length > 0) {
                        const offer = offers[0];
                        metas.ticketsUrl = getFirstJsonPath("$..['url']", offer);
                    }
                    const startDate = getFirstJsonPath("$..['startDate']", graph);
                    
                    metas.startTimestamp = startDate ? new Date(startDate) / 1000 : null;
                    const endDate = getFirstJsonPath("$..['endDate']", graph);
                    metas.endTimestamp = endDate ? new Date(endDate) / 1000 : null;
                    const location = getFirstJsonPath("$..['location']", graph);
                    if (location) {
                        metas.physicalAddress = {
                            description: getFirstJsonPath("$..['name']", location),
                        }
                        const address = getFirstJsonPath("$..['address']", location);
                        
                        if (address && typeof address === 'string') {
                            const parts = address.split(',').map(el => el.trim());
                            metas.physicalAddress.street = parts[0];
                            metas.physicalAddress.postalCode = parts[1].split(/ (.*)/s)[0];
                            metas.physicalAddress.locality = parts[1].split(/ (.*)/s)[1];
                        } else {
                            metas.physicalAddress.locality = getFirstJsonPath("$..['addressLocality']", address);
                            metas.physicalAddress.postalCode = getFirstJsonPath("$..['postalCode']", address);
                            metas.physicalAddress.street = getFirstJsonPath("$..['streetAddress']", address);                        
                        }
                        const geo = getFirstJsonPath("$..['geo']", location);
                        if (geo) {
                            metas.physicalAddress.geom = `${geo.longitude};${geo.latitude}`;
                        }
                    }
                    let foundImages = getFirstJsonPath("$..['logo']", graph);
                    
                    if (foundImages) {
                        images = [foundImages];
                    }
                    foundImages = getFirstJsonPath("$..['image']", graph);
                    if (foundImages) {
                        if (Array.isArray(foundImages) && foundImages.length > 0) {
                            images = foundImages;
                        } else {
                            images = [foundImages];
                        }
                    }                    
                }
            } catch (e) {
                console.log('Erreur parsing JSON : ', e);
            }
        }

        return {
            metas,
            images
        };
    }
}