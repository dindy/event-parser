import { test, afterEach } from 'node:test'
import * as chai from 'chai'
import chaiAsPromised from 'chai-as-promised'

chai.use(chaiAsPromised)

const buildEvent = () => ({
    title: 'Test event',
    description: 'Event description',
    beginsOn: '2026-01-01T00:00:00Z',
    endsOn: '2026-01-01T01:00:00Z',
    organizerActorId: 'organizer-1',
    attributedToId: 'actor-1',
    tags: [],
    options: {},
    metadata: []
})

const createFetchMock = () => {
    const calls = []

    const fn = async (url, options) => {
        calls.push({ url, options, calledAt: Date.now() })
        return {
            status: 200,
            json: async () => ({
                data: {
                    createEvent: {
                        id: '1',
                        uuid: 'uuid-1'
                    }
                }
            })
        }
    }

    return { fn, calls }
}

afterEach(() => {
    delete global.fetch
})

test('saveEvent enqueues excess requests and executes one per second per domain', async () => {
    const { fn: fetchMock, calls } = createFetchMock()
    global.fetch = fetchMock

    const { saveEvent } = await import('../api/mobilizon.mjs')
    const domain = `rate-limit-domain-${Date.now()}`
    const event = buildEvent()

    const firstPromise = saveEvent(domain, 'token', event).getData()
    const secondPromise = saveEvent(domain, 'token', event).getData()

    const [firstResult, secondResult] = await Promise.all([firstPromise, secondPromise])

    chai.expect(firstResult).to.deep.equal({ id: '1', uuid: 'uuid-1' })
    chai.expect(secondResult).to.deep.equal({ id: '1', uuid: 'uuid-1' })
    chai.expect(calls.length).to.equal(2)
    chai.expect(calls[1].calledAt - calls[0].calledAt).to.be.at.least(950)
})

test('saveEvent uses separate queues for different domains', async () => {
    const { fn: fetchMock, calls } = createFetchMock()
    global.fetch = fetchMock

    const { saveEvent } = await import('../api/mobilizon.mjs')
    const event = buildEvent()
    const domainA = `rate-limit-domain-A-${Date.now()}`
    const domainB = `rate-limit-domain-B-${Date.now()}`

    const promiseA = saveEvent(domainA, 'token', event).getData()
    const promiseB = saveEvent(domainB, 'token', event).getData()

    const [resultA, resultB] = await Promise.all([promiseA, promiseB])

    chai.expect(resultA).to.deep.equal({ id: '1', uuid: 'uuid-1' })
    chai.expect(resultB).to.deep.equal({ id: '1', uuid: 'uuid-1' })
    chai.expect(calls.length).to.equal(2)
    chai.expect(Math.abs(calls[0].calledAt - calls[1].calledAt)).to.be.lessThan(200)
})
