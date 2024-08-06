![Logo](logo.svg)

Manage your multi-tournament LAN without opening Excel

[![AGPL License](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](http://www.gnu.org/licenses/agpl-3.0)

## Features

 ⚙️ Complete configuration from app interface  
 ⚔️ Duels and FFA tournaments  
 🏆 Global tournament, with cutomizable points for each tournament  
 👤 Players management  
 🎯 Achievements  
 🏅 Leaderboard for both players and teams  

## Getting Started

This app requires the LTS version of [NodeJS](https://nodejs.org). Then:

- Clone this repository and `cd` into it
- Install dependencies with `npm install`
- Open **config.json** and fill:
  - ***security.admin_password***  with a bcryt hash of your admin page password.  
  You can get it from [bcrypt](https://www.bcrypt.fr/).
  - ***igdb_api.igdb_client_id*** and ***igdb_api.igdb_client_secret*** to import games images from IGDB.  
  You can get your token from [IGDB](https://api.igdb.com) website.

- To run the server in dev mode run `npm run dev`
- To run the server in production mode, build the application with `npm run build` then start the server with `npm run start`
- Open http://localhost:3000 with your browser to see the app


## Demo V1

Here is a [Demo](https://oozturn.bug38.com) running on a Raspberry Pi 4, itself hosting other stuff. V1 was less efficient than V2.

## Used By

This app was used for the Lan'Oween 2023 event, organized by the [Azerty team](https://www.team-azerty.com/)

## Credits

This app uses a derivative of the [tournament-js](https://github.com/tournament-js) module written by [clux (Eirik A)](https://github.com/clux)

## License

[AGPL3](https://github.com/Oozturn/oozturn/blob/main/LICENSE)
