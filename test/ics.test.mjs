import ical from 'node-ical'
import path from 'path'
import * as td from 'testdouble'
import * as chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import chaiDatetime from 'chai-datetime'
import * as utils from '../libs/parsers/web-parsers/utils/utils.mjs'
chai.use(chaiAsPromised)
chai.use(chaiDatetime)

describe("Test event ics parser", async function () { 

    let logger, convertUrlToBase64, completeIcsEventFromWeb, scrap
    
    beforeEach(async function () {
        logger = {
            info: td.function('logger.info'),
            error: td.function('logger.error'),
            warning: td.function('logger.warning'),
            success: td.function('logger.success')
        }
        convertUrlToBase64 = td.function('convertUrlToBase64')
        completeIcsEventFromWeb = td.function('completeIcsEventFromWeb')
        scrap = td.function('scrap')

        // Patch automation.js dependencies
        await td.replaceEsm('../libs/parsers/web-parsers/utils/utils.mjs', {
            ...utils,
            convertUrlToBase64
        }) 
        await td.replaceEsm('../libs/AutomationLogger.mjs', {
            default: logger,
        })        
        await td.replaceEsm('../libs/scrappers/page-scrapper/scrapper.mjs', {
            scrap,
        })
    })

    afterEach(function () {
        td.reset()
    })

    it('should parse and convert ics events to Mobilizon events', async function () {
        
        const events = await ical.async.parseFile(path.resolve('./test/ics/feed-1.ics'))
        const automation = { id: 'test-automation' }
        const eventList = Object.values(events).filter(e => e.type === 'VEVENT')
        
        const { parseIcsEvent } = await import('../middlewares/automation.mjs')

        // Setup return values for mocks
        const media = { base64: 'mockbase64', extension: 'jpg', type: 'image/jpg' }
        td.when(convertUrlToBase64(td.matchers.anything())).thenResolve(media)
        
        let mbzEvents = []
        for (const icsEvent of eventList) {
            mbzEvents.push(await parseIcsEvent(icsEvent, automation))
        }
        
        chai.expect(mbzEvents[0].picture.media.file).to.be.eq(media.base64)
        chai.expect(new Date(mbzEvents[0].beginsOn)).to.equalDate(new Date('2026-02-26T14:00:00.000Z'))
        chai.expect(new Date(mbzEvents[0].endsOn)).to.equalDate(new Date('2026-02-26T15:00:00.000Z'))
        chai.expect(mbzEvents[0]).to.be.deep.contains({
            title: 'Permanence du CRAS Mardi et Jeudi',
            description: "plus d'infos sur : https://toulouse.demosphere.net/rv/34469",
            onlineAddress: 'data:ics:uid:https://toulouse.demosphere.net/rv/34469',
            status: 'CONFIRMED',
            tags: [],
            visibility: 'UNLISTED',
            physicalAddress: {
                description: 'Toulouse  31100, \n' +
                    'CRAS \n' +
                    '39, rue Gamelin 31100 TOULOUSE \n' +
                    'Métro Fontaine Lestang',
                street: null,
                locality: null,
                postalCode: null,
                country: null,
                geom: null
            },
            metadata: [],
            draft: false,
            options: {
                showStartTime: true,
                showEndTime: true,
                hideNumberOfParticipants: true,
                showRemainingAttendeeCapacity: false,                
            },
            uid: 'https://toulouse.demosphere.net/rv/34469',
        })

        chai.expect(mbzEvents[1].picture.media.file).to.be.eq(media.base64)
        chai.expect(new Date(mbzEvents[1].beginsOn)).to.equalDate(new Date('2026-02-26T15:00:00.000Z'))
        chai.expect(new Date(mbzEvents[1].endsOn)).to.equalDate(new Date('2026-02-26T16:00:00.000Z'))
        chai.expect(mbzEvents[1]).to.be.deep.contains({
            title: 'Le placard brûle : permanence de la bibliothèque',
            description: "plus d'infos sur : https://toulouse.demosphere.net/rv/34171",
            onlineAddress: 'data:ics:uid:https://toulouse.demosphere.net/rv/34171',
            status: 'CONFIRMED',
            tags: [],
            physicalAddress: {
                description: "Toulouse 31000, \nL'Impasse \n1 impasse Lapujade",
                street: null,
                locality: null,
                postalCode: null,
                country: null,
                geom: '-122.082932;37.386013'
            },
            metadata: [],
            draft: false,
            options: {
                showStartTime: true,
                showEndTime: true,
                hideNumberOfParticipants: true,
                showRemainingAttendeeCapacity: false,
            },
            uid: 'https://toulouse.demosphere.net/rv/34171',
        })

        eventList.forEach(e =>
        {
            // Verify logger.info called for each event
            td.verify(logger.info(td.matchers.contains(e.uid), automation.id))

            // Verify completeIcsEventFromWeb called for events with valid URL
            if (e.url) {
                td.verify(scrap(e.url, td.matchers.anything(), td.matchers.anything()))
            }
        })

    })
})