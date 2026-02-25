import { createHash } from 'node:crypto'
import InvalidJsonBody from './exceptions/InvalidJsonBody.mjs'
import InvalidJsonProperty from './exceptions/InvalidJsonProperty.mjs'
import UnknownAutomation from './exceptions/UnknownAutomation.mjs'
import InvalidRequest from './exceptions/InvalidRequest.mjs'
import MissingJsonProperty from './exceptions/MissingJsonProperty.mjs'
import {
    exists as automationExists,
    save as saveAutomation,
    listActive as listActiveAutomations,
    findAuthorized as findAuthorizedAutomations,
    findById as findAutomationById,
    destroy as destroyAutomation
} from '../models/Automation.mjs'
import AutomationAlreadyExists from './exceptions/AutomationAlreadyExists.mjs'
import { refreshOnExpired, requestApi } from './utils.mjs'
import { saveEvent, getIdentitiesAndGroups } from '../api/mobilizon.mjs'
import { convertUrlToBase64, convertBase64DataUrlToBase64, isValidUrl } from '../libs/parsers/web-parsers/utils/utils.mjs'
import {
    alreadyExists as importedEventAlreadyExists,
    create as createImportedEvent,
    update as updateImportedEvent
} from '../models/ImportedEvent.mjs'
import AutomationLogger from '../libs/AutomationLogger.mjs'
import { BadRequestError } from '../api/exceptions/BadRequestError.mjs'
import { scrap as scrapPage } from '../libs/scrappers/page-scrapper/scrapper.mjs';
import { scrap as scrapICS } from '../libs/scrappers/ics-scrapper/scrapper.mjs';
import fbGroupEventsParser from '../libs/parsers/web-parsers/group-events/facebook-group-events-parser.mjs'
import fbEventParser from '../libs/parsers/web-parsers/event/facebook-event-parser.mjs'
import defaultEventParser from '../libs/parsers/web-parsers/event/default-event-parser.mjs'
import { getEventModel } from '../libs/parsers/web-parsers/models.mjs'

const logger = new AutomationLogger

export const createAutomation = async (req, res, next) => {

    if (!req.body) throw new InvalidJsonBody

    const url = req.body.url
    if (!url) throw new InvalidJsonProperty('url', url)    

    const type = req.body.type
    if (!type) throw new InvalidJsonProperty('type', type)    

    if (!req.body.hasOwnProperty('personId')) throw new MissingJsonProperty('personId')
    if (!req.body.personId) throw new InvalidJsonProperty('personId', req.body.personId)   
    const personId = req.body.personId
        
    if (!req.body.hasOwnProperty('groupId')) throw new MissingJsonProperty('groupId')
    const groupId = req.body.groupId
    
    // Check if the user has the authorization to publish
    await checkUserIsAuthorizedToPublishWith(req.user, res, personId, groupId)
    
    // To avoid duplicate automation : Find any automation with same attributedToId 
    // (user or group), url, type and within the same domain (application of the
    // current user's authorization)
    const actorCriteria = {
        [groupId ? 'attributedToId' : 'organizerActorId']: groupId || personId
    }
    if (await automationExists(req.user.authId, {    
        url,
        type,
        ...actorCriteria        
    })) {
        throw new AutomationAlreadyExists
    }
    
    // If no result we can safely create the automation
    const automation = await saveAutomation({
        authorizationId: req.user.authId,
        url,
        type,
        attributedToId: groupId,
        organizerActorId: personId
    })

    res.json(automation)
}

