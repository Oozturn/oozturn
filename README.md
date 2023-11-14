![Logo](logo.svg)

Manage your multi-tournament LAN without opening Excel

[![AGPL License](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](http://www.gnu.org/licenses/agpl-3.0)

## Features

- Complete configuration from app interface
- Duels and FFA tournaments
- Global tournament, with cutomizable points for each tournament
- Players management
- Achievements
- Leaderboard for both players and teams
- ⚠️ **App in French** ⚠️ (translation is for the next version)

## Getting Started

This app requires the LTS version of [NodeJS](https://nodejs.org). Then:

- Clone this repository and `cd` into it
- Install dependencies with `npm install`
- Open .env.production and complete the environment variables:
  - *SESSION_SECRET* : secret used to seal the session cookie. It should be at least 32 characters long
  - *ADMIN_PASSWORD* : password used to access admin elevation
- If you want to import games images from IGDB, you will need to create an account on https://api.igdb.com and obtain an access token. Then, fill the following environment variables in .env.production:
  - *IGDB_CLIENT_ID* : your IGDB application ID
  - *IGDB_CLIENT_SECRET* : your IGDB access token
- To run the server in dev mode, copy the .env.production file to a .env.local file then run `npm run dev`
- To run the server in production mode, build the application with `npm run build` then start the server with `npm run start`
- Open http://localhost:3000 with your browser to see the app

## API

The GraphQL interface can be accessed on http://localhost:3000/api/graphql

## Demo

Here is a [Demo](https://oozturn.bug38.com) running on a Raspberry Pi 4, itself hosting other stuff.

## Used By

This app was used for the Lan'Oween 2023 event, organized by the [Azerty team](https://www.team-azerty.com/)

## Credits

This app uses a derivative of the [tournament-js](https://github.com/tournament-js) module written by [clux (Eirik A)](https://github.com/clux)

## License

[AGPL3](https://github.com/Oozturn/oozturn/blob/main/LICENSE)
