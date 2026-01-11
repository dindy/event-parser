import { SignJWT } from 'jose'
import { ExpiredTokenError, RequestError, AuthError } from "../api/exceptions/index.js"
import { refreshToken } from "../api/mobilizon.js"
import { findById as findAuthById } from "../models/Authorization.js"
import { refresh as refreshAuthorization } from "../models/Authorization.js"
import MobilizonRefreshTokenError from "./exceptions/MobilizonRefreshTokenError.js"

export const updateTokenSession = async (res, auth, domain) => {

    // Set access token in cookie
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const token = await new SignJWT({
        authId: auth.id,
        mbzUserId: auth.mobilizonUserId,
        mobilizonAccessToken: auth.accessToken,
        mobilizonDomain: domain
    })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1 year')
    .sign(secret);

    res.cookie('access_token', token, {
        httpOnly: true,
        // secure: true, @TODO: Force secure on prod
        sameSite: 'strict',
        maxAge: auth.refreshTokenExpiresIn * 1000
    });

    console.log('New token in cookie');
    
}

const refreshAndUpdateAuthorization = async (domain, authId, res) => {

    try {
        const auth = await findAuthById(authId)   
        const tokenData = await refreshToken(domain, auth.refreshToken).getData()
        await refreshAuthorization(auth, tokenData.refreshToken, tokenData.accessToken) 
        if (res) await updateTokenSession(res, auth, domain)
        return auth.accessToken
    } catch (error) {
        if (error instanceof RequestError) {
            throw new MobilizonRefreshTokenError(error.message)
        } else {
            throw error
        }
    }
}

export const refreshOnExpired = async (
    request,
    domain,
    accessToken,
    authId,
    res,
    ...args
) => {

    // Try to make the request with the access token from cookie
    try {
        const manager = request(domain, accessToken, ...args)
        return await manager.getData()
    
    // Catch errors...
    } catch (error) {

        // If access token has expired get new access and refresh tokens from instance, 
        // update DB and cookie then re-issue the request
        if (error instanceof ExpiredTokenError) {
            
            console.log('Refresh token')
            accessToken = await refreshAndUpdateAuthorization(domain, authId, res)
            const manager = request(domain, accessToken, ...args)
            return await manager.getData()

        // If 401 error check the access token from cookie is the cookie in DB
        // because maybe the token has changed
        } else if (error instanceof AuthError) {
            
            const auth = await findAuthById(authId)

            // If token has changed update cookie and re-issue the request with token from DB
            if (accessToken !== auth.accessToken) {
                console.log('Token has been refreshed')
                updateTokenSession(res, auth, domain)
                refreshOnExpired(request, domain, auth.accessToken, authId, ...args)
            
            // Else this is an unknown problem
            } else {
                throw error
            }
        
        // Ignore aborted request
        } else if (error.name && error.name === 'AbortError') {       
            console.log('Aborting request');
        
        // Else it's an unknown error, pass to error handler
        } else {       
            throw error
        }
    } 
}

export const requestApi = async (request, userData, res, ...args) => {    
    return await refreshOnExpired(request, userData.mobilizonDomain, userData.mobilizonAccessToken, userData.authId, res, ...args)
}