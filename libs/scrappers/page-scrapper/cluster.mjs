import { Cluster } from 'puppeteer-cluster'
import puppeteer from "puppeteer-extra"
import StealthPlugin from "puppeteer-extra-plugin-stealth"

puppeteer.use(StealthPlugin())

const headless = process.env.PUPPETEER_HEADLESS_MODE === '1' ? true : false
const args = [
    "--no-sandbox"
    // '--disable-extensions',
    // '--disable-plugins',
    // '--disable-gpu',
    // '--disable-software-rasterizer',
    // '--disable-dev-shm-usage',    
]

// Always use local proxy, which will decide whether to forward the request to the actual proxy.
args.push('--proxy-server=http://localhost:8001')

const cluster = await Cluster.launch({
    concurrency: Cluster.CONCURRENCY_CONTEXT,
    maxConcurrency: 3,
    puppeteer,
    puppeteerOptions: {
        headless,
        args
    }
})

export default cluster