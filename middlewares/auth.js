import { refreshOnExpired, updateTokenSession } from './utils.js'

import {
    findById as findAppById,
    findByClientId as findAppByClientId,
    findByInstanceAndUri as findAppByInstanceAndUri,
    save as saveApp
} from '../models/Application.js' 

import {
    findById as findAuthById,
    findByUserId as findAuthByUserId,
    findByHash as findAuthByHash,
    createTemp as createTempAuth,
    refresh as refreshAuth,
    saveMobilizonUserId
} from '../models/Authorization.js' 

import {
    registerApplication,
    getApplicationAuthorizationUrl,
    exchangeCodeForToken,
    getUserId as getMobilizonUserId,
} from '../api/mobilizon.js'
import MissingParameter from './exceptions/MissingParameter.js'
import InvalidJsonBody from './exceptions/InvalidJsonBody.js'
import InvalidJsonProperty from './exceptions/InvalidJsonProperty.js'

export const register = async (req, res, next) => {
    
    const instanceDomain = req.query.instance
    if (!instanceDomain) throw new MissingParameter('instance')
    
    const redirectUri = req.query.redirect_uri
    if (!redirectUri) throw new MissingParameter('redirect_uri')  
    
    let app = await findAppByInstanceAndUri(instanceDomain, redirectUri)

    // If no app has already been registered for this mobilizon instance
    if (!app) {

        // Create an app on mobilizon server
        const appData = await registerApplication(instanceDomain, redirectUri)
        
        // Register app in database
        app = await saveApp({ domain: instanceDomain, ...appData })
    }

    // Return the mobilizon app authorization url to the client
    const appRegistrationUrl = getApplicationAuthorizationUrl(app.domain, app.clientId, app.redirectUri, app.scope, app.id)

    res.json({ url: appRegistrationUrl })   
}

export const authorize = async (req, res) => {

    console.log('Hit /auth/authorize')

    // Check query params
    if (!req.body) throw new InvalidJsonBody

    const code = req.body.code
    if (!code) throw new InvalidJsonProperty('code', code)
        
    const clientId = req.body.client_id
    if (!clientId) throw new InvalidJsonProperty('client_id', clientId)
    
    // Get the mobilizon app from the client id
    const app = await findAppByClientId(clientId)
    
    if (app) {

        // Exchange returned code for a mobilizon auth token
        const authData = await exchangeCodeForToken(code, app.domain, app.clientId, app.clientSecret, app.redirectUri, app.scope) 

        // Create authorization model instance
        let auth = await createTempAuth(app.id, authData)
        
        // Get the user id from the mobilizon instance
        const mobilizonIdentityId = await refreshOnExpired(getMobilizonUserId, app.domain, auth.accessToken, auth.id, res)

        // If we have already an authorization in database 
        // update the authorization else create
        const existingAuth = await findAuthByUserId(mobilizonIdentityId)
        if (existingAuth) {
            await refreshAuth(existingAuth, auth.refreshToken, auth.accessToken)
            auth = existingAuth
        } else {
            await saveMobilizonUserId(auth, mobilizonIdentityId)
        }
        
        await updateTokenSession(res, auth, app.domain)

        res.status(200).json({ message: 'Application authorized' })

    // Invalid client id
    } else {
        res.status(400).end({ message: 'No app found for the given client id' })
    }
}