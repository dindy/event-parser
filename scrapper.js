const puppeteer = require('puppeteer');
const fs = require('fs').promises;

const LOGGED_TOKEN = 'Sylvain';
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
    console.log('Use proxy');
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
  scrap: async (url, parser, cookiesFile) => {
    const browser = await getDefaultBrowser(url, true);
    const page = await getDefaultPage(browser);

    if (cookiesFile) {
      // Load cookies from previous session
      const cookies = await fs.readFile(cookiesFile)
        .then((cookies) => JSON.parse(cookies))
        .catch((error) => {
          console.error(`Unable to load and parse cookies: ${error}`);
          return {};
        });

      // Load page with cookies
      // console.log(cookies);
      // process.exit();
      await browser.setCookie(...cookies);
      await page.setCookie(...cookies);
    }
    await page.goto(url, { waitUntil: 'load', timeout: 0 });
    const html = await page.content();
    const found = html.indexOf(LOGGED_TOKEN) !== -1;
    if (found && cookiesFile) {
      console.log('Logged in !');
      // Save our freshest cookies
      await page.cookies().then(async (freshCookies) => {
        await fs.writeFile(cookiesFile, JSON.stringify(freshCookies, null, 2));
      });
    } else {
      console.log('Not logged in :-(');
    }

    // const content = await page.content();
    // await fs.writeFile('page.html', content);
    // data.images = await page.$$eval('img', images => images.map(image => image.src));
    // // data.meta = await page.$$eval('meta', metas => metas.map(meta => meta));
    // const regExp = /<meta\s[^>]*property=[\""'](og:[a-z]+)[\""']\s[^>]*content=[\""']([^'^\""]+?)[\""'][^>]*>/g
    // const matches = [...content.matchAll(regExp)];
    // // await fs.writeFile('page.html', JSON.stringify(matches));
    // const metas = matches.map(match => ({property: match[1], content:match[2]}));
  // data.metas = metas;
    const metas = {
      startTimestamp: null,
      endTimestamp: null,
      description: null,
      place: null,
      ticketsUrl: null,
      address: null,
      hosts: [],
      url: null,
      online: null,
      physicalAddress: {
        description: null,
        geom: null,
        locality: null,
        postalCode: null,
        street: null,
        country: null,
      },
      og: []
    };
    const data = await parser.parse(page, metas);
    await browser.close();

    return data;
  }
}