import * as chai from 'chai'
import chaiString from 'chai-string'
import request from 'supertest'
import app from '../app.mjs'
import { test, it } from 'node:test'

chai.use(chaiString)

test('Scrap and parse events on every platform', function () {

    it('scraps and parses events from instagram reels', function () { 

        const url = btoa(unescape(encodeURIComponent('https://www.instagram.com/reel/DU6Bo-XjDMI/')))
        const provider = 'instagram'
        const type = 'event'

        request(app)
            .get(`/scrap?url=${url}&provider=${provider}&type=${type}`)
            .expect('Content-Type', 'application/json')
            .expect(200)
            .end(async function (err, res) {
                if (err) throw err;
                const body = res.body
                chai.expect(body.data?.metas).to.be.an('object')
                chai.expect(body.data.images).to.be.an('array')
                chai.expect(body.data.images[0]).to.be.a('string')
                chai.expect(body.data.images[0]).to.startsWith('data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/7QBsUGhvdG9zaG9wIDMuMAA4QklNBAQAAAAAAFAcAigASkZCTUQwZjAwMDcxNjAxMDAwMGRkMjIwMDAwNDg1MTAwMDA3NDc0MDAwMDFlOTIwMDAwM2RjMzAwMDBlNGY3MDAwMDk3M')
                chai.expect(body.data.metas).to.be.deep.contains({
                    title: 'Roulettes Jam Festival sur Instagram: “C’est ce week-end!! 🔥\n' +
                    '🗓️ Sam 21 et Dim 22 février à Tosse (40) 🤩 des ateliers en journée: Roller Dance, Freestyle et entretien de roulements pour les pratiquants niv débutant ou intermédiaire 🪩2 roller parties ouvertes à tous, inline ou quad, novices ou confirmés, le samedi soir 17h et dimanche après midi 15h => prends tes préventes ! 🔥 Loc de patins sur place (1 carte d’identité par paire louée) 🎁 Des toooooonnes de cadeaux à gagner: des patins, des accessoires, des roues lumineuses… grâce à nos partenaires @impalaskate @nomadeshop_official @luminouswheels et @burdysquadshop 💆‍♀️une chill zone en acces libre tout le week-end pour se détendre et reprendre des forces ! 🎟️ billetterie et inscription ateliers sur www.roulettes40.com et lien en bio ! Ne rate pas cette édition du 1er festival roller quad du Sud Ouest 😍”',
                    startTimestamp: 1771776000,
                    endTimestamp: 1771855200,
                    description: 'C’est ce week-end!! 🔥\n' +
                    '🗓️ Sam 21 et Dim 22 février à Tosse (40)\n' +
                    '\n' +
                    '🤩 des ateliers en journée: Roller Dance, Freestyle et entretien de roulements pour les pratiquants niv débutant ou intermédiaire\n' +
                    '\n' +
                    '🪩2 roller parties ouvertes à tous, inline ou quad, novices ou confirmés, le samedi soir 17h et dimanche après midi 15h => prends tes préventes !\n' +
                    '\n' +
                    '🔥 Loc de patins sur place (1 carte d’identité par paire louée)\n' +
                    '\n' +
                    '🎁 Des toooooonnes de cadeaux à gagner: des patins, des accessoires, des roues lumineuses… grâce à nos partenaires @impalaskate @nomadeshop_official @luminouswheels et @burdysquadshop \n' +
                    '\n' +
                    '💆‍♀️une chill zone en acces libre tout le week-end pour se détendre et reprendre des forces !\n' +
                    '\n' +
                    '🎟️ billetterie et inscription ateliers sur www.roulettes40.com et lien en bio !\n' +
                    '\n' +
                    'Ne rate pas cette édition du 1er festival roller quad du Sud Ouest 😍',
                    place: null,
                    ticketsUrl: null,
                    address: null,
                    hosts: [],
                    url: 'https://www.instagram.com/roulettesjamfest/reel/DU6Bo-XjDMI/',
                    online: null,
                    physicalAddress: {
                        description: 'Tosse, Aquitaine, France',
                        geom: '-1.32893;43.69468',
                        locality: null,
                        postalCode: null,
                        street: null,
                        country: null
                    }                
                })
            })
    })
    
    /**
     * `ticketsUrl` is not present on past events 
     * hosts `profile_picture` url change each time (not used anyway)
    */
   it('scraps and parses events from facebook', function () {
        
        const url = btoa(unescape(encodeURIComponent('https://www.facebook.com/events/1367789884993855')))
        const provider = 'facebook'
        const type = 'event'
        
        request(app)
            .get(`/scrap?url=${url}&provider=${provider}&type=${type}`)
            .expect('Content-Type', 'application/json')
            .expect(200)
            .end(async function (err, res) {
                if (err) throw err;
                const body = res.body
                chai.expect(body.data?.metas).to.be.an('object')
                chai.expect(body.data.images).to.be.an('array')
                chai.expect(body.data.images[0]).to.be.a('string')
                chai.expect(body.data.images[0]).to.startsWith('data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/7QCEUGhvdG9zaG9wIDMuMAA4QklNBAQAAAAAAGgc')
                chai.expect(body.data.metas.hosts).to.be.an('array')
                chai.expect(body.data.metas.hosts[0]).to.be.an('object')
                chai.expect(body.data.metas.hosts[0]).to.be.deep.contains({
                    name: 'Atabal Biarritz',
                    url: 'https://www.facebook.com/atabalbtz',
                    id: '100064733044483',
                    // profile_picture: 'https://scontent-bru2-1.xx.fbcdn.net/v/t39.30808-1/240672120_5092561344092483_87011272227557005_n.png?stp=cp0_dst-png_s40x40&_nc_cat=106&ccb=1-7&_nc_sid=2d3e12&_nc_ohc=XNdzDcDFoPgQ7kNvwEG2tKw&_nc_oc=Adm4HfLrFbXvAzYcermc3q1Qi1JqYj7VyS6RBSyUyAQopkFoPyO2Qj5aubiD0vRm89M&_nc_zt=24&_nc_ht=scontent-bru2-1.xx&_nc_gid=RbghxSNlKnMQ27azyPufjQ&oh=00_AfvWuqLWLzm2GVM3PkJfQPmB--nLzPcr_ZJaESFIirATkw&oe=69A279D0'
                })    
                chai.expect(body.data.metas).to.be.deep.contains({
                    title: 'La Décadence & La Sueur {Djset / Drag Show / Talk} • Musique d’Apéritif ~ Atabal Biarritz',
                    startTimestamp: 1771606800,
                    endTimestamp: null,
                    description: 'La Décadence & La Sueur\n' +
                    '~~~~~~~~~~~~~~~~~~~~~~~~~~~~\n' +
                    '{Djset • Drag Show • Talk • Performance}\n' +
                    'En partenariat avec Le Queen Festival \n' +
                    '~~~~~~~~~~~~~~~~~~~~~~~~~~~~\n' +
                    '𝗢𝗧𝗦𝗔𝗜𝗟𝗔𝗞 𝟮𝟬 𝗙𝗘𝗩𝗥𝗜𝗘𝗥\n' +
                    '~~~~~~~~~~~~~~~~~~~~~~~~~~~~\n' +
                    '✺ Gratuit ✺\n' +
                    '~> urlr.me/HYqN2R\n' +
                    '~~~~~~~~~~~~~~~~~~~~~~~~~~~~\n' +
                    'La Décadence\n' +
                    '{Djset • Drag Show}\n' +
                    '\n' +
                    'La Décadence, c’est l’endroit où les nuits prennent forme, où les identités s’étirent, se transforment, se dévoilent. Un collectif queer qui fusionne le drag, la fête et l’art pour créer des moments suspendus — vibrants, indisciplinés et terriblement vivants.\n' +
                    'Ici, chaque performance est un sortilège, chaque beat une invitation à lâcher prise, chaque regard un rappel que la liberté peut être spectaculaire. La Décadence fait danser les corps, bouscule les normes et célèbre celles et ceux qui osent être trop : trop brillants, trop glamour, trop sensibles, trop eux-mêmes.\n' +
                    'Entre drag queens en feu, DJ qui ne lâchent pas le BPM et un public qui embrase la salle, La Décadence devient plus qu’un événement : un rituel de communauté, une scène ouverte où l’on écrit nos propres règles et où la nuit devient un manifeste.\n' +
                    'Parce qu’ici, on ne fait pas que sortir... on cultive l’art d’être vivant.\n' +
                    '\n' +
                    '~~~~~~~~~~~~~~~~~~~~~~~~~~~~\n' +
                    'Avril {djset}\n' +
                    '~~~~~~~~~~~~~~~~~~~~~~~~~~~~\n' +
                    '\n' +
                    'Portée par l’énergie des nuits queer, Avril sculpte des sets House et Trance où l’émotion rencontre la puissance.\n' +
                    'DJ par passion et créatrice d’espaces par nécessité, elle puise son inspiration dans les artistes et producteur·ice·s de sa communauté pour façonner une musique qui réunit, libère et fait vibrer.\n' +
                    'As a Doll, Avril défend une vision où la fête devient refuge : un endroit intense, inclusif et terriblement vivant, comme seuls les collectifs queer savent en faire naître. Derrière ses transitions lumineuses et son univers enveloppant, elle crée des moments suspendus qui bousculent les corps, touchent les cœurs et laissent une trace longtemps après la dernière note.\n' +
                    '\n' +
                    '~~~~~~~~~~~~~~~~~~~~~~~~~~~~\n' +
                    'Drag Show \n' +
                    '~~~~~~~~~~~~~~~~~~~~~~~~~~~~\n' +
                    '\n' +
                    'MISS CLOTILDE\n' +
                    'Née en 2020 dans les Landes, en plein confinement, Miss Clotilde s’est imposée comme une queen à barbe aussi solaire que pétillante. Avec son univers DISCO, POP, GLAMOUR, VINTAGE et farouchement humoristique, elle transforme chaque scène en piste de danse libératrice. Puisant son énergie dans les icônes qui l’inspirent — Kylie, Cher, Juliette Armanet, Loreen, Régine, Lady Gaga et tant d’autres — Miss Clotilde offre un show vibrant où le rétro rencontre le moderne, où l’élégance flirte avec\n' +
                    'l’audace, et où la fête devient un véritable état d’esprit.\n' +
                    '\n' +
                    'XANAXA\n' +
                    'Dans un souffle de mystère et de lumière, Xanaxa se révèle comme une force qui casse les codes et réinvente les nuits. Drag queen par passion, artiste par nécessité intérieure, elle mêle glamour, émotion et liberté pour créer un espace où chacun peut explorer sa vérité. Née d’une quête personnelle autour du genre et de l’identité, Xanaxa utilise le drag comme un terrain\n' +
                    'd’émancipation, un endroit où les stéréotypes s’effondrent et où la fluidité devient une fête. Entre intensité, talons vertigineux et regards qui bousculent, elle marque les esprits et célèbre l’art comme une révolution.\n' +
                    '\n' +
                    '~~~~~~~~~~~~~~~~~~~~~~~~~~~~\n' +
                    '\n' +
                    'La Sueur \n' +
                    '{Djset • Performance}\n' +
                    '\n' +
                    'La Sueur est un collectif bordelais réunissant DJs et danseur·ses autour d’une fête libre, inclusive et engagée. Sur le dancefloor, les corps s’expriment sans normes ni injonctions : performances, musique et mouvements se mêlent pour célébrer les identités et la diversité.\n' +
                    'Ici, la danse devient un acte de liberté, de résistance et de joie collective. Aucun espace pour les discriminations — seulement une fête ouverte où chacun·e peut exister pleinement.\n' +
                    '\n' +
                    '~~~~~~~~~~~~~~~~~~~~~~~~~~~~\n' +
                    '\n' +
                    "Musique d'Apéritif {djset}\n" +
                    '\n' +
                    'Textures électroniques, italo décomplexé, rock festif, beats hypnotiques et montées collectives : les sélections s’embrasent, les styles s’enlacent, et justice est fête.\n' +
                    '\n' +
                    '~~~~~~~~~~~~~~~~~~~~~~~~~~~~\n' +
                    '\n' +
                    "Queen Talk - Animation d'un Talk en ouverture de soirée en partenariat avec le Queen Festival \n" +
                    '\n' +
                    '~~~~~~~~~~~~~~~~~~~~~~~~~~~~\n' +
                    '✺ Billetterie ~ Info ~ Txarteltegi ✺\n' +
                    'www.atabal-biarritz.com\n' +
                    '~~~~~~~~~~~~~~~~~~~~~~~~~~~~\n' +
                    'MANIFESTO\n' +
                    '~~~~~~~~~~~~~~~~~~~~~~~~~~~~\n' +
                    'Atabal Biarritz est un lieu où la bienveillance est de rigueur.\n' +
                    'Nous ne tolérons aucun acte homophobe, transphobe, misogyne, raciste, islamophobe, antisémite, discriminatoire de quelque nature.\n' +
                    '\n' +
                    'Nous vous invitons à veiller les un.e.s sur les autres, non seulement entre ami.e.s, mais aussi entre inconnu.e.s, ainsi qu’à respecter le concert et les artistes.\n' +
                    'Pour que la musique et la fête restent un plaisir partagé.\n' +
                    'Prenez soin de vous et des autres.\n' +
                    '\n' +
                    'Merci\n' +
                    '✺',
                    place: '37 Allée du Moura, 64200 Biarritz, France',
                    ticketsUrl: null,
                    address: '37 Allée du Moura, 64200 Biarritz, France',
                    url: 'https://www.facebook.com/events/37-all%C3%A9e-du-moura-64200-biarritz-france/la-d%C3%A9cadence-la-sueur-djset-drag-show-talk-musique-dap%C3%A9ritif-atabal-biarritz/1367789884993855/',
                    online: false,
                    physicalAddress: {
                        description: null,
                        geom: '-1.53974;43.46009',
                        locality: 'Biarritz',
                        postalCode: '64200',
                        street: '37 Allée du Moura',
                        country: 'France'
                    },
                })
            })
    })
})