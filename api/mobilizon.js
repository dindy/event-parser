import FormData from 'form-data'
import { RequestError, BadRequestError, ExpiredTokenError, NetworkError, AuthError } from "./exceptions/index.js"
import fs from 'fs/promises'

const clientName = 'import-mobilizon-events'
const websiteUrl = 'https://website.mobilizon.webworkers.agency'
const scope = 'read write'
const state = 'import-mobilizon-state'
const getApiUrl = domain => `https://${domain}/api`

export const getRedirectUri = origin => `https://${origin}/mobilizon/callback`

export const handleResponse = async (response) => {
    
    const body = await response.json()
    // console.log(body);
    
    if (response.status === 200) {
        
        if (body.errors) {
            throw new BadRequestError(response, body)
        }

        return body

    } else if (response.status === 401 ) {

        if (body.message === 'invalid_token' && body.details === ':token_expired') {
            throw new ExpiredTokenError(response, body)
        } else {
            throw new AuthError(response, body)
        }

    } else if (response.status.toString().startsWith('4')) {
        
        throw new RequestError(null, response, body)    

    } else {
        
        throw new RequestError(null, response, body)

    }
}

const request = (url, options = {}, callback = data => data) => {
    
    console.log('request ' + url);
    // console.log(options);
    
    const abortCtrl = new AbortController()

    options.signal = abortCtrl.signal

    let request = null

    try {
        request = fetch(url, options)
    } catch (error) {
        throw new NetworkError(url, error)
    }

    return {
        abort: () => abortCtrl.abort(),
        getData: async () => {
            const req = await request
            const res = await handleResponse(req)
            return callback(res)
        }
    }
}

export const registerApplication = async (instanceDomain, redirectUrl) => await request(
    `https://${instanceDomain}/apps`,
    {
        method: 'POST',
        body: new URLSearchParams({
            'name': clientName,
            'redirect_uri': redirectUrl,
            'website': websiteUrl,
            'scope': scope
        })            
    }
).getData()

export const exchangeCodeForToken = async (
    code, 
    domain, 
    clientId, 
    clientSecret, 
    redirectUri, 
    scope
) => await request(`https://${domain}/oauth/token?` + new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri,
        scope: scope,
    }), {
        method: 'POST',
}
).getData()

export const getApplicationAuthorizationUrl = (
    domain,
    clientId,
    redirectUri,
    scope,
    id
) => `https://${domain}/oauth/authorize?` + new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: scope,
    state: id
})

const graphql = (
    domain,
    accessToken,
    callback,
    body,
    extraHeaders
) => { 

    let headers = {}
    if (accessToken) headers = { 'Authorization' : `Bearer ${accessToken}` }
    if (extraHeaders) headers = { ...headers, ...extraHeaders }

    return request(
        getApiUrl(domain),
        {
            method: 'POST',
            headers,
            body
        },
        callback
    )    
}

const graphqlJson = (
    domain,
    accessToken,
    callback,
    query,
    variables = {}
) => graphql(
    domain,
    accessToken,
    callback,
    JSON.stringify({
        query,
        variables
    }),
    { 'Content-Type': "application/json" }
)

export const refreshToken = (
    domain,
    refreshToken
) => {

    const query = `mutation RefreshToken($refreshToken: String!) {  
        refreshToken(refreshToken: $refreshToken) {    
            accessToken
            refreshToken
        }
    }`
    const variables = { refreshToken }

    return graphqlJson(
        domain,
        null,
        data => data.data.refreshToken,
        query,
        variables
    )
}

export const getIdentitiesAndGroups = (domain, accessToken) => { 

    const query = `query ($page: Int, $limit: Int) {
        loggedUser {
            id
            memberships(page: $page, limit: $limit) {
                total
                elements {
                    role
                    actor {
                        id
                    }
                    parent {
                        ...ActorFragment
                        ...GroupFragment
                    }
                }
            }
            actors {      
                ...ActorFragment      
            }                        
        }
    }

    fragment GroupFragment on Group {
        id
        physicalAddress {
            ...AdressFragment 
        }
    }

    fragment AdressFragment on Address {
        id
        description
        geom
        street
        locality
        postalCode
        region
        country
        type
        url
        originId
        timezone
        pictureInfo {
            url
            author {
                name
                url
            }
            source {
                name
                url
            }
        }
    }

    fragment ActorFragment on Actor {
        id
        type
        preferredUsername
        name
        avatar {
            url
        }
    }`        
    
    return graphqlJson(
        domain,
        accessToken,
        data => data.data.loggedUser,
        query,
        { page: 1, limit: 999 }
    )        
}

