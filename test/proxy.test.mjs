import { test, it, beforeEach, afterEach } from 'node:test'
import * as assert from 'assert'

const originalEnv = { ...process.env }

test('domainsMatchHostname', async () => {
  const proxyModule = await import('../proxy.mjs')
  it('should match domain suffixes correctly', () => {
    assert.strictEqual(proxyModule.domainsMatchHostname(['example.com'], 'foo.example.com'), true)
    assert.strictEqual(proxyModule.domainsMatchHostname(['example.com'], 'foo.bar.com'), false)
    assert.strictEqual(proxyModule.domainsMatchHostname(['bar.com', 'baz.org'], 'test.baz.org'), true)
    assert.strictEqual(proxyModule.domainsMatchHostname([], 'any.com'), false)
  })
})

test('getProxyUrl', async () => {
  const proxyModule = await import('../proxy.mjs')
  it('should build proxy URL with all credentials', () => {
    const url = proxyModule.getProxyUrl('user', 'pass', 'proxy.example.com:8080', 'http')
    assert.strictEqual(url, 'http://user:pass@proxy.example.com:8080')
  })
  it('should build proxy URL without password', () => {
    const url = proxyModule.getProxyUrl('user', '', 'proxy.example.com:8080', 'http')
    assert.strictEqual(url, 'http://user@proxy.example.com:8080')
  })
  it('should build proxy URL without username and password', () => {
    const url = proxyModule.getProxyUrl('', '', 'proxy.example.com:8080', 'http')
    assert.strictEqual(url, 'http://proxy.example.com:8080')
  })
  it('should encode credentials', () => {
    const url = proxyModule.getProxyUrl('us@er', 'p@ss', 'proxy.example.com:8080', 'http')
    assert.strictEqual(url, 'http://us%40er:p%40ss@proxy.example.com:8080')
  })
})

test('prepareRequestFunction with env variables', async () => {
  let proxyModule
  beforeEach(async () => {
    process.env.USE_PROXY = '1'
    process.env.PROXY_USERNAME = 'user'
    process.env.PROXY_PASSWORD = 'pass'
    process.env.PROXY_SERVER = 'proxy.example.com:8080'
    process.env.PROXY_PROTOCOL = 'http'
    process.env.PROXY_ONLY_FOR_DOMAINS = 'foo.com,bar.org'
    proxyModule = await import('../proxy.mjs?' + Math.random())
  })
  afterEach(() => {
    Object.assign(process.env, originalEnv)
  })

  it('should use proxy for matching domain', async () => {
    await beforeEach()
    const result = proxyModule.prepareRequestFunction({ hostname: 'test.foo.com' })
    assert.strictEqual(result.upstreamProxyUrl, 'http://user:pass@proxy.example.com:8080')
  })
  it('should not use proxy for non-matching domain', async () => {
    await beforeEach()
    const result = proxyModule.prepareRequestFunction({ hostname: 'baz.example.net' })
    assert.strictEqual(result.upstreamProxyUrl, null)
  })
  it('should use proxy for all domains if PROXY_ONLY_FOR_DOMAINS is empty', async () => {
    await beforeEach()
    process.env.PROXY_ONLY_FOR_DOMAINS = ''
    proxyModule = await import('../proxy.mjs?' + Math.random())
    const result = proxyModule.prepareRequestFunction({ hostname: 'baz.example.net' })
    assert.strictEqual(result.upstreamProxyUrl, 'http://user:pass@proxy.example.com:8080')
  })
  it('should not use proxy if USE_PROXY is not 1', async () => {
    await beforeEach()
    process.env.USE_PROXY = '0'
    proxyModule = await import('../proxy.mjs?' + Math.random())
    const result = proxyModule.prepareRequestFunction({ hostname: 'foo.com' })
    assert.strictEqual(result.upstreamProxyUrl, null)
  })
})
