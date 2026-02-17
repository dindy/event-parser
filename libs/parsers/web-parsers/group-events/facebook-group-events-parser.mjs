import { getJsonPath, getFirstJsonPath } from '../utils/json-parser.mjs';

const parse = async (page, metas) => {
    
    const scripts = await page.$$eval('script', scripts => scripts
        .filter(script => script.type === "application/json")
        .map(script => script.textContent)
    );     
    
    for (const scriptContent of scripts) {
        try {
            const json = JSON.parse(scriptContent)

            let edges = getJsonPath('$..pageItems.edges', json)

            if (edges && edges.length > 0) {

                const events = edges[0] || []

                for (const event of events) {
    
                    if (event.node?.node?.__typename !== 'Event') continue
    
                    const url = event.node?.node?.url
                    const id = event.node?.id
                    const startTimestamp = event.node?.actions_renderer?.event?.start_timestamp
                    const isPast = startTimestamp ?
                        startTimestamp * 1000 < (new Date).getTime()
                        : null
                    if (url) {
                        metas.push({id, url, isPast})
                    }
                }

            } else {

                edges = getJsonPath('$..upcoming_events.edges', json)
                
                if (!edges || !edges[0]) continue
                
                for (const edge of edges[0]) { 

                    const event = edge.node
                    const isPast = event.is_past
                    const url = event.eventUrl
                    const id = event.id

                    if (url) {
                        metas.push({id, url, isPast})
                    }
                }

            }
            
        } catch (error) {
            console.log('Erreur parsing JSON : ', error)
            throw error
        }
    }

    return metas
}

export default { parse };