const convertEventModelToMbzEvent = async (fbEvent, automation) =>
{   
    try {

        // Update some events properties to match the mobilizon API
        const mbzEvent = {
            title: fbEvent.metas.title,
            description: fbEvent.metas.description ?
                fbEvent.metas.description.replaceAll('\n', '</br>') :
                "",
            beginsOn: (new Date(fbEvent.metas.startTimestamp * 1000)).toJSON(),
            endsOn: fbEvent.metas.endTimestamp ?
                (new Date(fbEvent.metas.startTimestamp * 1000)).toJSON() :
                null,
            onlineAddress: fbEvent.metas.url,
            /** @TODO : Implement status */
            // status: icsEvent.status || 'CONFIRMED',
            // organizer: icsEvent.organizer || null,
            // tags: icsEvent.categories || [],
            physicalAddress: fbEvent.metas.physicalAddress,
            metadata: [],
            draft: false,
            uid: fbEvent.metas.url
        }            
        
        if (mbzEvent.endsOn && mbzEvent.endsOn <= mbzEvent.beginsOn) {
            mbzEvent.endsOn = null
        }

        if (fbEvent.metas.ticketsUrl) {
            mbzEvent.metadata = [{
                key: 'mz:ticket:external_url',
                type: 'STRING',
                value: fbEvent.metas.ticketsUrl
            }]
        }
    
        const hosts = fbEvent.metas.hosts
        const getLinkOrJustName = ({name, url}) => url ? `<a href="${url}">${name}</a>` : name
        if (hosts && hosts.length > 0) {
            if (hosts.length == 1) {
                mbzEvent.description += `<br><p>Organisé par ${getLinkOrJustName(hosts[0])}</p>`
            } else {
                mbzEvent.description += `<br><p>Organisé par : <ul>`
                hosts.forEach((host) => {
                    mbzEvent.description += `<li>${getLinkOrJustName(host)}</li>`
                })
                mbzEvent.description += `</ul></p>`
            }
        }    
    
        if (fbEvent.images && fbEvent.images.length > 0) {
            const pictureObject = convertBase64DataUrlToBase64(fbEvent.images[0])
            
            mbzEvent.picture = {
                media: {
                    name: 'event_banner' + '.' + pictureObject.extension,
                    alt: 'Event banner',
                    file: pictureObject.base64
                }
            }                
        }    
    
        return mbzEvent

    } catch (error) {
        await logger.error(`Error parsing event ${fbEvent.url}`, automation.id)
        console.log(error)
    }
}

const executeFacebookAutomation = async automation =>
{
    let fbGroupEvents = []

    try {
        await logger.info(`Fetching facebook group events at ${automation.url}.`, automation.id)
        fbGroupEvents = await scrapPage(automation.url, fbGroupEventsParser, [])
        
        // Treat only future events
        fbGroupEvents = fbGroupEvents.filter(event => !event.isPast)        
        
        if (fbGroupEvents.length > 0) {
            fbGroupEvents.forEach(async event => await logger.info(`Facebook event found : ${event.url}.`, automation.id))
        } else {
            await logger.info(`No Facebook event found.`, automation.id)
        }
        
    } catch (error) {
        await logger.error(`Error fetching facebook group events : ${error.name} : ${error.message}.`, automation.id)
        throw error
    }

    const promises = fbGroupEvents.map(
        event => scrapPage(event.url, fbEventParser, getEventModel())
            .catch(async error => await logger.error(`Error fetching facebook event at ${event.url}: ${error.name} : ${error.message}.`, automation.id))
            .then(async event => saveNewOrModifiedEvent(
                await convertEventModelToMbzEvent(event, automation),
                automation)
            )
    )

    return Promise.allSettled(promises)
}

const saveNewOrModifiedEvent = async (event, automation) => {
    
    /** @TODO : refresh token here to avoid refresh on each request */
    const authorization = await automation.getAuthorization()
    const application = await authorization.getApplication()
    const eventStr = JSON.stringify(event)
    const hash = createHash('sha256').update(eventStr).digest('hex')
    const alreadyExistingEvent = await importedEventAlreadyExists(automation.id, event.uid)
    
    if (alreadyExistingEvent) {        
        
        if (alreadyExistingEvent.hash === hash) {
            await logger.info(`Event ${event.uid} has not been modified.`, automation.id);
            return
        }
        
        await logger.info(`Event ${event.uid} has been modified.`, automation.id);
        event.id = alreadyExistingEvent.mbzId
        
    } else {
        await logger.info(`Event ${event.uid} is new.`, automation.id);
    }
    
    const savedMbzEvent = await refreshOnExpired(
        saveEvent,
        application.domain,
        authorization.accessToken,
        authorization.id,
        null,
        {
            ...event, 
            attributedToId: automation.attributedToId,
            organizerActorId: automation.organizerActorId,            
        }
    ) 
    
    try {
        if (alreadyExistingEvent) {
            await updateImportedEvent(alreadyExistingEvent, { hash, title: event.title })
        } else {
            await createImportedEvent({
                automationId: automation.id,
                uid: event.uid,
                mbzUid: savedMbzEvent.uuid,
                mbzId: savedMbzEvent.id,
                hash,
                title: event.title
            })
        } 
    } catch (error) {
        if (error instanceof BadRequestError && error.body?.errors?.length > 0) {
            const bodyError = error.body.errors[0]
            await logger.error(`Could not create or update event ${event.uid} : ${bodyError.code} : ${bodyError.message}.`, automation.id)
        } else {
            await logger.error(`Could not create or update event ${event.uid} : ${error.name} : ${error.message}.`, automation.id)
        }        
    }

    await logger.success(`Event ${event.uid} has been saved with UUID ${savedMbzEvent.uuid}.`, automation.id);
}

