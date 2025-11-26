const puppeteer = require('puppeteer');
const useProxy = process.env.USE_PROXY === '1' ? true : false;
const proxyServer = process.env.PROXY_SERVER;
const proxyUsername = process.env.PROXY_USERNAME;
const proxyPassword = process.env.PROXY_PASSWORD;

const getDefaultBrowser = async (url, headless) => {
  const args = [
    '--no-sandbox',
    '--disable-setuid-sandbox',
  ];
  if (useProxy) {
    args.push('--proxy-server=' + proxyServer);
  }
  const browser = await puppeteer.launch({
    headless,
    args,
  });
  
  const context = browser.defaultBrowserContext();
  context.overridePermissions(url, []);
  return browser;
};

const getDefaultPage = async (browser) => {
  const page = await browser.newPage();
  // Authenticate proxies
  if (useProxy) {
    await page.authenticate({
        username: proxyUsername,
        password: proxyPassword
    });  
  }
  const customUA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:140.0) Gecko/20100101 Firefox/140.0'; 
  await page.setUserAgent(customUA);
  await page.setViewport({
    width: 800,
    height: 800,
    deviceScaleFactor: 1,
  });
  await page.setDefaultNavigationTimeout(Number.MAX_SAFE_INTEGER);

  return page;
};

module.exports = {
  scrap: async (url, parser, metas) => {
    const browser = await getDefaultBrowser(url, true);
    const page = await getDefaultPage(browser);
    await page.goto(url, { waitUntil: 'load', timeout: 0 });    
    const data = await parser.parse(page, metas);
    await browser.close();

    return data;
  }
}