import { getFirstJsonPath } from './json-parser.mjs';
import {
    extractImageUrl,
    extractPhysicalAddressFromAddress,
    extractPhysicalAddressFromLocation,
    extractPhysicalAddressFromPlace,
} from './json-ld-helper.mjs';

const groupTypes = [
    'Organization',
    'Group',
    'LocalBusiness',
    'EntertainmentBusiness',
    'Place'
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
                    
                    group.description = getFirstJsonPath("$..['description']", json);
                    
                    group.url = getFirstJsonPath("$..['url']", json);
                    
                    group.image = extractImageUrl(getFirstJsonPath("$..['image']", json))
                    
                    group.logo = extractImageUrl(getFirstJsonPath("$..['logo']", json))

                    group.physicalAddress = {}

                    const address = getFirstJsonPath("$..['address']", json);
                    if (address) {
                        group.physicalAddress = extractPhysicalAddressFromAddress(address)
                    }

                    const location = getFirstJsonPath("$..['location']", json);
                    if (location) {
                        group.physicalAddress = extractPhysicalAddressFromLocation(location)
                    }

                    if (json['@type'] == 'Place') {
                        group.physicalAddress = extractPhysicalAddressFromPlace(json)
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
