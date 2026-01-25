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

Create `.env.prod` file (see `.env.sample`)

### Automations

Automations can be executed via a CRON with a `GET` at `/cron/automations`. Example given :
```
GET https://domain.com/cron/automations?secret=my-secret
```

Secret password must be set in .env file.

## Development

Create `.env.dev` file (see `.env.sample`)
Execute :
```
npm run dev
```
or
```
npm run watch
```

## Testing

Create `.env.test` file (see `.env.sample`)

Execute :
```
npm run test
```