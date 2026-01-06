# Presentation

NodeJS server to parse an event's page metadata from various platforms. Designed for french dates.

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

# Getting started

Create a .env file (see .env.sample)

```
npm install
node --env-file=.env app.js
```

Or with nodemon :

```
npm install
nodemon --env-file=.env app
```