import ical from 'node-ical';
import path from 'path';
import { test, mock, afterEach, it } from 'node:test'
import assert from 'assert'
import { BadRequestError } from '../api/exceptions/BadRequestError.mjs'
import { isValidUrl } from '../libs/parsers/web-parsers/utils/utils.mjs';

const mockLogger = {
    info: mock.fn(async () => {}),
    error: mock.fn(async () => {}),
    success: mock.fn(async () => {}),
    warning: mock.fn(async () => {}),
};
const mockConvertUrlToBase64 = mock.fn(async () => ({ base64: 'mockbase64', extension: 'jpg', type: 'image/jpg' }));
const mockScrap = mock.fn(async () => {});
const mockImportedEventAlreadyExists = mock.fn(async () => null)
const mockUpdateImportedEvent = mock.fn(async () => null)
const mockCreateImportedEvent = mock.fn(async () => null)
const mockCreateHash = () => ({
    update: () => ({
        digest: () => 'mocked_hash'
    })
});
const mockAutomation = {
    id: 1,
    getAuthorization: async () => ({
        getApplication: async () => ({})
    })
}
const mockRefreshOnExpired = mock.fn(async () => null)

mock.module('node:crypto', {
    namedExports: {
        createHash: mockCreateHash
    }
})
mock.module('../models/Automation.mjs', {
    namedExports: {
        exists: () => null,
        save: () => null,
        listActive: () => null,
        findAuthorized: () => null,
        findById: () => null,
        destroy: () => null,    
    }
})
mock.module('../middlewares/utils.mjs', {
    namedExports: {
        refreshOnExpired: mockRefreshOnExpired,
        requestApi: () => null
    }
})
mock.module('../libs/AutomationLogger.mjs', {
    defaultExport: mockLogger
})
mock.module('../api/mobilizon.mjs', {
    namedExports: {
        saveEvent: () => null,
        getIdentitiesAndGroups: () => null
    }
})
mock.module('../models/AutomationLog.mjs', {
    namedExports: {
        getLogsByAutomationId: () => null
    }
})
mock.module('../models/ImportedEvent.mjs', {
    namedExports: {
        alreadyExists: mockImportedEventAlreadyExists,
        create: mockCreateImportedEvent,
        update: mockUpdateImportedEvent
    }
})
mock.module('../libs/parsers/web-parsers/utils/utils.mjs', {
    namedExports: {
        convertUrlToBase64: mockConvertUrlToBase64,
        isStringUrl: () => null,
        isValidUrl,
        extractAddressParts: () => null,
        convertBase64DataUrlToBase64: () => null
    }
});
mock.module('../libs/scrappers/page-scrapper/scrapper.mjs', {
    namedExports: {
        scrap: mockScrap
    }
});
mock.module('../libs/parsers/web-parsers/event/default-event-parser.mjs', {
    defaultExport: () => null
})
mock.module('../libs/parsers/web-parsers/group-events/facebook-group-events-parser.mjs', {
    defaultExport: () => null
})
mock.module('../libs/parsers/web-parsers/event/facebook-event-parser.mjs', {
    defaultExport: () => null
})

const { parseIcsEvent, saveNewOrModifiedEvent } = await import('../middlewares/automation.mjs');

