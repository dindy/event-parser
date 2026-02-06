import { Cluster } from 'puppeteer-cluster'
import puppeteer from "puppeteer-extra"
import StealthPlugin from "puppeteer-extra-plugin-stealth"

puppeteer.use(StealthPlugin())

const useProxy = process.env.USE_PROXY === '1' ? true : false
const proxyServer = process.env.PROXY_SERVER
const args = [
    "--no-sandbox"
    // '--disable-extensions',
    // '--disable-plugins',
    // '--disable-gpu',
    // '--disable-software-rasterizer',
    // '--disable-dev-shm-usage',    
]
if (useProxy) {
    args.push('--proxy-server=' + proxyServer);
}
const cluster = await Cluster.launch({
    concurrency: Cluster.CONCURRENCY_CONTEXT,
    maxConcurrency: 2,
    puppeteer,
    puppeteerOptions: {
        headless: true,
        args
    }
})

export default cluster