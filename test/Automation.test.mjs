import { test, before, it, after } from 'node:test'
import { sequelize } from '../database/database.mjs'
import { Application } from '../models/Application.mjs'
import { Authorization } from '../models/Authorization.mjs'
import { Automation, findAuthorized, exists } from '../models/Automation.mjs'
import { expect } from 'chai'

test('Test Automation', () => {
    
    let app1, app2, auth1, auth2, automation1, automation2

    after(async () => {
        sequelize.close()
    })

    before(async () => {

		await sequelize.query('SET FOREIGN_KEY_CHECKS = 0')
		await sequelize.sync({ force: true })
		await sequelize.query('SET FOREIGN_KEY_CHECKS = 1')

        // Create two applications
        app1 = await Application.create({ name: 'App1', domain: 'example1.com' })
        app2 = await Application.create({ name: 'App2', domain: 'example2.com' })

        // Create one authorization for each application
        auth1 = await Authorization.create({ applicationId: app1.id, accessToken: 'token1', hash: 'hash1' })
        auth2 = await Authorization.create({ applicationId: app2.id, accessToken: 'token2', hash: 'hash2' })

        // Create one automation for each authorization
        automation1 = await Automation.create({
            authorizationId: auth1.id,
            attributedToId: 1,
            organizerActorId: 2,
            url: 'https://example.com/1',
            type: 'ics',
            active: true
        })
        automation2 = await Automation.create({
            authorizationId: auth2.id,
            attributedToId: 1,
            organizerActorId: 2,
            url: 'https://example.com/1',
            type: 'ics',
            active: true
        })
    })

    it('should return only the matching automation for a given authorization', async () => {

        // Use findAuthorized to get the matching automation
        const result = await findAuthorized(auth1.id, { attributedToId: 1, organizerActorId: 2 })

        expect(result.length).to.equal(1)
        expect(result[0].id).to.equal(automation1.id)
        expect(result[0].authorizationId).to.equal(auth1.id)
        expect(result[0].url).to.equal('https://example.com/1')
    })

    it('should return only automation2 when calling exists with auth2 id and matching criteria', async () => {
        // Reuse previous setup: auth2, automation2
        const result = await exists(auth2.id, {
            url: 'https://example.com/1',
            type: 'ics',
            attributedToId: 1,
            organizerActorId: 2
        })
        expect(result).to.not.be.null
        expect(result.id).to.equal(automation2.id)
        expect(result.authorizationId).to.equal(auth2.id)
    })    
})
