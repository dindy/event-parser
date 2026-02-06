import cluster from './cluster.mjs'

const useProxy = process.env.USE_PROXY === '1' ? true : false;
const proxyUsername = process.env.PROXY_USERNAME;
const proxyPassword = process.env.PROXY_PASSWORD;

const configurePage = async page => {

  if (useProxy) {
    await page.authenticate({
      username: proxyUsername,
      password: proxyPassword
    })  
  }
  
  // const customUA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:140.0) Gecko/20100101 Firefox/140.0';
  const customUA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ApplicationleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36'; 
  
  await page.setUserAgent(customUA);
  
  await page.setViewport({
    width: 800,
    height: 800,
    deviceScaleFactor: 1,
  })

  await page.setExtraHTTPHeaders({
    'Referer': 'https://www.google.com/',  
    'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
    'sec-ch-prefers-color-scheme': 'light',
    'sec-ch-ua': 'Chromium";v="142", "Google Chrome";v="142", "Not_A Brand";v="99',
    'sec-ch-ua-full-version-list': 'Chromium";v="142.0.7444.176", "Google Chrome";v="142.0.7444.176", "Not_A Brand";v="99.0.0.0',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-model': "",
    'sec-ch-ua-platform': "Windows",
    'sec-ch-ua-platform-version': "19.0.0",
    'sec-fetch-dest': 'document',
    'sec-fetch-mode': 'navigate',
    'sec-fetch-site': 'same-origin',
    'sec-fetch-user': '?1'  
  })

  await page.setDefaultNavigationTimeout(Number.MAX_SAFE_INTEGER)

  return page
}

const scrap = async (url, parser, metas) =>
{
  return await cluster.execute(url, async ({ page, data }) =>
  {
    page = await configurePage(page)
    
    await page.goto(data, { waitUntil: 'load', timeout: 0 })

    return await parser.parse(page, metas)
  })
}

export default { scrap }