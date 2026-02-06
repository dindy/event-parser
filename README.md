# Presentation

Backend application to parse an event's page metadata from various platforms. Designed for french dates.

Supported platforms and formats :
* [Facebook](https://www.facebook.com/)
* [Instagram](https://www.instagram.com/)
* [HelloAsso](https://www.helloasso.com/)
* [Dice](https://dice.fm/)
* [Shotgun](https://shotgun.live/)
* [Common meta data](https://metascraper.js.org/)
* [Eventbrite](https://www.eventbrite.com/) (partial)

Working on :
* Any suggestions ?

The backend also handles automations to import ICS feeds.

# Getting started

Install dependencies with :
```
npm install
```

## Production

Create `.env.prod` file (see `.env.sample` for documentation).

Launch server with :
```
NODE_ENV=prod node server.mjs
```

N.B: If you use puppeteer with headless mode disabled on a server with no display hardware you can install [Xvfb](https://en.wikipedia.org/wiki/Xvfb) and launch NodeJS with `xvfb-run`.

E.G:
```
NODE_ENV=prod xvfb-run --server-args=\"-screen 0 1280x800x24\" --auto-servernum node server.mjs
```

## Development

Create `.env.dev` file (see `.env.sample` for documentation)
Execute :
```
npm run dev
```
or
```
npm run watch
```

NodeJS will be launched with `xvfb-run`.

## Testing

Create `.env.test` file (see `.env.sample`)

Execute :
```
npm run test
```

## Automations

Automations can be executed via a CRON with a `GET` at `/cron/automations`. E.G:
```
GET https://domain.com/cron/automations?secret=my-secret
```

Secret password must be set in .env file.