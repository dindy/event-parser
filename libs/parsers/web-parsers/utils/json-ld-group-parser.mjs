import { getFirstJsonPath } from './json-parser.mjs';

const groupTypes = [
    'Organization',
    'Group',
    'LocalBusiness'
]

export default {
    parse: async (page) => {
        const scripts = await page.$$eval('script', scripts => scripts
            .filter(script => script.type === "application/ld+json")
            .map(script => script.textContent)
        );
        let group = {
            physicalAddress: {}
        };
        for (const scriptContent of scripts) {
            try {
                const json = JSON.parse(scriptContent);
                if (groupTypes.includes(json['@type'])) {
                    group.name = getFirstJsonPath("$..['name']", json);
                    group.url = getFirstJsonPath("$..['url']", json);
                    group.image = getFirstJsonPath("$..['image']", json);
                    group.logo = getFirstJsonPath("$..['logo']", json);
                    const geo = getFirstJsonPath("$..['geo']", json);
                    if (geo) {
                        group.physicalAddress.geom = `${geo.longitude};${geo.latitude}`;
                    }      
                    const address = getFirstJsonPath("$..['address']", json);
                    if (address && typeof address === 'string') {
                        const parts = address.split(',').map(el => el.trim());
                        group.physicalAddress.street = parts[0];
                        group.physicalAddress.postalCode = parts[1].split(/ (.*)/s)[0];
                        group.physicalAddress.locality = parts[1].split(/ (.*)/s)[1];
                    } else {
                        group.physicalAddress.locality = getFirstJsonPath("$..['addressLocality']", json);
                        group.physicalAddress.postalCode = getFirstJsonPath("$..['postalCode']", json);
                        group.physicalAddress.street = getFirstJsonPath("$..['streetAddress']", json);
                    }                    
                }
            } catch (e) {
                console.log('Erreur parsing JSON : ', e)
                throw e
            }
        }

        return group;
    }
};
