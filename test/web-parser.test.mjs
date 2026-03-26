import * as chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import puppeteer from 'puppeteer'
import { promises as fs } from "fs"
import { getEventModel, getGroupModel } from '../libs/parsers/web-parsers/models.mjs'
import path from 'path'
import { test, mock, after, it } from 'node:test'
import * as utils from '../libs/parsers/web-parsers/utils/utils.mjs'

chai.use(chaiAsPromised)

const browser = await puppeteer.launch()
const mockConvertUrlToBase64DataUrl = mock.fn(async () => ({empty: true}))

mock.module('../libs/parsers/web-parsers/utils/utils.mjs', {
    namedExports: {
        ...utils,
        convertUrlToBase64DataUrl: mockConvertUrlToBase64DataUrl
    }
})

const loadPage = async (url, file) => {
    const page = await browser.newPage()
    const html = await fs.readFile(path.resolve(file), 'utf-8')
    await page.setRequestInterception(true)
    page.on('request', req => {
        if (req.url() === url || req.url() === url + '/') {
            req.respond({
                body: html,
                contentType: 'text/html',
            })
        } else {
            req.abort()
        }
    })
    await page.goto(url)
    return page
}

test('group web parser', async () => {

    const parser = await import('../libs/parsers/web-parsers/group/default-group-parser.mjs')

    it('should parse hello asso group page', async () => {
        const url = 'https://www.helloasso.com/associations/resonance-euskadi'
        const htmlFilePath = './test/group-pages/helloasso-resonance-euskadi.html'
        const page = await loadPage(url, htmlFilePath)
        const parsed = await parser.default.parse(page, getGroupModel())
        chai.expect(mockConvertUrlToBase64DataUrl.mock.calls.some(call => call.arguments[0] === 'https://cdn.helloasso.com/img/photos/croppedimage-71fec38435c748658b4dfacb365480b8.png')).to.be.true
        chai.expect(mockConvertUrlToBase64DataUrl.mock.calls.some(call => call.arguments[0] === 'https://cdn.helloasso.com/img/photos/croppedimage-other.png')).to.be.true
        chai.expect(parsed).to.be.deep.contains({
            name: 'Resonance Euskadi',
            physicalAddress: {
                locality: 'Saint-Jean-de-Luz',
                country: 'FR',
                postalCode: '64500',
                street: null
            }
        })
        chai.expect(parsed.logos).to.be.an('array').that.is.not.empty.and.to.have.lengthOf(2)
    })
})

