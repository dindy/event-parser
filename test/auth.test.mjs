import { test } from 'node:test'
import { expect } from 'chai'

test('sanitizeDomain should remove trailing slash', async () => {
    const { sanitizeDomain } = await import('../middlewares/auth.mjs')
    expect(sanitizeDomain('example.com/')).to.equal('example.com')
})

test('sanitizeDomain should not modify domain without trailing slash', async () => {
    const { sanitizeDomain } = await import('../middlewares/auth.mjs')
    expect(sanitizeDomain('example.com')).to.equal('example.com')
})