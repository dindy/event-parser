import { test, before, it, after } from 'node:test'
import { sequelize } from '../database/database.mjs'
import { Application } from '../models/Application.mjs'
import { Authorization, findByMbzUserId } from '../models/Authorization.mjs'
import { expect } from 'chai'

test('Test Authorization', () => { 

	after(async () => {
		sequelize.close()
	})

	before(async () => {
		await sequelize.query('SET FOREIGN_KEY_CHECKS = 0')
		await sequelize.sync({ force: true })
		await sequelize.query('SET FOREIGN_KEY_CHECKS = 1')
	})

	it('should return only the correct authorization for a given mobilizonUserId and application', async () => {
		// Create two applications
		const app1 = await Application.create({ name: 'App1', domain: 'example1.com' })
		const app2 = await Application.create({ name: 'App2', domain: 'example2.com' })

		// Create two authorizations with the same mobilizonUserId but different applications
		const mobilizonUserId = 42
		const auth1 = await Authorization.create({ applicationId: app1.id, accessToken: 'token1', hash: 'hash1', mobilizonUserId })
		const auth2 = await Authorization.create({ applicationId: app2.id, accessToken: 'token2', hash: 'hash2', mobilizonUserId })

		// findByMbzUserId should return only the authorization for the specified application
		const result = await findByMbzUserId(mobilizonUserId, app2.id)
		expect(result).to.not.be.null
		expect(result.id).to.equal(auth2.id)
		expect(result.applicationId).to.equal(app2.id)
		expect(result.accessToken).to.equal('token2')

		// Should not return auth2
		expect(result.id).to.not.equal(auth1.id)
	})
    
})