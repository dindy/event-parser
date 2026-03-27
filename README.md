# Presentation

Express backend for [mobilizon-event-importer](https://github.com/dindy/mobilizon-event-importer). 
The app: 
* acts as a proxy between frontend and Mobilizon instances ;
* can scrap events data on various platforms ;
* automate imports (create / update) from ICS feeds and Facebook group events on Mobilizon instances.

Supported platforms and formats :
* [Facebook](https://www.facebook.com/)
* [Instagram](https://www.instagram.com/)
* [HelloAsso](https://www.helloasso.com/)
* [Dice](https://dice.fm/)
* [Shotgun](https://shotgun.live/)
* [Eventbrite](https://www.eventbrite.com/)
* [Meetup](https://www.meetup.com/)
* [Common meta data](https://metascraper.js.org/)

N.B: Designed for french date format (PR welcome).

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

The app is listening on port `3001` by default.

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

## Migrations

1. Create the database accordingly with your `MYSQL_DB` environment variable.

2. Execute migrations
Set the right env in NODE_ENV.
```
NODE_ENV=dev npx sequelize-cli db:migrate
```

## Automations

Automations can be executed via a CRON with a `GET` at `/cron/automations`. E.G:
```
GET https://domain.com/cron/automations?secret=my-secret
```

Secret password must be set in `.env` file.

## Docker

### Docker compose

1. Create a directory to define environment variables and store database.
```
mkdir your_project_directory
```

2. Create a `.env` file and define environment variables (see `.env.docker.sample`).
```
cd your_project_directory
# Copy / paste and customize variables
touch .env 
```

3. Copy and execute `docker-compose.yml`
```
# Copy / paste original docker-compose.yml
touch docker-compose.yml 
docker compose up -d
```

You app is listening on port 3001 by default. Three new directories have been created :
* `db` to persist mysql database
* `logs` to store app logs
* `debug` to store scraped html pages

An instance of phpMyAdmin is also available on port 8081 by default.

### Build image

```shell
docker build -t dindy88/mobilizon-importer-backend .
docker push dindy88/mobilizon-importer-backend
```

# TO DO list

* Parse meta `geo.region`. E.G: `<meta name="geo.region" content="ch-be">`. [See here](https://www.bibliobiel.ch/de/aktuelles/)
* Parse meta `geo.placename`. E.G: `<meta name="geo.placename" content="Dufourstrasse 26, 2500 Biel/Bienne">`. [See here](https://www.bibliobiel.ch/de/aktuelles/)
* Implement log level configuration
* Load all fb events by scrolling page to bottom ?
* Implement event status (see [EventStatusType](https://schema.org/EventStatusType))
* Implement event status in iCal events
* Implement online event (see [EventAttendanceModeEnumeration](https://schema.org/EventAttendanceModeEnumeration))
* Set number of puppeteer instances running simultaneously configurable
* What to do with imported events but deleted from Mobilizon server ?
* Handle automation execution separatly for each automation (display next execution timer)
* Share out automation events scraping to prevent ban 
* Use Linked Data as core event model with Schema.org vocabulary
* Improve event scrapper error return