test('should parse and convert ics events to Mobilizon events', async () => {

    const automation = { id: 'test-automation' };
    const events = await ical.async.parseFile(path.resolve('./test/ics/feed-1.ics'));
    const eventList = Object.values(events).filter(e => e.type === 'VEVENT');

    let mbzEvents = [];
    for (const icsEvent of eventList) {
        mbzEvents.push(await parseIcsEvent(icsEvent, automation));
    }

    assert.strictEqual(mbzEvents[0].picture.media.file, 'mockbase64');
    assert.strictEqual(new Date(mbzEvents[0].beginsOn).toISOString(), '2026-02-26T14:00:00.000Z');
    assert.strictEqual(new Date(mbzEvents[0].endsOn).toISOString(), '2026-02-26T15:00:00.000Z');
    assert.deepStrictEqual(mbzEvents[0].title, 'Permanence du CRAS Mardi et Jeudi');
    assert.deepStrictEqual(mbzEvents[0].description, "plus d'infos sur : https://toulouse.demosphere.net/rv/34469");
    assert.deepStrictEqual(mbzEvents[0].onlineAddress, 'data:ics:uid:https://toulouse.demosphere.net/rv/34469');
    assert.deepStrictEqual(mbzEvents[0].status, 'CONFIRMED');
    assert.deepStrictEqual(mbzEvents[0].tags, []);
    assert.deepStrictEqual(mbzEvents[0].visibility, 'UNLISTED');
    assert.deepStrictEqual(mbzEvents[0].metadata, []);
    assert.deepStrictEqual(mbzEvents[0].draft, false);
    assert.deepStrictEqual(mbzEvents[0].uid, 'https://toulouse.demosphere.net/rv/34469');

    assert.strictEqual(mbzEvents[1].picture.media.file, 'mockbase64');
    assert.strictEqual(new Date(mbzEvents[1].beginsOn).toISOString(), '2026-02-26T15:00:00.000Z');
    assert.strictEqual(new Date(mbzEvents[1].endsOn).toISOString(), '2026-02-26T16:00:00.000Z');
    assert.deepStrictEqual(mbzEvents[1].title, 'Le placard brûle : permanence de la bibliothèque');
    assert.deepStrictEqual(mbzEvents[1].description, "plus d'infos sur : https://toulouse.demosphere.net/rv/34171");
    assert.deepStrictEqual(mbzEvents[1].onlineAddress, 'data:ics:uid:https://toulouse.demosphere.net/rv/34171');
    assert.deepStrictEqual(mbzEvents[1].status, 'CONFIRMED');
    assert.deepStrictEqual(mbzEvents[1].tags, []);
    assert.deepStrictEqual(mbzEvents[1].metadata, []);
    assert.deepStrictEqual(mbzEvents[1].draft, false);
    assert.deepStrictEqual(mbzEvents[1].uid, 'https://toulouse.demosphere.net/rv/34171');

    for (const e of eventList) {
        // Verify logger.info called for each event
        assert(mockLogger.info.mock.calls.some(call => call.arguments[0].includes(e.uid) && call.arguments[1] === automation.id));
        // Verify scrap called for events with valid URL
        if (e.url) {
            assert(mockScrap.mock.calls.some(call => call.arguments[0] === e.url));
        }
    }
});

