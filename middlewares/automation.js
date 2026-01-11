import ical from 'node-ical'
import { createHash } from 'node:crypto'
import mimes from 'mime-db'
import InvalidJsonBody from './exceptions/InvalidJsonBody.js'
import InvalidJsonProperty from './exceptions/InvalidJsonProperty.js'
import UnknownAutomation from './exceptions/UnknownAutomation.js'
import InvalidRequest from './exceptions/InvalidRequest.js'
import MissingJsonProperty from './exceptions/MissingJsonProperty.js'
import {
    exists as automationExists,
    save as saveAutomation,
    listActive as listActiveAutomations,
    findAuthorized as findAuthorizedAutomations,
    findById as findAutomationById,
    destroy as destroyAutomation
} from '../models/Automation.js'
import AutomationAlreadyExists from './exceptions/AutomationAlreadyExists.js'
import { refreshOnExpired, requestApi } from './utils.js'
import { saveEvent, getIdentitiesAndGroups } from '../api/mobilizon.js'
import { convertUrlToBase64 } from '../libs/parsers/utils/utils.js'
import {
    alreadyExists as importedEventAlreadyExists,
    create as createImportedEvent,
    update as updateImportedEvent
} from '../models/ImportedEvent.js'
import AutomationLogger from '../libs/AutomationLogger.js'
import MissingParameter from './exceptions/MissingParameter.js'
import { findById as findAuthorizationById } from '../models/Authorization.js'
import InvalidParameter from './exceptions/InvalidParameter.js'

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

const parseIcsEvent = async icsEvent => {
    
    if (icsEvent.type !== 'VEVENT') return null
    if (!icsEvent.summary || icsEvent.summary === "") return null
    
    await logger.info(`Found event ${icsEvent.uid}.`)

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
            geom: icsEvent.geo ? `${icsEvent.geo.lon};${icsEvent.geo.lat}` : null,
        },
        metadata: [],
        draft: false,
        options: {
            showStartTime: icsEvent.datetype == 'date-time',
            showEndTime: icsEvent.datetype == 'date-time',
        },
        uid: icsEvent.uid
    }
    mbzEvent.picture = null
    // @TODO : Handle binary data images 
    if (
        icsEvent.attach?.params?.FMTTYPE
        && icsEvent.attach.params.FMTTYPE.startsWith('image')
        && icsEvent.attach.val
    ) {
        try {
            const parsedImage = await convertUrlToBase64(icsEvent.attach.val)
            mbzEvent.picture = {
                media: {
                    name: 'event_banner' + '.' + mimes[parsedImage.type],
                    alt: 'Event banner',
                    file: parsedImage.base64
                }
            }
        } catch(error) {
            await logger.warning(`Could not fetch image ${icsEvent.attach.val} : ${error.name} : ${error.message}.`)
        }
    }

    return mbzEvent
}

const getIcsEvents = async url => {
    
    let mbzEvents = []

    try {
        await logger.info(`Fetching ICS feed from ${url}.`)
        const abortCtrl = new AbortController();
        setTimeout(() => abortCtrl.abort(), 5_000);
        const events = await ical.async.fromURL(url, { signal: abortCtrl.signal })
        
        for (const [_, event] of Object.entries(events)) {
            try {
                mbzEvents = [...mbzEvents, await parseIcsEvent(event)]
            } catch (error) {
                await logger.error(`Unable to import ICS event ${event.uid} : ${error.name} : ${error.message}.`)
                continue
            }            
        }

        return mbzEvents.filter(event => event !== null)

    } catch (error) {
        await logger.error(`Error fetching or parsing data : ${error.name} : ${error.message}.`)
        return []
    }
} 

const saveNewOrModifiedEvent = async (event, automation) => {
    
    // @TODO: refresh token here to avoid refresh on each request
    const authorization = await automation.getAuthorization()
    const application = await authorization.getApplication()
    const eventStr = JSON.stringify(event)
    const hash = createHash('sha256').update(eventStr).digest('hex')
    const alreadyExistingEvent = await importedEventAlreadyExists(automation.id, event.uid)
    
    if (alreadyExistingEvent) {        
        
        if (alreadyExistingEvent.hash === hash) {
            await logger.info(`Event ${event.uid} has not been modified.`);
            return
        }
        
        await logger.info(`Event ${event.uid} has been modified.`);
        event.id = alreadyExistingEvent.mbzId
        
    } else {
        await logger.info(`Event ${event.uid} is new.`);
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
    await logger.success(`Event ${event.uid} has been saved with UUID ${savedMbzEvent.uuid}.`);
}

const executeAutomation = async automation => {
        
    let events = []
    
    logger.setAutomationId(automation.id)
    await logger.info('Launching automation.')
    
    if (automation.type == 'ics') {
        events = [ ...events, ...await getIcsEvents(automation.url)]
    }

    if (events.length === 0) await logger.info(`No event found.`)

    for (const event of events)
    {
        try {
            await saveNewOrModifiedEvent(event, automation)
        } catch (error) {
            await logger.error(`Could not save event ${event.uid} : ${error.name} : ${error.message}.`)
            continue
        }
    }
} 

export const executeAutomations = async (req, res, next) => {

    const automations = await listActiveAutomations()

    for (const automation of automations)
    {
        try {
            await executeAutomation(automation)    
        } catch (error) {
            console.log(error)
            continue
        }
    }

    res.end('Done !')
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
    const personId = req.query.personId || null        
    const groupId = req.query.groupId || null
    if (!personId && !groupId) throw new InvalidRequest(`No personId or groupId found.`)
    
    await checkUserIsAuthorizedToPublishWith(req.user, res, personId, groupId)

    const actorCriteria = {
        [groupId ? 'attributedToId' : 'organizerActorId']: groupId || personId
    }
    const automations = await findAuthorizedAutomations(req.user.authId, actorCriteria)

    res.json(automations.map(automation => ({
        id: automation.id,
        attributedToId: automation.attributedToId, 
        organizerActorId: automation.organizerActorId, 
        url: automation.url, 
        type: automation.type, 
        active: automation.active, 
        createdAt: automation.createdAt, 
        updatedAt: automation.updatedAt, 
    })))
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

export const getAutomationImportedEvents = async (req, res, next) => 
{
    const automation = await getAutomationIfAuthorized(req.user, res, req.params.id)
    const importedEvents = await automation.getImportedEvents()
    res.json(importedEvents)
}

export const getAutomationLogs = async (req, res, next) => 
{
    const automation = await getAutomationIfAuthorized(req.user, res, req.params.id)
    const logs = await automation.getAutomationLogs()
    res.json(logs)
}

export const forceAutomation = async (req, res, next) => 
{
    const automation = await getAutomationIfAuthorized(req.user, res, req.params.id)
    await executeAutomation(automation)
    const logs = await automation.getAutomationLogs()
    res.json(logs)
}

export const deleteAutomation = async (req, res, next) => { 
    const automation = await getAutomationIfAuthorized(req.user, res, req.params.id)
    await destroyAutomation(automation.id)
    res.json({})
}