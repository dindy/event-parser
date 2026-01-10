import ical from 'node-ical'
import { createHash } from 'node:crypto'
import mimes from 'mime-db'
import InvalidJsonBody from './exceptions/InvalidJsonBody.js'
import InvalidJsonProperty from './exceptions/InvalidJsonProperty.js'
import UnknownAutomation from './exceptions/UnknownAutomation.js'
import {
    exists as automationExists,
    save as saveAutomation,
    listActive as listActiveAutomations,
    findByAuthId as findAutomationsByAuthId,
    findById as findAutomationById
} from '../models/Automation.js'
import AutomationAlreadyExists from './exceptions/AutomationAlreadyExists.js'
import { refreshOnExpired } from './utils.js'
import { saveEvent } from '../api/mobilizon.js'
import { convertUrlToBase64 } from '../libs/parsers/utils/utils.js'
import {
    alreadyExists as importedEventAlreadyExists,
    create as createImportedEvent,
    update as updateImportedEvent
} from '../models/ImportedEvent.js'
import AutomationLogger from '../libs/AutomationLogger.js'

const logger = new AutomationLogger

export const createAutomation = async (req, res, next) => {

    if (!req.body) throw new InvalidJsonBody

    const url = req.body.url
    if (!url) throw new InvalidJsonProperty('url', url)    

    const type = req.body.type
    if (!type) throw new InvalidJsonProperty('type', type)    

    const attributedToId = req.body.attributedToId
    if (!attributedToId) throw new InvalidJsonProperty('attributedToId', attributedToId)    
    
    const organizerActorId = req.body.organizerActorId
    if (!organizerActorId) throw new InvalidJsonProperty('organizerActorId', organizerActorId)    
    
    const automationToCreate = {
        authorizationId: req.user.authId,
        url,
        type,
        attributedToId,
        organizerActorId
    }
    
    if (await automationExists(automationToCreate)) {
        throw new AutomationAlreadyExists
    }
    
    const automation = await saveAutomation(automationToCreate)

    res.json(automation)
}

const parseIcsEvent = async icsEvent => {
    
    if (icsEvent.type !== 'VEVENT') return null
    if (!icsEvent.summary || icsEvent.summary === "") return null
    
    await logger.info(`Found event ${icsEvent.uid}`)

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
            await logger.warning(`Could not fetch image ${icsEvent.attach.val} : ${error.name} : ${error.message}`)
        }
    }

    return mbzEvent
}

const getIcsEvents = async url => {
    
    let mbzEvents = []

    try {
        await logger.info(`Fetching ICS feed from ${url}`)
        const abortCtrl = new AbortController();
        setTimeout(() => abortCtrl.abort(), 5_000);
        const events = await ical.async.fromURL(url, { signal: abortCtrl.signal })
        
        for (const [_, event] of Object.entries(events)) {
            try {
                mbzEvents = [...mbzEvents, await parseIcsEvent(event)]
            } catch (error) {
                await logger.error(`Unable to import ICS event ${event.uid} : ${error.name} : ${error.message}`)
                continue
            }            
        }

        return mbzEvents.filter(event => event !== null)

    } catch (error) {
        await logger.error(`Error fetching or parsing data : ${error.name} : ${error.message}`)
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
        await logger.info(`Event ${event.uid} has never been saved.`);
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
    await logger.info('Launching automation')
    
    if (automation.type == 'ics') {
        events = [ ...events, ...await getIcsEvents(automation.url)]
    }
    
    for (const event of events)
    {
        try {
            await saveNewOrModifiedEvent(event, automation)
        } catch (error) {
            await logger.error(`Could not save event ${event.uid} : ${error.name} : ${error.message}`)
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

export const getAutomations = async (req, res, next) => 
{
    const authId = req.user.authId
    const automations = await findAutomationsByAuthId(authId)
    res.json(automations)
}

export const getAutomationImportedEvents = async (req, res, next) => 
{
    const automation = await findAutomationById(req.params.id)
    if (!automation || automation.authorizationId !== req.user.authId) throw new UnknownAutomation
    const importedEvents = await automation.getImportedEvents()
    res.json(importedEvents)
}

export const getAutomationLogs = async (req, res, next) => 
{
    const automation = await findAutomationById(req.params.id)
    if (!automation || automation.authorizationId !== req.user.authId) throw new UnknownAutomation
    const logs = await automation.getAutomationLogs()
    res.json(logs)
}

export const forceAutomation = async (req, res, next) => 
{
    const automation = await findAutomationById(req.params.id)
    if (!automation || automation.authorizationId !== req.user.authId) throw new UnknownAutomation
    await executeAutomation(automation)
    const logs = await automation.getAutomationLogs()
    res.json(logs)
}