export const getConfiguration = (domain, accessToken) => { 

    const query = `query {
        config {
            name
            description
            slogan
            version
            registrationsOpen
            registrationsAllowlist
            demoMode
            longEvents
            durationOfLongEvent
            countryCode
            languages
            primaryColor
            secondaryColor
            instanceLogo {
                url
            }
            defaultPicture {
                url
                name
                metadata {
                    width
                    height
                    blurhash
                }
            }
            eventCategories {
                id
                label
            }
            anonymous {
                participation {
                    allowed
                    validation {
                        email {
                            enabled
                            confirmationRequired
                        }
                        captcha {
                            enabled
                        }
                    }
                }
                eventCreation {
                    allowed
                    validation {
                        email {
                            enabled
                            confirmationRequired
                        }
                        captcha {
                            enabled
                        }
                    }
                }
                reports {
                    allowed
                }
                actorId
            }
            location {
                latitude
                longitude
            }
            maps {
                tiles {
                    endpoint
                    attribution
                }
                routing {
                    type
                }
            }
            geocoding {
                provider
                autocomplete
            }
            resourceProviders {
                type
                endpoint
                software
            }
            features {
                groups
                eventCreation
                eventExternal
                antispam
            }
            restrictions {
                onlyAdminCanCreateGroups
                onlyGroupsCanCreateEvents
            }
            auth {
                ldap
                databaseLogin
                oauthProviders {
                    id
                    label
                }
            }
            uploadLimits {
                default
                avatar
                banner
            }
            instanceFeeds {
                enabled
            }
            webPush {
                enabled
                publicKey
            }
            analytics {
                id
                enabled
                configuration {
                    key
                    value
                    type
                }
            }
            search {
                global {
                    isEnabled
                    isDefault
                }
            }
            exportFormats {
                eventParticipants
            }
        }    
    }`

    return graphqlJson(
        domain,
        accessToken,
        data.data.config,
        query
    )    
}

export const getUserId = (domain, accessToken) => {
    
    const query = `query Identities {  
        loggedUser {    
            id 
        }
    }`

    const callback = (data) => data.data.loggedUser.id

    return graphqlJson(
        domain,
        accessToken,
        callback,
        query,
    )

}

export const saveEvent = (domain, accessToken, event) => {
    
    const bannerFormInputName = "p...i...c...t...u...r...e...m.e.d.i.a.file"
    const formData = new FormData()
    const updateLine1 = !event.id ? `` : `$id: ID!,
    `
    const updateLine2 = !event.id ? `` : `eventId: $id,
    `
    const operationName = !event.id ? 'createEvent' : 'updateEvent'

    formData.append("query", `mutation ${operationName}(
        ${updateLine1}$attributedToId: ID,
        $organizerActorId: ID!,
        $title: String!,
        $description: String!,
        $beginsOn: DateTime!,
        $endsOn: DateTime,
        $onlineAddress: String,
        $status: EventStatus,
        $picture: MediaInput,
        $tags: [String],
        $physicalAddress: AddressInput,
        $options: EventOptionsInput,
        $metadata: [EventMetadataInput],
        $draft: Boolean
    ) {
        ${operationName}(
            ${updateLine2}attributedToId: $attributedToId,
            organizerActorId: $organizerActorId,
            title: $title,
            description: $description,
            beginsOn: $beginsOn,
            endsOn: $endsOn,
            onlineAddress: $onlineAddress,
            status: $status,
            picture: $picture,
            tags: $tags,
            physicalAddress: $physicalAddress,
            options: $options,
            metadata: $metadata,
            draft: $draft
        ) {
            id
            uuid
        }
    }`)    

    // Set picture
    if (event.picture) {
        const buffer = Buffer.from(event.picture.media.file, 'base64');
        formData.append(bannerFormInputName, buffer, event.picture.media.name)        
        event.picture.media.file = bannerFormInputName        
    }

    formData.append('variables', JSON.stringify(event))
    
    return graphql(
        domain,
        accessToken,
        (data) => data.data[operationName],
        formData.getBuffer(),
        formData.getHeaders()
    )    
}

export const pass = (domain, accessToken, contentType, body) => {
    
    return request(
        getApiUrl(domain),
        {
            headers: {
                'Content-Type': contentType,
                'Authorization': `Bearer ${accessToken}`,
            },
            method: 'POST',
            body
        },
        data => data
    ) 
}