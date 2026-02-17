// @TODO : Scrap meta en mode robot

import { convertUrlToBase64DataUrl } from '../utils/utils.mjs';
import { getJsonPath, getFirstJsonPath } from '../utils/json-parser.mjs';
import { parseDatesFromText } from '../utils/date-parser.mjs';
import defaultParser from './default-event-parser.mjs';

const parse = async (page, metas) => {

  const data = {
    images: []
  };
  const commonMetas = await defaultParser.parse(page, metas);
  metas.description = commonMetas.metas.description;
  metas.url = commonMetas.metas.url;
  // metas.title = commonMetas.metas.title;
  
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
            const base64Image = await convertUrlToBase64DataUrl(images[0].url);
            if (base64Image) {
              data.images.push(base64Image);
            }
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
            for (const media of object.carousel_media) {
              if (media.image_versions2?.candidates && media.image_versions2.candidates.length > 0) {
                const url = media.image_versions2.candidates[0].url;
                const base64Image = await convertUrlToBase64DataUrl(url);
                if (base64Image && !data.images.includes(base64Image)) {
                  data.images.push(base64Image);
                } 
              }

              if (media.accessibility_caption) {
                AICaptions.push(media.accessibility_caption);
              }
            }
          }

          let parsedDates = parseDatesFromText(description);
          for (const caption of AICaptions) {
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
      console.log('Erreur parsing JSON : ', e)
      throw e
    }
  };
  data.metas = metas;

  return data;
};

export default { parse };
