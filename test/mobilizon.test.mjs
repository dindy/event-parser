// import * as td from 'testdouble'
import { test, mock, afterEach, beforeEach, it } from 'node:test'
import * as chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { ExpiredTokenError } from '../api/exceptions/ExpiredTokenError.mjs'
import { RefreshTokenError } from '../api/exceptions/RefreshTokenError.mjs'
import MobilizonRefreshTokenError from '../middlewares/exceptions/MobilizonRefreshTokenError.mjs'

chai.use(chaiAsPromised)

test("Test refreshOnExpired", async function () {

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
    const refreshTokenGetData = mock.fn()
    const refreshToken = mock.fn()
    const passGetData = mock.fn(async () => ({ data: 'data' }))
    const pass = mock.fn()
    const findById = mock.fn()
    const refresh = mock.fn()
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
        refresh.mock.resetCalls()
        refreshToken.mock.resetCalls()
        findById.mock.resetCalls()
        pass.mock.resetCalls()
        passGetData.mock.resetCalls()
        refreshTokenGetData.mock.resetCalls()
    })
    
    // Replace used functions in dependencies
    mock.module('../api/mobilizon.mjs', {
        namedExports: {
            refreshToken
        }
    })
    mock.module('../models/Authorization.mjs', {
        namedExports: {
            findById,
            refresh
        }
    })
    mock.module('../api/exceptions/ExpiredTokenError.mjs', {
        namedExports: {
            ExpiredTokenError
        }
    })
    mock.module('../api/exceptions/RefreshTokenError.mjs', {
        namedExports: {
            RefreshTokenError
        }
    })
    mock.module('../middlewares/exceptions/MobilizonRefreshTokenError.mjs', {
        defaultExport: MobilizonRefreshTokenError
    })
    mock.module('../middlewares/sessionWriter.mjs', {
        namedExports: {
            updateTokenSession: () => null
        }
    })
    pass.mock.mockImplementation((domain, accessToken, contentType, body) =>
    {    
        if (accessToken === initialAccessToken) {
            throw new ExpiredTokenError(null, null)
        } else if (accessToken === newAccessToken) {
            return { getData: passGetData }
        }
    })        

    const { refreshOnExpired } = await import('../middlewares/utils.mjs')

    it("should refresh token when is no longer valid", async function ()
    { 
        findById.mock.mockImplementation(async (id) => {
            if (id === authId) {
                return initialAuthObject
            }
        })
        refreshTokenGetData.mock.mockImplementation(async () => {
            return {
                accessToken: newAccessToken,
                refreshToken: newRefreshToken
            }
        })
        refreshToken.mock.mockImplementation((domain, refreshToken) => {
            if (domain === domain && refreshToken === initialRefreshToken) {
                return { getData: refreshTokenGetData }
            }
        })
        const result = await refreshOnExpired(pass, domain, initialAccessToken, authId, res, contentType, body)
        chai.expect(result).to.be.a('object')
        chai.expect(result).to.have.property('data').equal('data')
        chai.expect(refresh.mock.calls.length).to.equal(1)
        chai.expect(refresh.mock.calls[0].arguments[0]).to.equal(initialAuthObject)
        chai.expect(refresh.mock.calls[0].arguments[1]).to.equal(newRefreshToken)
        chai.expect(refresh.mock.calls[0].arguments[2]).to.equal(newAccessToken)
    })
    
    it("should use the new access token from database when there is one", async function () {

        findById.mock.mockImplementation(async (id) => {
            if (id === authId) {
                return {
                    id: 1,
                    accessToken: newAccessToken
                }
            }
        })
        
        const result = await refreshOnExpired(pass, domain, initialAccessToken, authId, res, contentType, body)
        chai.expect(result).to.be.a('object')
        chai.expect(result).to.have.property('data').equal('data')
        chai.expect(refreshToken.mock.calls.length).to.equal(0)
        chai.expect(refresh.mock.calls.length).to.equal(0)
    })

    it('should wait for the current refresh token operation to finish instead of launching a new one', async function () {
        
        findById.mock.mockImplementationOnce(async (id) => initialAuthObject, 0)
        findById.mock.mockImplementationOnce(async (id) => initialAuthObject, 1)
        findById.mock.mockImplementationOnce(async (id) => newAuthObject, 2)
        refreshToken.mock.mockImplementationOnce((domain, refreshToken) => {
            if (domain === domain && refreshToken === initialRefreshToken) {
                throw new RefreshTokenError(null, null)
            }
        }, 0)
        const { refreshOnExpired } = await import('../middlewares/utils.mjs')
        const result = await refreshOnExpired(pass, domain, initialAccessToken, authId, res, contentType, body)
        chai.expect(result).to.be.a('object')
        chai.expect(result).to.have.property('data').equal('data')        
        chai.expect(refresh.mock.calls.length).to.equal(0)
    })

    it('should throw a exception if no new token is found in database when the timeout is reached', async function () {
        
        findById.mock.mockImplementation(async (id) => {
            if (id === authId) {
                return initialAuthObject
            }
        })

        refreshToken.mock.mockImplementationOnce((domain, refreshToken) => {
            if (domain === domain && refreshToken === initialRefreshToken) {
                throw new RefreshTokenError(null, null)
            }
        }, 0)
        
        let exceptionThrown = null
        try {
            await refreshOnExpired(pass, domain, initialAccessToken, authId, res, contentType, body)
        } catch (exception) {
            exceptionThrown = exception
        }
        chai.expect(exceptionThrown).to.be.instanceOf(MobilizonRefreshTokenError)
        chai.expect(refresh.mock.calls.length).to.equal(0)       
    })
})