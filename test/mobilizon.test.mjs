import * as td from 'testdouble'
import * as chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { ExpiredTokenError } from '../api/exceptions/ExpiredTokenError.mjs'
import { RefreshTokenError } from '../api/exceptions/RefreshTokenError.mjs'
import MobilizonRefreshTokenError from '../middlewares/exceptions/MobilizonRefreshTokenError.mjs'

chai.use(chaiAsPromised)

describe("Test refreshOnExpired", async function () {

    // Fake data
    const domain = 'my.domain'
    const initialAccessToken = 'token'
    const newAccessToken = 'new_token'
    const initialRefreshToken = 'refresh_token'
    const newRefreshToken = 'new_refresh_token'
    const authId = 1
    const res = {}
    const contentType = 'content-type'
    const body = 'body'

    // Double functions
    const refreshTokenGetData = td.func()
    const refreshToken = td.function('Mobilizon API refreshToken')
    const passGetData = td.func()
    const pass = td.function('Mobilizon API pass')
    const findById = td.func('Authorization.findById')
    const refresh = td.function('Authorization.refresh')
    const any = td.matchers.anything
    const initialAuthObject = {
        accessToken: initialAccessToken,
        refreshToken: initialRefreshToken
    }
    const newAuthObject = {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken
    }

    // Reset double data after each test
    afterEach(function () {
        td.reset()
    })

    beforeEach(async function () {
    
        // Replace used functions in dependencies
        await td.replaceEsm('../api/mobilizon.mjs', {
            refreshToken
        })        
        await td.replaceEsm('../models/Authorization.mjs', {
            findById,
            refresh
        })
        await td.replaceEsm('../api/exceptions/ExpiredTokenError.mjs', {
            ExpiredTokenError
        })
        await td.replaceEsm('../api/exceptions/RefreshTokenError.mjs', {
            RefreshTokenError
        })
        await td.replaceEsm('../middlewares/exceptions/MobilizonRefreshTokenError.mjs', {
            default: MobilizonRefreshTokenError
        })
        await td.replaceEsm('../middlewares/sessionWriter.mjs', {
            updateTokenSession: () => null
        })
        td.when(passGetData()).thenResolve({ data: 'data' })
        td.when(pass(domain, initialAccessToken, contentType, body)).thenThrow(new ExpiredTokenError(null, null))
        td.when(pass(domain, newAccessToken, contentType, body)).thenReturn({ getData: passGetData })         
    })

    it("should refresh token when is no longer valid", async function () { 

        td.when(findById(authId)).thenResolve(initialAuthObject)    
        td.when(refreshTokenGetData()).thenResolve({
            accessToken: newAccessToken,
            refreshToken: newRefreshToken
        })
        td.when(refreshToken(domain, initialRefreshToken)).thenReturn({getData: refreshTokenGetData})
        const { refreshOnExpired } = await import('../middlewares/utils.mjs')
        const result = await refreshOnExpired(pass, domain, initialAccessToken, authId, res, contentType, body)
        chai.expect(result).to.be.a('object')
        chai.expect(result).to.have.property('data').equal('data')
        td.verify(refresh(initialAuthObject, newRefreshToken, newAccessToken))
    })
    
    it("should use the new access token from database when there is one", async function () {

        // The access token in db has changed
        td.when(findById(authId)).thenResolve({
            id: 1,
            accessToken: newAccessToken
        })
        
        const { refreshOnExpired } = await import('../middlewares/utils.mjs')
        const result = await refreshOnExpired(pass, domain, initialAccessToken, authId, res, contentType, body)
        chai.expect(result).to.be.a('object')
        chai.expect(result).to.have.property('data').equal('data')
        td.verify(refreshToken(any(), any()), { times: 0 })
        td.verify(refresh(any(), any(), any()), { times: 0 })
    })

    it('should wait for the current refresh token operation to finish instead of launching a new one', async function () {
        
        td.when(findById(authId)).thenResolve(newAuthObject)
        td.when(findById(authId), { times: 2 }).thenResolve(initialAuthObject)
        td.when(refreshToken(domain, initialRefreshToken), { times: 1 }).thenThrow(new RefreshTokenError(null, null))
        
        const { refreshOnExpired } = await import('../middlewares/utils.mjs')
        const result = await refreshOnExpired(pass, domain, initialAccessToken, authId, res, contentType, body)
        chai.expect(result).to.be.a('object')
        chai.expect(result).to.have.property('data').equal('data')        
        td.verify(refresh(any(), any(), any()), { times: 0 })
    })

    it('should throw a exception if no new token is found in database when the timeout is reached', async function () {
        td.when(findById(authId)).thenResolve(initialAuthObject)
        td.when(refreshToken(domain, initialRefreshToken), { times: 1 }).thenThrow(new RefreshTokenError(null, null))
        
        const { refreshOnExpired } = await import('../middlewares/utils.mjs')
        let exceptionThrown = null
        try {
            await refreshOnExpired(pass, domain, initialAccessToken, authId, res, contentType, body)
        } catch (exception) {
            exceptionThrown = exception
        }
        chai.expect(exceptionThrown).to.be.instanceOf(MobilizonRefreshTokenError)
        td.verify(refresh(any(), any(), any()), { times: 0 })        
    })
})