const mergeIcsEventAndWebEvent = (icsEvent, webEvent) =>
{
    const mergedEvent = icsEvent

    // If beginsOn is set we are pretty sure we have parsed an event
    // and data are reliable
    if (webEvent.beginsOn)
    {
        // Keep web URL if defined
        if (webEvent.onlineAddress) {
            mergedEvent.onlineAddress = webEvent.onlineAddress
        }
        
        // Keep web name if defined
        if (webEvent.title) {
            mergedEvent.title = webEvent.title
        }
        // Keep longest description
        if (webEvent.description) {
            if (!mergedEvent.description || (webEvent.description.length > mergedEvent.description.length)) {
                mergedEvent.description = webEvent.description
            }
        }
        // Keep web picture if defined
        if (webEvent.picture) {
            mergedEvent.picture = webEvent.picture
        }
        // Keep physical address from web if defined
        if (webEvent.physicalAddress.description) {
            mergedEvent.physicalAddress.description = webEvent.physicalAddress.description
        }
        if (webEvent.physicalAddress.geom) {
            mergedEvent.physicalAddress.geom = webEvent.physicalAddress.geom
        }
        if (webEvent.physicalAddress.locality) {
            mergedEvent.physicalAddress.locality = webEvent.physicalAddress.locality
        }
        if (webEvent.physicalAddress.postalCode) {
            mergedEvent.physicalAddress.postalCode = webEvent.physicalAddress.postalCode
        }
        if (webEvent.physicalAddress.street) {
            mergedEvent.physicalAddress.street = webEvent.physicalAddress.street
        }
        if (webEvent.physicalAddress.country) {
            mergedEvent.physicalAddress.country = webEvent.physicalAddress.country
        }
        
        mergedEvent.ticketsUrl = webEvent.ticketsUrl
    }

    return mergedEvent
}

const completeIcsEventFromWeb = async (eventUrl, mbzEventFromIcs, automation) => {

    await logger.info(`Fetch more data about ics event ${mbzEventFromIcs.uid} from ${eventUrl}`, automation.id)

    try {
        const eventModelFromWeb = await scrapPage(eventUrl, defaultEventParser, getEventModel())
        const mbzEventFromWeb = await convertEventModelToMbzEvent(eventModelFromWeb, automation)
        if (mbzEventFromWeb) {
            mbzEventFromIcs = mergeIcsEventAndWebEvent(mbzEventFromIcs, mbzEventFromWeb)
        }
        return mbzEventFromIcs
    } catch (error) {
        await logger.warning(`Could not retrieve more data about ics event ${mbzEventFromIcs.uid} from ${eventUrl} : ${error.name} : ${error.message}`, automation.id)
        return mbzEvent
    }
}

const parseIcsEvent = async (icsEvent, automation) => {
    
    try {
        if (icsEvent.type !== 'VEVENT') return null
        if (!icsEvent.summary || icsEvent.summary === "") return null
        
        await logger.info(`Found event ${icsEvent.uid}.`, automation.id)
    
        const mbzEvent = {
            title: icsEvent.summary,
            description: icsEvent.description || "",
            beginsOn: icsEvent.start,
            endsOn: icsEvent.end || null,
            onlineAddress: icsEvent.url || icsEvent.uid ? `data:ics:uid:${icsEvent.uid}` : null,
            status: icsEvent.status || 'CONFIRMED',
            // organizer: icsEvent.organizer || null,
            tags: icsEvent.categories || [],
            physicalAddress: {
                description: icsEvent.location || '',
                street: null,
                locality: null,
                postalCode: null,
                country: null,
                geom: icsEvent.geo && icsEvent.geo.lat != 0 && icsEvent.geo.lon != 0
                    ? `${icsEvent.geo.lon};${icsEvent.geo.lat}`
                    : null,
            },
            metadata: [],
            draft: false,
            options: {
                showStartTime: icsEvent.datetype == 'date-time',
                showEndTime: icsEvent.datetype == 'date-time',
            },
            uid: icsEvent.uid
        }

        if (mbzEvent.endsOn && mbzEvent.endsOn <= mbzEvent.beginsOn) {
            mbzEvent.endsOn = null
        }

        mbzEvent.picture = null
        /** @TODO : Handle binary data images */ 
        /** @TODO : Handle raw url */ 
        if (
            icsEvent.attach?.params?.FMTTYPE
            && icsEvent.attach.params.FMTTYPE.startsWith('image')
            && icsEvent.attach.val
        ) {
            try {
                const parsedImage = await convertUrlToBase64(icsEvent.attach.val)
                mbzEvent.picture = {
                    media: {
                        name: 'event_banner' + '.' + parsedImage.extension,
                        alt: 'Event banner',
                        file: parsedImage.base64
                    }
                }
            } catch(error) {
                await logger.warning(`Could not fetch image ${icsEvent.attach.val} : ${error.name} : ${error.message}.`, automation.id)
            }
        }
        
        if (icsEvent.url && isValidUrl(icsEvent.url)) {
            return await completeIcsEventFromWeb(icsEvent.url, mbzEvent, automation)
        }

        return mbzEvent

    } catch (error) {
        await logger.error(`Error parsing data : ${error.name} : ${error.message}.`, automation.id)
        return null
    }
}

