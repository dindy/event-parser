import { debugPage } from '../utils/utils.mjs';
import { getJsonPath, getFirstJsonPath } from '../utils/json-parser.mjs';

const parse = async (page, metas) => {
    
    debugPage(page)

    const scripts = await page.$$eval('script', scripts => scripts
        .filter(script => script.type === "application/json")
        .map(script => script.textContent)
    );     
    
    for (const scriptContent of scripts) {
        try {
            const json = JSON.parse(scriptContent)
            const edges = getJsonPath('$..pageItems.edges', json)
            const events = edges[0] || []

            for (const event of events) {

                if (event.node?.node?.__typename !== 'Event') continue

                const url = event.node?.node?.url
                const id = event.node?.id
                const startTimestamp = event.node?.actions_renderer?.event?.start_timestamp
                if (url && startTimestamp) {
                    metas.push({id, url, startTimestamp})
                }
            }
            
        } catch (e) {
            console.log('Erreur parsing JSON : ', e);
        }
    }

    return metas
}

export default { parse };