test('event web parser', async () => {
    
    after(async () => {
        await browser.close()
    })

    const parser = await import('../libs/parsers/web-parsers/event/default-event-parser.mjs')

    it('should parse stereolab event page', async () => {

        const url = 'https://aeronef.fr/agenda/ditter-gunerkunier'
        const htmlFilePath = './test/event-pages/stereolab-ditter-gunerkunier.html'
        const page = await loadPage(url, htmlFilePath)
        const parsed = await parser.default.parse(page, getEventModel())
        chai.expect(mockConvertUrlToBase64DataUrl.mock.calls.some(call => call.arguments[0] === 'https://aeronef.fr/sites/aeronef/files/styles/16x9_1920/public/2025-12/visuel_site.png?h=fbf7a813&itok=fiGsAHLC')).to.be.true
        chai.expect(parsed.metas).to.be.deep.contains({
            title: 'DITTER + GÜNER KÜNIER',
            startTimestamp: 1772305200,
            endTimestamp: null,
            description: 'Date soutenue par Liveurope, la première initiative pan-européenne pour soutenir les salles de concerts en matière de promotion d’artistes émergents.',
            place: null,
            ticketsUrl: null,
            offers: [{
                name: "Guichet Soir",
                url: "https://aeronef.fr/agenda/ditter-gunerkunier"
            }, {
                name: "Tarif guichet",
                url: "https://aeronef.fr/agenda/ditter-gunerkunier"
            }, {
                name: "Tarif -18 ans ",
                url: "https://aeronef.fr/agenda/ditter-gunerkunier"
            }, {
                name: "Tarif étudiant·es",
                url: "https://aeronef.fr/agenda/ditter-gunerkunier"
            }, {
                name: "Tarif Pro",
                url: "https://aeronef.fr/agenda/ditter-gunerkunier"
            }, {
                name: "Gratuit ABO SOIR",
                url: "https://aeronef.fr/agenda/ditter-gunerkunier"
            }, {
                name: "Gratuit abonné·e",
                url: "https://aeronef.fr/agenda/ditter-gunerkunier"
            }, {
                name: "Invitation",
                url: "https://aeronef.fr/agenda/ditter-gunerkunier"
            }],
            address: null,
            hosts: [{
                name: "L'Aéronef",
                url: 'https://aeronef.fr/laeronef-0'
            }],
            url: 'https://aeronef.fr/agenda/ditter-gunerkunier',
            online: null,
            physicalAddress: {
                description: "L'Aéronef",
                locality: 'Lille',
                postalCode: '59777',
                street: 'Avenue Willy Brandt',
                country: 'FR'
            }
        })
    })

    it('should parse eventbrite event page', async () => {
        const url = 'https://www.eventbrite.fr/e/billets-grande-vente-de-plantes-st-germain-en-laye-1981575849709'
        const htmlFilePath = './test/event-pages/eventbrite-plantes.html'
        const page = await loadPage(url, htmlFilePath)
        const parsed = await parser.default.parse(page, getEventModel())

        chai.expect(mockConvertUrlToBase64DataUrl.mock.calls.some(call => call.arguments[0] === 'https://www.eventbrite.fr/e/_next/image?url=https%3A%2F%2Fimg.evbuc.com%2Fhttps%253A%252F%252Fcdn.evbuc.com%252Fimages%252F1175834380%252F446654944658%252F1%252Foriginal.20260126-134328%3Fcrop%3Dfocalpoint%26fit%3Dcrop%26w%3D480%26auto%3Dformat%252Ccompress%26q%3D75%26sharp%3D10%26fp-x%3D0.5%26fp-y%3D0.5%26s%3D02e9a642e09e5954fb6fb51dbabbd71a&w=940&q=75')).to.be.true
        chai.expect(parsed.metas).to.be.deep.contains({
            title: 'Grande Vente de Plantes - St-Germain-en-Laye',
            startTimestamp: 1772787600,
            endTimestamp: 1772985600,
            description: 'Un événement à deux pas de chez toi !',
            place: null,
            ticketsUrl: 'https://www.eventbrite.fr/e/billets-grande-vente-de-plantes-st-germain-en-laye-1981575849709',
            address: null,
            hosts: [{
                "name": "Plantes pour Tous",
                "url": "https://www.eventbrite.fr/o/plantes-pour-tous-30299055052"
            }],
            url: 'https://www.eventbrite.fr/e/billets-grande-vente-de-plantes-st-germain-en-laye-1981575849709',
            online: null,
            physicalAddress: {
                description: 'Centre Commercial Passage Saint-Germain',
                locality: 'Saint-Germain-en-Laye',
                postalCode: null,
                street: '10 Rue de la Salle, 78100 Saint-Germain-en-Laye',
                country: 'FR'
            }
        })
    })

    it('should parse facebook garorock event page', async () => {
        const url = 'https://www.facebook.com/events/plaine-de-la-filhole-47200-marmande-france/garorock-2026-30-%C3%A8me-%C3%A9dition/1156265816461916/'
        const htmlFilePath = './test/event-pages/facebook-garorock.html'
        const page = await loadPage(url, htmlFilePath)
        const parser = await import('../libs/parsers/web-parsers/event/facebook-event-parser.mjs')
        const parsed = await parser.default.parse(page, getEventModel())         
            
        chai.expect(mockConvertUrlToBase64DataUrl.mock.calls.some(call => call.arguments[0] === 'https://scontent-cdg4-1.xx.fbcdn.net/v/t39.30808-6/561759007_823888796959056_2952129657611568225_n.jpg?stp=dst-jpg_s960x960_tt6&_nc_cat=105&ccb=1-7&_nc_sid=7e0d18&_nc_ohc=d-qOf5Xx-osQ7kNvwHrlQ-p&_nc_oc=AdmkSjTRk6Xe2Qc4jlKAYSN3APJRPsI9Ur2YocH9W9J3zTSc-MNlK5GpDsh0yXVVJQ0&_nc_zt=23&_nc_ht=scontent-cdg4-1.xx&_nc_gid=I83ngRGELp-FLTyrz6R6kA&oh=00_AfvfuptfE9RkXlgyz2M7rTtijFw1flqmUVy_7VQMVnISzQ&oe=699E5FC2')).to.be.true
        chai.expect(parsed.metas).to.be.deep.contains({
            title: 'Garorock 2026 - 30 Ã¨me Ã©dition',
            startTimestamp: 1782475200,
            endTimestamp: 1782683100,
            description: '𝐒𝐀𝐕𝐄 𝐓𝐇𝐄 𝐃𝐀𝐓𝐄 🎂\n' +
            '\n' +
            'RDV les 26.27 et 28 Juin 2026 sur LA plaine de la Filhole de Marmande, pour fêter cette 30ème édition ensemble ! 🥳\n' +
            '\n' +
            'Les pass Super Early seront disponibles le 04.11 !\n' +
            '\n' +
            'La 30ème c’est l’occasion de changer de look ⚡️\n' +
            'Ambiance électrique, sauvage, un mélange de contrastes qui rend hommage à l’ADN originel du festival. 🔥\n' +
            '\n' +
            'On n’allait pas vous lâcher comme ça 😏',
            place: 'Plaine de la Filhole, 47200 Marmande, France',
            ticketsUrl: null,
            address: 'Plaine de la Filhole, 47200 Marmande, France',
            hosts: [{
                id: "100080138283606",
                name: "Garorock Festival",
                profile_picture: "https://scontent-cdg4-2.xx.fbcdn.net/v/t39.30808-1/564589405_823815970299672_1411978063116078749_n.jpg?stp=c289.274.1500.1500a_cp0_dst-jpg_s40x40_tt6&_nc_cat=107&ccb=1-7&_nc_sid=2d3e12&_nc_ohc=iVcfIeNh5P4Q7kNvwHxF5-Z&_nc_oc=AdnCXYiIeMZqTweZR0prbQqAx5V-W0G0X1K_JRybbIy5civxm3RFt778wt_kTiBP238&_nc_zt=24&_nc_ht=scontent-cdg4-2.xx&_nc_gid=oeB91p5Wy16XCrJNVixw1A&oh=00_Afu6M5j2qaic_fyYcq8GKIOnry-EvglePLwykeCRuDMpMw&oe=699E64F7",
                url: "https://www.facebook.com/festival.garorock"
            }],
            url: 'https://www.facebook.com/events/plaine-de-la-filhole-47200-marmande-france/garorock-2026-30-%C3%A8me-%C3%A9dition/1156265816461916/',
            online: false,
            physicalAddress: {
                description: null,
                geom: '0.16084;44.4976',
                locality: 'Marmande',
                postalCode: '47200',
                street: 'Plaine de la Filhole',
                country: 'France'
            }
        })            
    })

    it('should return an empty physical address when none is found (and not null)', async () => {
        const url = 'https://www.meetup.com/it-it/pydata-venice/events/312820080/'
        const htmlFilePath = './test/event-pages/unknown-location-type.html'
        const page = await loadPage(url, htmlFilePath)
        const parsed = await parser.default.parse(page, getEventModel())        
        chai.expect(parsed.metas.physicalAddress).to.not.eq(null)
    }) 

    it('should parse meetup pydata event page', async () => {
        const url = 'https://www.meetup.com/it-it/pydata-venice/events/312820080/'
        const htmlFilePath = './test/event-pages/meetup-pydata.html'
        const page = await loadPage(url, htmlFilePath)
        const parsed = await parser.default.parse(page, getEventModel())                
        chai.expect(parsed.metas.physicalAddress).to.be.deep.contains({
            locality: 'Venice',
            country: 'it',
            street: 'Via Ortigara, 10, 30171 Mestre VE, Venice, VE',
            description: 'Anda Venice Hostel'
        })
        chai.expect(mockConvertUrlToBase64DataUrl.mock.calls.some(call => call.arguments[0] === "https://secure-content.meetupstatic.com/images/classic-events/533321988/676x676.jpg")).to.be.true
        chai.expect(mockConvertUrlToBase64DataUrl.mock.calls.some(call => call.arguments[0] === "https://secure-content.meetupstatic.com/images/classic-events/533321988/676x507.jpg")).to.be.true
        chai.expect(mockConvertUrlToBase64DataUrl.mock.calls.some(call => call.arguments[0] === "https://secure-content.meetupstatic.com/images/classic-events/533321988/676x380.jpg")).to.be.true
        chai.expect(parsed.images).to.be.an('array').that.is.not.empty.and.to.have.lengthOf(3)
    })

    it('should parse ticket url in structured data', async () => { 
        const url = 'https://random-event.com'
        const htmlFilePath = './test/event-pages/no-platform-just-structured-data.html'
        const page = await loadPage(url, htmlFilePath)
        const parsed = await parser.default.parse(page, getEventModel())
        chai.expect(parsed.metas).to.be.deep.contains({
            ticketsUrl: 'https://www.helloasso.com/associations/resonance-euskadi/evenements/dub-to-techno-2',
            offers: [{
                url: 'https://www.helloasso.com/associations/resonance-euskadi/evenements/dub-to-techno-2',
                name: "C'est gratuit pour toi, tu as été très vif"
            }, {
                url: 'https://www.helloasso.com/associations/resonance-euskadi/evenements/dub-to-techno-2',
                name: "EARLY TICKETS"
            }, {
                url: 'https://www.helloasso.com/associations/resonance-euskadi/evenements/dub-to-techno-2',
                name: "REGULAR TICKETS"
            }, {
                url: 'https://www.helloasso.com/associations/resonance-euskadi/evenements/dub-to-techno-2',
                name: "LAST TICKETS"
            }]
        })
    })

    it('should parse hello asso dub to techno event page', async () => {
        const url = 'https://www.helloasso.com/associations/resonance-euskadi/evenements/dub-to-techno-2?utm_source=ig&utm_medium=social&utm_content=link_in_bio'
        const htmlFilePath = './test/event-pages/helloasso-dubtotechno.html'
        const page = await loadPage(url, htmlFilePath)
        const parser = await import('../libs/parsers/web-parsers/event/helloasso-event-parser.mjs')
        const parsed = await parser.default.parse(page, getEventModel())

        chai.expect(mockConvertUrlToBase64DataUrl.mock.calls.some(call => call.arguments[0] === 'https://cdn.helloasso.com/img/photos/evenements/croppedimage-84dcad365ba3474cb0eb7eb5b61950fd.png?resize=fit:500:360')).to.be.true
        chai.expect(parsed.metas).to.be.deep.contains({
            title: 'DUB TO TECHNO #2',
            startTimestamp: 0,
            endTimestamp: 0,
            description: 'RESONANCE : DUB TO TECHNO II 🐍 Le format revient à l’Amestoya pour une nouvelle édition. 12h de son, en indoor 🐍  AU PROGRAMME : La soirée s’articule en deux temps, sans rupture, dans un même espace.\n' +
            '\n' +
            'GRATUIT 17h/22h\n' +
            '🔊 Dub / Sound System en début de soirée Une sélection orientée Dub et Live Micro pour poser l’énergie et installer le groove.\n' +
            '\n' +
            'AFTER 22h/06h\n' +
            `🖤 Techno &amp; dérivés jusqu’au matin. Une montée progressive vers des esthétiques plus électronique`,
            place: null,
            ticketsUrl: 'https://www.helloasso.com/associations/resonance-euskadi/evenements/dub-to-techno-2',
            address: null,
            hosts: [ 
                {
                    name: 'Resonance Euskadi',
                    url: 'https://www.helloasso.com/associations/resonance-euskadi'
                }
            ],
            url: 'https://www.helloasso.com/associations/resonance-euskadi/evenements/dub-to-techno-2',
            online: null,
            physicalAddress: {
                description: 'Salle Amestoya',
                locality: 'Bayonne',
                postalCode: '64100',
                street: '14 Avenue Benjamin Gomez',
                country: 'FRA'
            }            
        })
    })
})