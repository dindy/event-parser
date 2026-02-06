import { Cluster } from 'puppeteer-cluster'

const useProxy = process.env.USE_PROXY === '1' ? true : false
const proxyServer = process.env.PROXY_SERVER
const args = [
    '--disable-extensions',
    '--disable-plugins',
    '--disable-gpu',
    '--disable-software-rasterizer',
    '--disable-dev-shm-usage',    
]
if (useProxy) {
    args.push('--proxy-server=' + proxyServer);
}
const cluster = await Cluster.launch({
    concurrency: Cluster.CONCURRENCY_CONTEXT,
    maxConcurrency: 2,
    puppeteerOptions: { args }
})

export default cluster