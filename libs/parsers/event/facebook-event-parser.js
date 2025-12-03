import { convertUrlToBase64, extractAddressParts, debugPage } from '../utils/utils.js';
import { getJsonPath, getFirstJsonPath } from '../utils/json-parser.js';
import fs from 'fs/promises';
import he from 'he';
import defaultParser from './default-event-parser.js';

const parse = async (page, metas) => {

    debugPage(page);
    const data = {};
    data.images = [];
    const content = await page.content();

    const commonMetas = await defaultParser.parse(page, metas);
    
    const url = commonMetas.metas.url;
    metas.description = commonMetas.metas.description;
    metas.url = commonMetas.metas.url;
    metas.title = commonMetas.metas.title;
    metas.startTimestamp = commonMetas.metas.startTimestamp;
    metas.endTimestamp = commonMetas.metas.endTimestamp;
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

            // Cover
            const fullImage = getFirstJsonPath("$..[*].cover_photo..full_image.uri", json);
            if (fullImage) {
                const parsedImage = await convertUrlToBase64(fullImage);
                if (parsedImage) {
                    data.images.push(parsedImage);
                }                     
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
        const parsedImage = await convertUrlToBase64(src);
        if (parsedImage) {
            data.images.push(parsedImage);
        }            
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


    // Address parts
    let hasAddress = false

    // Get adress parts from metas.address
    if (metas.address) {
        const parts = extractAddressParts(metas.address)
        if (parts) {
            hasAddress = true 
            metas.physicalAddress = { ...metas.physicalAddress, ...parts }
        }
    }
    
    // Else get adress parts from metas.place
    if (metas.place && !hasAddress) {
        const parts = extractAddressParts(metas.place)
        if (parts) {
            hasAddress = true
            metas.physicalAddress = { ...metas.physicalAddress, ...parts }
        }
    }

    // Format Physical Address
    if (metas.place) {
        const firstPart = metas.place.split(',')[0];
        if (hasAddress) {
            if (metas.physicalAddress.street.toUpperCase().indexOf(firstPart.toUpperCase()) === -1) {
                metas.physicalAddress.description = firstPart;
            }
        } else {
            metas.physicalAddress.description = firstPart;
        }
    }   

    // Get position
    if (metas.position) {
        metas.physicalAddress.geom = `${metas.position.longitude};${metas.position.latitude}`;
    }

    data.metas = metas;
    
    return data;
}

export default { parse };