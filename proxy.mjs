import './dotenv.mjs'
import ProxyChain from 'proxy-chain'

const envProxyEnabled = process.env.USE_PROXY === '1' ? true : false
const envProxyUsername = process.env.PROXY_USERNAME;
const envProxyPassword = process.env.PROXY_PASSWORD;
const envProxyServer = process.env.PROXY_SERVER;
const envProxyProtocol = process.env.PROXY_PROTOCOL || 'http';
const envProxyOnlyForDomains = process.env.PROXY_ONLY_FOR_DOMAINS ? process.env.PROXY_ONLY_FOR_DOMAINS.split(',') : [];

export const domainsMatchHostname = (domains, hostname) => domains.some(domain => hostname.endsWith(domain))

export const getProxyUrl = (username, password, server, protocol) => {
  return `${protocol.toLowerCase()}://${username ? encodeURIComponent(username) : ''}${password ? ':' + encodeURIComponent(password) : ''}${username ? '@' : ''}${server}`
}

export const prepareRequestFunction = ({ request, username, password, hostname, port, isHttp, connectionId }) => {
    // If envProxyOnlyForDomains is empty, use proxy for all domains. Otherwise, use proxy only for specified domains.
    const match = domainsMatchHostname(envProxyOnlyForDomains, hostname)
    const useProxy = envProxyEnabled && (envProxyOnlyForDomains.length === 0 || match)
    const proxyUrl = getProxyUrl(envProxyUsername, envProxyPassword, envProxyServer, envProxyProtocol)
    
    return {
      upstreamProxyUrl: useProxy ? proxyUrl : null,
      ignoreUpstreamProxyCertificate: true,
      // Optional custom tag that will be passed back via
      // `tunnelConnectResponded` or `tunnelConnectFailed` events
      // Can be used to pass information between proxy-chain
      // and any external code or application using it
      // customTag: { userId: '123' },
    };
  }

const server = new ProxyChain.Server({
  // Port where the server will listen. By default 8000.
  port: 8001,
  // You can use this option to limit the access to the proxy server.
  host: 'localhost',
  // Enables verbose logging
  verbose: true,
  prepareRequestFunction
})

// Emitted when HTTP connection is closed
server.on('connectionClosed', ({ connectionId, stats }) => {
  console.log(`Connection ${connectionId} closed`);
  console.dir(stats);
});

// Emitted when HTTP request fails
server.on('requestFailed', ({ request, error }) => {
  console.log(`Request ${request.url} failed`);
  console.error(error);
});

export default server