const executeIcsAutomation = async automation =>
{
    let events = []
    
    await logger.info(`Fetching ICS feed.`, automation.id)
    
    try {
        events = await scrapICS(automation.url)        
    } catch (error) {
        await logger.error(`Error fetching or parsing data : ${error.name} : ${error.message}.`, automation.id)
        throw error
    }
    
    const promises = Object.entries(events).map(
        ([_, event]) => parseIcsEvent(event, automation)
            .then(event => event ? saveNewOrModifiedEvent(event, automation) : null)
    )
    
    return Promise.allSettled(promises)
}

const executeAutomation = async automation => {
    
    await logger.info('Launching automation.', automation.id)
    
    if (automation.type == 'ics') {
        return executeIcsAutomation(automation)
    } else if (automation.type == 'fb') { 
        return executeFacebookAutomation(automation)
    }
} 

export const executeAutomations = async (req, res, next) => {

    const automations = await listActiveAutomations()
    const promises = automations.map(automation => executeAutomation(automation))
    
    Promise.allSettled(promises)
        .then((r) => { console.log(r) })
        .catch(e => console.log(e))
        .finally(() => res.end('Done !'))
}

// Check that the current user's authorization can publish for attributedToId :
// Either the id is the mbz user id either the user is member of the group (admin or moderator)
const checkUserIsAuthorizedToPublishWith = async (user, res, personId, groupId = null) =>
{   
    let isAllowedPerson = false
    let isAllowedGroup = false
    
    const data = await requestApi(
        getIdentitiesAndGroups,
        user,
        res
    )

    if (personId) {
        isAllowedPerson = data
            .actors
            .filter(actor => actor.id == personId)
            .length > 0
        
        if (!isAllowedPerson) throw new InvalidRequest(`You are not allowed to publish with this person.`) 
    }
    
    if (groupId) {
        isAllowedGroup = data
            .memberships
            .elements
            .filter(membership => (membership.role === "ADMINISTRATOR" || membership.role === 'MODERATOR') && membership.parent.id == groupId)
            .length > 0
        
        if (!isAllowedGroup) throw new InvalidRequest(`You are not allowed to publish with this group.`)   
    }
    
    return true
}

export const getAutomations = async (req, res, next) => 
{   
    const personId = req.query.person_id || null        
    const groupId = req.query.group_id || null
    if (!personId && !groupId) throw new InvalidRequest(`No personId or groupId found.`)
    
    await checkUserIsAuthorizedToPublishWith(req.user, res, personId, groupId)

    const actorCriteria = {
        [groupId ? 'attributedToId' : 'organizerActorId']: groupId || personId
    }
    if (!groupId) actorCriteria.attributedToId = null
    const automations = await findAuthorizedAutomations(req.user.authId, actorCriteria)

    const r = automations.map(automation => ({
        id: automation.id,
        attributedToId: automation.attributedToId, 
        organizerActorId: automation.organizerActorId, 
        url: automation.url, 
        type: automation.type, 
        active: automation.active, 
        createdAt: automation.createdAt, 
        updatedAt: automation.updatedAt
    })) 
    
    res.json(r)
}

const getAutomationIfAuthorized = async (user, res, automationId) =>
{    
    const automation = await findAutomationById(automationId)
 
    if (!automation) throw new UnknownAutomation
 
    if (!automation.attributedToId) {
        await checkUserIsAuthorizedToPublishWith(user, res, automation.organizerActorId)
    } else {
        await checkUserIsAuthorizedToPublishWith(user, res, null, automation.attributedToId)
    }

    return automation
}

export const getAutomationHistory = async (req, res, next) => 
{
    const automation = await getAutomationIfAuthorized(req.user, res, req.params.id)
    const importedEvents = await automation.getImportedEvents()
    const logs = await automation.getAutomationLogs()
    res.json({events: importedEvents, logs})
}

export const forceAutomation = async (req, res, next) => 
{
    const automation = await getAutomationIfAuthorized(req.user, res, req.params.id)
    await executeAutomation(automation)
    const logs = await automation.getAutomationLogs()
    const importedEvents = await automation.getImportedEvents()
    res.json({events: importedEvents, logs})
}

export const deleteAutomation = async (req, res, next) => { 
    const automation = await getAutomationIfAuthorized(req.user, res, req.params.id)
    await destroyAutomation(automation.id)
    res.json({})
}