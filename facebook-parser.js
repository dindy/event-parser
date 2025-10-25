const { convertUrlToBase64 } = require('./utils.js');
const { getJsonPath, getFirstJsonPath } = require('./json-parser.js');
const OGParser  = require('./og-parser.js');
const fs = require('fs').promises;
var he = require('he');
const metaParser = require('./default-parser.js');

module.exports = {
    parse: async (page, metas) => {
        const data = {};
        data.images = [];
        const content = await page.content();
        await fs.writeFile('page.html', content);

        commonMetas = await metaParser.parse(page, metas);
        const url = commonMetas.metas.url;
        metas.description = commonMetas.metas.description;
        metas.url = commonMetas.metas.url;
        metas.title = commonMetas.metas.title;
        // if (commonMetas.images.length > 0) {
        //     data.images.push(await convertUrlToBase64(commonMetas.images[0]));
        // }
        let eventId = null;
        const idRegexp = /\/([0-9]{9,})\/$/g
        const idMatches = [...url.matchAll(idRegexp)];
        
        if (idMatches[0] && idMatches[0][1]) {
            eventId = idMatches[0][1];
        }
        
        const scripts = await page.$$eval('script', scripts => scripts
            .filter(script => script.type === "application/json")
            .map(script => script.textContent)
        );

        for (const scriptContent of scripts) {    
            try {
                const json = JSON.parse(scriptContent);

                // Start date + end date
                const label = getFirstJsonPath("$..[*].result.label", json)
                if (label && label.indexOf('EventCometLineupsCardMeta') != -1) {
                    const startTimestamp = getFirstJsonPath("$..[*].start_timestamp", json);
                    const endTimestamp = getFirstJsonPath("$..[*].end_timestamp", json);
                    
                    if (startTimestamp && startTimestamp !== 0) {
                        metas.startTimestamp = startTimestamp;
                    }
                    
                    if (endTimestamp && endTimestamp !== 0) {
                        metas.endTimestamp = endTimestamp;
                    }    
                    continue;
                }

                // ID
                const scriptEventId = getFirstJsonPath("$..[*].result.data.event.id", json)
                
                if (!scriptEventId || eventId != scriptEventId) continue;

                const startTimestamp = getFirstJsonPath("$..[*].start_timestamp", json);
                const endTimestamp = getFirstJsonPath("$..[*].end_timestamp", json);
                console.log('startTimestamp', startTimestamp);
                
                if (startTimestamp && startTimestamp !== 0) {
                    metas.startTimestamp = startTimestamp;
                }
                
                if (endTimestamp && endTimestamp !== 0) {
                    metas.endTimestamp = endTimestamp;
                }    

                // En ligne
                const isOnline = getFirstJsonPath("$..[*].is_online", json);
                metas.online = isOnline;

                // Description
                const descr = getFirstJsonPath("$..[*].event_description.text", json);
                if (descr) {
                    metas.description = descr;
                }                
            
                // Place
                const place = getFirstJsonPath("$..[*].event_place.name", json);
                if (place && place !== "") {
                    metas.place = place;
                }

                // Position
                const position = getFirstJsonPath("$..[*].event_place.location", json);
                if (position) {
                    metas.position = position;
                }
                
                // Tickets URL
                const ticketsUrl = getFirstJsonPath("$..[*].event_buy_ticket_url", json);
                if (ticketsUrl) {
                    metas.ticketsUrl = ticketsUrl;
                }

                // Address
                const address = getFirstJsonPath("$..[*].one_line_address", json);
                if (address && address !== "") {
                    metas.address = address;
                }

                // Hosts
                const hostsContext = getJsonPath("$..[*].event_host_context_row_info.title.ranges[:].entity", json);
                if (hostsContext) {
                    hostsContext.forEach(hostJSON => {
                        const host = {
                            name: null,
                            url: null,
                            id: null,
                            profile_picture: null
                        };
                        
                        host.id = getFirstJsonPath("$.id", hostJSON);
                        const name = getFirstJsonPath("$.short_name", hostJSON); 
                        host.name = name ? name.trim() : null;
                        host.url = getFirstJsonPath("$.url", hostJSON) ?? getFirstJsonPath("$.profile_url", hostJSON);
                        
                        // More data about hosts
                        if (host.id) {
                            const detailedHost = getFirstJsonPath(`$..[*].event_hosts_that_can_view_guestlist[?@.id=="${host.id}"]`, json);
                            const name = getFirstJsonPath("$.name", detailedHost);
                            if (name) host.name = name.trim()
                            const url = getFirstJsonPath("$.url", detailedHost);
                            if (url) host.url = url
                            host.profile_picture = getFirstJsonPath("$.profile_picture.uri", detailedHost);
                        }
                        
                        metas.hosts.push(host);
                    });

                }

            } catch (e) {
                console.log('Erreur parsing JSON : ', e);
            }

        };
        
        // Image
        const images = await page.$$eval('img', images => images
            .filter(image => "imgperflogname" in image.dataset && image.dataset.imgperflogname === 'profileCoverPhoto')
            .map(image => image.src)
        );
        
        for (const src of images) {
            data.images.push(await convertUrlToBase64(src));
        }

        // Canonical URL
        const regExpUrl = /<link rel="canonical" href="([^"]+)"/;
        const matchesUrl = [...content.match(regExpUrl)];
        if (matchesUrl) {
            metas.url = matchesUrl[1];
        }

        // // Open graph
        // const regExp = /<meta\s[^>]*property=[\""'](og:[a-z]+)[\""']\s[^>]*content=[\""]([^\""]+?)[\""][^>]*>/g
        // const matches = [...content.matchAll(regExp)];

        // if (matches) {
        //     matches
        //         .map(match => ({property: match[1], content:match[2]}))
        //         .forEach(prop => {
        //             metas[prop.property] = he.decode(prop.content, {isAttributeValue: true}); 
    
        //             // Title
        //             if (prop.property === 'og:title') {
        //                 metas.title = metas[prop.property];
        //             }
        //         });
        // }

        const extractAddressParts = string => {

            let address = {};
            const addressRegexp = /(?:([^,]+), )?([^,]+), ([0-9]{5}) ([^,]+), (.+)/;
            const addressRegexpResult = addressRegexp.exec(string);            

            if (addressRegexpResult) {
                if (typeof addressRegexpResult[1] !== "undefined") {                    
                    address.street = addressRegexpResult[1].trim() + ', ' + addressRegexpResult[2].trim();
                    address.postalCode = addressRegexpResult[3].trim();
                    address.locality = addressRegexpResult[4].trim();
                    address.country = addressRegexpResult[5].trim();
                } else {
                    address.street = addressRegexpResult[2].trim();
                    address.postalCode = addressRegexpResult[3].trim();
                    address.locality = addressRegexpResult[4].trim();
                    address.country = addressRegexpResult[5].trim();
                }

                return address;
            }            

            return null;
        }
        
        // Format Physical Address
        if (metas.place) {
            metas.physicalAddress.description = metas.place;
        }

        // Address parts
        // Get adress parts from metas.address
        if (metas.address) {
            const parts = extractAddressParts(metas.address)
            if (parts) metas.physicalAddress = { ...metas.physicalAddress, ...parts }
        }
        // Else get adress parts from metas.place
        if (metas.place && !metas.physicalAddress.locality) {
            const parts = extractAddressParts(metas.place)
            if (parts) metas.physicalAddress = { ...metas.physicalAddress, ...parts }            
        }
        // Get position
        if (metas.position) {
            metas.physicalAddress.geom = `${metas.position.longitude};${metas.position.latitude}`;
        }

        data.metas = metas;
        
        return data;
    }
}