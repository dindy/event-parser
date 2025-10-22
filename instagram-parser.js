/* Tests 
https://www.instagram.com/p/DOn9NmwjPP_/?utm_source=ig_web_copy_link&img_index=1
https://www.instagram.com/leglobesoustons/reel/DN3lIRG2gJt/
https://www.instagram.com/p/DOfXZRhCph5/?utm_source=ig_web_copy_link
*/

// @TODO : Retourner l'URL
// @TODO : Scrap meta en mode robot

const { convertUrlToBase64 } = require('./utils.js');
const fs = require('fs').promises;
const { getJsonPath, getFirstJsonPath } = require('./json-parser.js');
const { parseDatesFromText } = require('./parse-date.js');

module.exports = {
  parse: async (page, metas) => {
    console.log('parsing');

    const data = {
      images: []
    };
    const content = await page.content();
    await fs.writeFile('page.html', content);

    const scripts = await page.$$eval('script', scripts => scripts
      .filter(script => script.type === "application/json")
      .map(script => script.textContent)
    );

    for (const scriptContent of scripts) {
      try {
        const json = JSON.parse(scriptContent);

        const info = getFirstJsonPath('$..[*].xdt_api__v1__media__shortcode__web_info', json);
        if (info) {
          const items = info.items;
          if (items.length > 0) {
            const object = items[0];
            
            const images = object.image_versions2?.candidates;
            if (images && images.length > 0) {
              const base64Image = await convertUrlToBase64(images[0].url);
              data.images.push(base64Image);
            }
            
            if (object.user) {
              const { full_name, username, id, profile_pic_url } = object.user;
              const host = {
                name: null,
                url: null,
                id: null,
                profile_picture: null,
              };
              host.name = full_name && full_name !== '' ? full_name : username;
              host.url = profile_pic_url;
              host.id = id;
            }
            
            if (object.location) {
              if (object.location.lat && object.location.lng) {
                metas.physicalAddress.geom = `${object.location.lng};${object.location.lat}`;
              }

              if (object.location.name) {
                metas.physicalAddress.description = object.location.name;
              }
            }

            const description = object.caption.text;
            metas.description = description;
            
            const AICaptions = [];
            if (object.accessibility_caption) {
              AICaptions.push(object.accessibility_caption);
            }
            
            if (object.carousel_media) {
              for (media of object.carousel_media) {
                if (media.image_versions2?.candidates && media.image_versions2.candidates.length > 0) {
                  const url = media.image_versions2.candidates[0].url;
                  const base64Image = await convertUrlToBase64(url);
                  if (!data.images.includes(base64Image)) {
                    data.images.push(base64Image);
                  } 
                }

                if (media.accessibility_caption) {
                  AICaptions.push(media.accessibility_caption);
                }
              }
            }

            let parsedDates = parseDatesFromText(description);
            for (caption of AICaptions) {
              const captionParsedDates = parseDatesFromText(caption);
              if (captionParsedDates.score > parsedDates.score) {
                parsedDates = captionParsedDates;
              }
            }
            
            // const descriptionParsedDates = parseDatesFromText(description);
            metas.startTimestamp = Math.floor(parsedDates.startDateTimeCandidate / 1000);
            metas.endTimestamp = Math.floor(parsedDates.endDateTimeCandidate / 1000);

          }
        }
      } catch (e) {
        console.log('Erreur parsing JSON : ', e);
      }
    };
    data.metas = metas;

    return data;
  },
};
