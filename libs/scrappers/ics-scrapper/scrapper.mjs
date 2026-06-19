import { ProxyAgent, fetch } from 'undici'
import parser from '../../parsers/ics-parsers/events.mjs' 

const client = new ProxyAgent('http://127.0.0.1:8001');

export const scrap = async url =>
{
    const abortCtrl = new AbortController()
    setTimeout(() => abortCtrl.abort(), 30_000)
    try {
        const response = await fetch(url, {
            dispatcher: client,
            signal: abortCtrl.signal,
            proxyTunnel: false // Stops Undici from expecting a raw CONNECT block
        }); 

        const data = await response.text();
        
        return await parser.parse(data)
    } catch (err) {
        console.error("Fetch failed wrapper:", err.message);
        console.error("True structural cause:", err.cause); 
        // Look for: ECONNREFUSED, UND_ERR_CONNECT_TIMEOUT, etc.
        throw err;
    }
}        