test('saveNewOrModifiedEvent', async () => {
    
    afterEach(() => { 
        mockLogger.info.mock.resetCalls()
        mockLogger.error.mock.resetCalls()
        mockLogger.warning.mock.resetCalls()
        mockLogger.success.mock.resetCalls()
        mockRefreshOnExpired.mock.resetCalls()
        mockUpdateImportedEvent.mock.resetCalls()
    })

    it('handles when mobilizon cannot save the event', async () => {

        mockRefreshOnExpired.mock.mockImplementationOnce(async () => {
            throw new BadRequestError({}, {"data":{"updateEvent":null},"errors":[{"code":"validation","message":["devrait être au plus de 200 caractères"],"path":["updateEvent"],"field":"title","locations":[{"line":2,"column":3}],"status_code":422}]})
        })

        const event = { uid: 'event-uid', title: 'Test Event' };
        await saveNewOrModifiedEvent(event, mockAutomation);    
        
        assert.strictEqual(mockLogger.error.mock.calls.length, 1, 'Expected logger.error to be called once');
        assert.deepStrictEqual(
            mockLogger.error.mock.calls[0].arguments,
            [
                'Could not create event event-uid on Mobilizon server : BadRequestError : Bad request body : [{"code":"validation","message":["devrait être au plus de 200 caractères"],"path":["updateEvent"],"field":"title","locations":[{"line":2,"column":3}],"status_code":422}].',
                1
            ],
            'Expected logger.error to be called with correct arguments'
        );
    })

    it('handles created event', async () => {
        
        mockRefreshOnExpired.mock.mockImplementationOnce(async () => ({
            uuid: 'uuid',
            id: 42,
        }))

        const event = { uid: 'event-uid', title: 'Test Event' };
        await saveNewOrModifiedEvent(event, mockAutomation);

        assert.strictEqual(mockLogger.success.mock.calls.length, 1, 'Expected logger.success to be called once');
        assert.deepStrictEqual(
            mockLogger.success.mock.calls[0].arguments,
            [`Event event-uid has been saved with UUID uuid.`, 1],
            'Expected logger.success to be called with correct arguments'
        );            
        assert.strictEqual(mockLogger.info.mock.calls.length, 1, 'Expected logger.info to have been called once');
        assert.deepStrictEqual(
            mockLogger.info.mock.calls[0].arguments,
            [`Event event-uid is new.`, 1],
            'Expected logger.info to be called with correct arguments'
        );
        assert.strictEqual(mockRefreshOnExpired.mock.calls.length, 1, 'Expected refreshOnExpired to be called once');
        assert.strictEqual(mockCreateImportedEvent.mock.calls.length, 1, 'Expected create to be called once');
        assert.deepStrictEqual(
            mockCreateImportedEvent.mock.calls[0].arguments,
            [
                {
                    uid: 'event-uid',
                    mbzId: 42,
                    mbzUid: 'uuid',
                    hash: 'mocked_hash',
                    title: 'Test Event',
                    automationId: 1
                }
            ],
            'Expected create to be called with correct arguments'
        ); 
    })

    it('handles modified event', async () => {

        const alreadyExistingEvent = {
            hash: 'mocked_hash_modified',
            mbzId: 42,
            uid: 'event-uid'
        }

        mockImportedEventAlreadyExists.mock.mockImplementationOnce(async () => alreadyExistingEvent)

        mockRefreshOnExpired.mock.mockImplementationOnce(async () => ({
            uuid: 'uuid',
        }))

        const event = { uid: 'event-uid', title: 'Test Event' };
        await saveNewOrModifiedEvent(event, mockAutomation);

        assert.strictEqual(mockLogger.success.mock.calls.length, 1, 'Expected logger.success to be called once');
        assert.deepStrictEqual(
            mockLogger.success.mock.calls[0].arguments,
            [`Event event-uid has been saved with UUID uuid.`, 1],
            'Expected logger.success to be called with correct arguments'
        );        
        assert.strictEqual(mockLogger.info.mock.calls.length, 1, 'Expected logger.info to be called once');
        assert.deepStrictEqual(
            mockLogger.info.mock.calls[0].arguments,
            [`Event event-uid has been modified.`, 1],
            'Expected logger.info to be called with correct arguments'
        );
        assert.strictEqual(mockRefreshOnExpired.mock.calls.length, 1, 'Expected refreshOnExpired to be called once');
        assert.strictEqual(mockUpdateImportedEvent.mock.calls.length, 1, 'Expected update to be called once');
        assert.deepStrictEqual(
            mockUpdateImportedEvent.mock.calls[0].arguments,
            [
                alreadyExistingEvent,
                {
                    hash: 'mocked_hash',
                    title: 'Test Event',
                }
            ],
            'Expected update to be called with correct arguments'
        );
    });

    it('handles unmodified event', async () => {

        mockImportedEventAlreadyExists.mock.mockImplementationOnce(async () => ({
            hash: 'mocked_hash',
            mbzId: 42,
            uid: 'event-uid'
        }))

        // Dynamically import the function under test
        const event = { uid: 'event-uid-2', title: 'Test Event' };
        await saveNewOrModifiedEvent(event, mockAutomation);

        assert.strictEqual(mockLogger.info.mock.calls.length, 1, 'Expected logger.info to be called once');
        assert.deepStrictEqual(
            mockLogger.info.mock.calls[0].arguments,
            [`Event event-uid-2 has not been modified.`, 1],
            'Expected logger.info to be called with correct arguments'
        )
    })
})