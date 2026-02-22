import * as chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import puppeteer from 'puppeteer'
import { promises as fs } from "fs"
// import parser from '../libs/parsers/web-parsers/event/facebook-event-parser.mjs'
import { getEventModel } from '../libs/parsers/web-parsers/models.mjs'
import * as utils from '../libs/parsers/web-parsers/utils/utils.mjs'
import path from 'path'
import * as td from 'testdouble'

chai.use(chaiAsPromised)

describe("Test event web parser", async function () {
    
    const convertUrlToBase64DataUrl = td.function('Utils.convertUrlToBase64DataUrl')
    
    afterEach(function () {
        td.reset()
    })
    
    beforeEach(async function () {    
        // Replace used functions in dependencies
        await td.replaceEsm('../libs/parsers/web-parsers/utils/utils.mjs', {
            ...utils,
            convertUrlToBase64DataUrl
        })

    })
    
    it('should parse facebook event page', async function ()
    {
        const url = 'https://www.facebook.com/events/plaine-de-la-filhole-47200-marmande-france/garorock-2026-30-%C3%A8me-%C3%A9dition/1156265816461916/'
        const browser = await puppeteer.launch()
        const page = await browser.newPage()
        const html = await fs.readFile(path.resolve('./test/pages/facebook-garorock.html'), 'utf-8')
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
        const parser = await import('../libs/parsers/web-parsers/event/facebook-event-parser.mjs')
        const result = await parser.default.parse(page, getEventModel())     
        td.verify(convertUrlToBase64DataUrl('https://scontent-cdg4-1.xx.fbcdn.net/v/t39.30808-6/561759007_823888796959056_2952129657611568225_n.jpg?stp=dst-jpg_s960x960_tt6&_nc_cat=105&ccb=1-7&_nc_sid=7e0d18&_nc_ohc=d-qOf5Xx-osQ7kNvwHrlQ-p&_nc_oc=AdmkSjTRk6Xe2Qc4jlKAYSN3APJRPsI9Ur2YocH9W9J3zTSc-MNlK5GpDsh0yXVVJQ0&_nc_zt=23&_nc_ht=scontent-cdg4-1.xx&_nc_gid=I83ngRGELp-FLTyrz6R6kA&oh=00_AfvfuptfE9RkXlgyz2M7rTtijFw1flqmUVy_7VQMVnISzQ&oe=699E5FC2'))
        td.verify(convertUrlToBase64DataUrl('https://lookaside.fbsbx.com/lookaside/crawler/media/?media_id=1156265816461916'))
        chai.expect(result.metas).to.be.deep.equal(
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
                },
                og: [],
                position: { latitude: 44.4976, longitude: 0.16084 }
            }
        )            
    })
})