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
* [Common meta data](https://metascraper.js.org/)
* [Eventbrite](https://www.eventbrite.com/) (partial)

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

# @TODO

* Parse <meta name="geo.region" content="ch-be">. See https://www.bibliobiel.ch/de/aktuelles/
* Parse <meta name="geo.placename" content="Dufourstrasse 26, 2500 Biel/Bienne">. See https://www.bibliobiel.ch/de/aktuelles/
* Parse ics event attachment as url. See https://culturoscope-enrich.strukturart.workers.dev/