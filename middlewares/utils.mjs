import { ExpiredTokenError, RequestError, AuthError } from "../api/exceptions/index.mjs"
import { refreshToken } from "../api/mobilizon.mjs"
import { findById as findAuthById } from "../models/Authorization.mjs"
import { refresh as refreshAuthorization } from "../models/Authorization.mjs"
import MobilizonRefreshTokenError from "./exceptions/MobilizonRefreshTokenError.mjs"
import { updateTokenSession } from './sessionWriter.mjs'
import { RefreshTokenError } from '../api/exceptions/RefreshTokenError.mjs'

const sleep = ms => new Promise((resolve) => {
    setTimeout(resolve, ms);
})

const dt = str => "'..." + str.substring(str.length - 8) + "'"

export const refreshOnExpired = async(
    ...args    
) => await internalRefreshOnExpired(
    Math.floor(Math.random() * 1000),
    ...args
)

const internalRefreshOnExpired = async (
    id,
    request,
    domain,
    accessToken,
    authId,
    res,
    ...args
) => {
    
    // Try to make the request
    try {

        console.log(id, `Call api with token ${dt(accessToken)}`)
        return await request(domain, accessToken, ...args).getData()

    } catch (error) {    

        // If token has expired
        if (error instanceof ExpiredTokenError) {            
            
            console.log(id, `Token ${dt(accessToken)} has expired`)
            
            // Check that the access token from cookie is the cookie in DB
            // because maybe the token has changed
            const auth = await findAuthById(authId)
            
            // If access token has changed
            if (accessToken !== auth.accessToken) {
            
                console.log(id, `Token in cookie ${dt(accessToken)} has been replaced in DB with ${dt(auth.accessToken)}`)
            
                // Update the user session
                updateTokenSession(res, auth, domain)
            
                // Update the access token
                accessToken = auth.accessToken
            
            // If there is no new access token in DB
            } else {

                console.log(id, `No new token found in database. Trying to refresh the token ${dt(accessToken)}`)

                // Try to refresh the token
                try {

                    // Call the Mobilizon API to refresh the token
                    const tokenData = await refreshToken(domain, auth.refreshToken).getData()
                    
                    // Update the authorization in DB
                    await refreshAuthorization(auth, tokenData.refreshToken, tokenData.accessToken) 
                    
                    // Update the user session
                    if (res) await updateTokenSession(res, auth, domain)
                    
                    // Update the access token
                    console.log(id, `The token ${dt(accessToken)} has been refreshed. New access token is ${dt(tokenData.accessToken)} and new refresh token is ${dt(tokenData.refreshToken)}`)
                    accessToken = tokenData.accessToken

                } catch (error) {

                    // If refresh token failed, check if a new token is set in database
                    // every 500 ms until timeout is reached
                    if (error instanceof RefreshTokenError) {

                        let tokenFromDB = auth.accessToken
                        const beginMs = (new Date()).getTime()
                        const timeoutMs = 4 * 1_000
                        const sleepMs = 500

                        console.log(id, `The token ${dt(accessToken)} could not be refreshed. Watching for a new token in database every ${sleepMs}ms for ${timeoutMs}ms...`)
                        
                        while (accessToken === tokenFromDB) {
                            
                            // Wait
                            await sleep(sleepMs)

                            const currentMs = (new Date()).getTime()
                            const elapsedMs = currentMs - beginMs
                            const remainingMs = timeoutMs - elapsedMs 
                            console.log(id, `Looking for a new token in database. Timeout in ${remainingMs}ms`)
                            
                            // Exit the loop if timeout has been reached
                            if (remainingMs <= 0) {
                                console.log(id, `Timeout reached when trying to refresh token ${dt(accessToken)}`)
                                throw new MobilizonRefreshTokenError(error.message)
                            }

                            // Update token value from DB
                            tokenFromDB = (await findAuthById(authId)).accessToken
                        }

                        console.log(id, `Token has finally been refreshed by another request. New access token is ${dt(tokenFromDB)}`)
                        accessToken = tokenFromDB

                    } else {

                        console.log(id, `Unknown error while trying to refresh the token ${dt(accessToken)}`)
                        throw error
                    }                    
                }
            }
            
            console.log(id, `Recursive call with token ${dt(accessToken)}`)
            return internalRefreshOnExpired(id, request, domain, accessToken, authId, res, ...args)

        // Ignore aborted request
        } else if (error.name && error.name === 'AbortError') {       
            console.log(id, 'Aborting request')
            
        // Else it's an unknown error, pass to error handler
        } else {       
            console.log(id, 'Unknown error', error);
            throw error
        }
    } 
}

export const requestApi = async (request, userData, res, ...args) => {    
    return await refreshOnExpired(request, userData.mobilizonDomain, userData.mobilizonAccessToken, userData.authId, res, ...args)
}