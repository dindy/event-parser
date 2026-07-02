// @TODO : Scrap meta en mode robot

import { convertUrlToBase64DataUrl } from '../utils/utils.mjs';
import { parseDatesFromText } from '../utils/date-parser.mjs';
import defaultParser from './default-event-parser.mjs';

const extractShortcodeFromUrl = (url) => {
  if (!url) return null;
  const match = url.match(/\/p\/([^/?#]+)/);
  return match ? match[1] : null;
};

const normalizeCaption = (caption) => {
  if (!caption) return '';

  if (typeof caption === 'string') {
    const trimmed = caption.trim();
    if (!trimmed) return '';

    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed.replace(/'/g, '"'));
        if (parsed?.text) return parsed.text;
      } catch (error) {
        // Ignore malformed caption payloads and keep the raw text.
      }
    }

    const textMatch = trimmed.match(/["']text["']\s*:\s*["']([^"']*)["']/);
    if (textMatch) return textMatch[1];

    return trimmed;
  }

  if (typeof caption === 'object') {
    if (caption.text) return caption.text;
    if (caption.caption?.text) return caption.caption.text;
  }

  return '';
};

const getBestImageUrl = (media) => {
  if (!media) return null;

  if (media.image_versions2?.candidates?.length > 0) {
    return media.image_versions2.candidates[0].url;
  }

  if (media.display_url) return media.display_url;
  if (media.display_uri) return media.display_uri;
  if (media.thumbnail_src) return media.thumbnail_src;

  return null;
};

const isLikelyInstagramPost = (node) => {
  if (!node || typeof node !== 'object') return false;

  const hasCaption = Boolean(normalizeCaption(node.caption) || normalizeCaption(node.accessibility_caption));
  const hasMedia = Boolean(getBestImageUrl(node) || node.carousel_media?.length || node.display_url || node.display_uri);
  const hasCode = Boolean(node.code || node.shortcode || node.id);
  const hasUser = Boolean(node.user || node.owner);

  return hasCode && hasCaption && (hasMedia || hasUser || node.location);
};

const findBestPostNode = (json, expectedCode) => {
  const candidates = [];

  const visit = (value) => {
    if (!value) return;

    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }

    if (typeof value !== 'object') return;

    if (isLikelyInstagramPost(value)) {
      const score = (expectedCode && (value.code === expectedCode || value.shortcode === expectedCode) ? 100 : 0)
        + (value.image_versions2?.candidates?.length ? 20 : 0)
        + (value.carousel_media?.length ? 15 : 0)
        + (value.user || value.owner ? 10 : 0)
        + (value.location ? 5 : 0)
        + (normalizeCaption(value.caption) ? 5 : 0);

      candidates.push({ score, node: value });
    }

    Object.values(value).forEach(visit);
  };

  visit(json);

  if (candidates.length === 0) return null;

  candidates.sort((first, second) => second.score - first.score);
  return candidates[0].node;
};

const parse = async (page, metas) => {
  const data = {
    images: []
  };

  const commonMetas = await defaultParser.parse(page, metas);
  metas.description = commonMetas.metas.description;
  metas.url = commonMetas.metas.url;

  const scripts = await page.$$eval('script', (scriptNodes) => scriptNodes
    .filter((script) => script.type === 'application/json')
    .map((script) => script.textContent)
  );

  const shortcode = extractShortcodeFromUrl(page.url());
  let postObject = null;

  for (const scriptContent of scripts) {
    if (!scriptContent) continue;

    try {
      const json = JSON.parse(scriptContent);
      postObject = findBestPostNode(json, shortcode);
      if (postObject) break;
    } catch (error) {
      // Ignore scripts that are not valid JSON.
    }
  }

  if (postObject) {
    const mainImageUrl = getBestImageUrl(postObject);
    if (mainImageUrl) {
      try {
        const base64Image = await convertUrlToBase64DataUrl(mainImageUrl);
        if (base64Image && !data.images.includes(base64Image)) {
          data.images.push(base64Image);
        }
      } catch (error) {
        console.error('Error converting image to base64 : ', error);
      }
    }

    if (postObject.user || postObject.owner) {
      const user = postObject.user || postObject.owner;
      const { full_name, username, id, profile_pic_url } = user;
      const host = {
        name: null,
        url: null,
        id: null,
        profile_picture: null,
      };
      host.name = full_name && full_name !== '' ? full_name : username;
      host.url = profile_pic_url;
      host.id = id;

      if (host.name) {
        metas.hosts = Array.isArray(metas.hosts) ? metas.hosts : [];
        if (!metas.hosts.some((existingHost) => existingHost.id === host.id || existingHost.name === host.name)) {
          metas.hosts.push(host);
        }
      }
    }

    if (postObject.location) {
      if (postObject.location.lat && postObject.location.lng) {
        metas.physicalAddress.geom = `${postObject.location.lng};${postObject.location.lat}`;
      }

      if (postObject.location.name) {
        metas.physicalAddress.description = postObject.location.name;
      }
    }

    const description = normalizeCaption(postObject.caption) || normalizeCaption(postObject.accessibility_caption) || metas.description || '';
    metas.description = description;

    const aiCaptions = [];
    const accessibilityCaption = normalizeCaption(postObject.accessibility_caption);
    if (accessibilityCaption) {
      aiCaptions.push(accessibilityCaption);
    }

    if (postObject.carousel_media) {
      for (const media of postObject.carousel_media) {
        const mediaImageUrl = getBestImageUrl(media);
        if (mediaImageUrl) {
          try {
            const base64Image = await convertUrlToBase64DataUrl(mediaImageUrl);
            if (base64Image && !data.images.includes(base64Image)) {
              data.images.push(base64Image);
            }
          } catch (error) {
            console.error('Error converting image to base64 : ', error);
          }
        }

        const mediaAccessibilityCaption = normalizeCaption(media.accessibility_caption);
        if (mediaAccessibilityCaption) {
          aiCaptions.push(mediaAccessibilityCaption);
        }
      }
    }

    let parsedDates = parseDatesFromText(description);
    for (const caption of aiCaptions) {
      const captionParsedDates = parseDatesFromText(caption);
      if (captionParsedDates.score > parsedDates.score) {
        parsedDates = captionParsedDates;
      }
    }

    metas.startTimestamp = Math.floor(parsedDates.startDateTimeCandidate / 1000);
    metas.endTimestamp = Math.floor(parsedDates.endDateTimeCandidate / 1000);
  }

  data.metas = metas;
  return data;
};

export default { parse };
