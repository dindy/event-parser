import * as chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import puppeteer from 'puppeteer'
import { promises as fs } from "fs"
import { getEventModel } from '../libs/parsers/web-parsers/models.mjs'
import * as utils from '../libs/parsers/web-parsers/utils/utils.mjs'
import path from 'path'
import * as td from 'testdouble'

chai.use(chaiAsPromised)

const browser = await puppeteer.launch()

after(async () => {
    await browser.close()
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

describe("Test event web parser", async function () {
    
    const convertUrlToBase64DataUrl = td.function('Utils.convertUrlToBase64DataUrl')
    
    this.beforeEach(async function () {
        await td.replaceEsm('../libs/parsers/web-parsers/utils/utils.mjs', {
            ...utils,
            convertUrlToBase64DataUrl
        })        
    })

    afterEach(function () {
        td.reset()
    })
    
    it('should parse stereolab event page', async function ()
    { 
        const url = 'https://aeronef.fr/agenda/ditter-gunerkunier'
        const htmlFilePath = './test/pages/stereolab-ditter-gunerkunier.html'

        const page = await loadPage(url, htmlFilePath)
        const parser = await import('../libs/parsers/web-parsers/event/default-event-parser.mjs')
        const parsed = await parser.default.parse(page, getEventModel())  
        
        td.verify(convertUrlToBase64DataUrl('https://aeronef.fr/sites/aeronef/files/styles/16x9_1920/public/2025-12/visuel_site.png?h=fbf7a813&itok=fiGsAHLC'))
        
        td.verify(convertUrlToBase64DataUrl('https://aeronef.fr/sites/aeronef/files/styles/16x9_1920/public/2025-12/visuel_site.png?h=fbf7a813&itok=fiGsAHLC'))

        chai.expect(parsed.metas).to.be.deep.contains({
            title: 'DITTER + GÜNER KÜNIER',
            startTimestamp: 1772305200,
            endTimestamp: null,
            description: 'Date soutenue par Liveurope, la première initiative pan-européenne pour soutenir les salles de concerts en matière de promotion d’artistes émergents.',
            place: null,
            ticketsUrl: 'https://aeronef.fr/agenda/ditter-gunerkunier',
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
    
    it('should parse eventbrite event page', async function ()
    {
        const url = 'https://www.eventbrite.fr/e/billets-grande-vente-de-plantes-st-germain-en-laye-1981575849709'
        const htmlFilePath = './test/pages/eventbrite-plantes.html'

        const page = await loadPage(url, htmlFilePath)
        const parser = await import('../libs/parsers/web-parsers/event/default-event-parser.mjs')
        const parsed = await parser.default.parse(page, getEventModel())  

        td.verify(convertUrlToBase64DataUrl('https://www.eventbrite.fr/e/_next/image?url=https%3A%2F%2Fimg.evbuc.com%2Fhttps%253A%252F%252Fcdn.evbuc.com%252Fimages%252F1175834380%252F446654944658%252F1%252Foriginal.20260126-134328%3Fcrop%3Dfocalpoint%26fit%3Dcrop%26w%3D480%26auto%3Dformat%252Ccompress%26q%3D75%26sharp%3D10%26fp-x%3D0.5%26fp-y%3D0.5%26s%3D02e9a642e09e5954fb6fb51dbabbd71a&w=940&q=75'))

        td.verify(convertUrlToBase64DataUrl('https://img.evbuc.com/https%3A%2F%2Fcdn.evbuc.com%2Fimages%2F1175834380%2F446654944658%2F1%2Foriginal.20260126-134328?crop=focalpoint&fit=crop&w=480&auto=format%2Ccompress&q=75&sharp=10&fp-x=0.5&fp-y=0.5&s=02e9a642e09e5954fb6fb51dbabbd71a'))

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

    it('should parse facebook garorock event page', async function ()
    {
        const url = 'https://www.facebook.com/events/plaine-de-la-filhole-47200-marmande-france/garorock-2026-30-%C3%A8me-%C3%A9dition/1156265816461916/'
        const htmlFilePath = './test/pages/facebook-garorock.html'
        const page = await loadPage(url, htmlFilePath)
        const parser = await import('../libs/parsers/web-parsers/event/facebook-event-parser.mjs')
        const parsed = await parser.default.parse(page, getEventModel())         
        
        td.verify(convertUrlToBase64DataUrl('https://scontent-cdg4-1.xx.fbcdn.net/v/t39.30808-6/561759007_823888796959056_2952129657611568225_n.jpg?stp=dst-jpg_s960x960_tt6&_nc_cat=105&ccb=1-7&_nc_sid=7e0d18&_nc_ohc=d-qOf5Xx-osQ7kNvwHrlQ-p&_nc_oc=AdmkSjTRk6Xe2Qc4jlKAYSN3APJRPsI9Ur2YocH9W9J3zTSc-MNlK5GpDsh0yXVVJQ0&_nc_zt=23&_nc_ht=scontent-cdg4-1.xx&_nc_gid=I83ngRGELp-FLTyrz6R6kA&oh=00_AfvfuptfE9RkXlgyz2M7rTtijFw1flqmUVy_7VQMVnISzQ&oe=699E5FC2'))
        
        td.verify(convertUrlToBase64DataUrl('https://lookaside.fbsbx.com/lookaside/crawler/media/?media_id=1156265816461916'))
        
        chai.expect(parsed.metas).to.be.deep.contains(
            {
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
            }
        )            
    })
})