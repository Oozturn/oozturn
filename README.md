![Logo](logo.svg)

Manage your multi-tournament LAN without opening Excel

[![AGPL License](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](http://www.gnu.org/licenses/agpl-3.0)

## Features

 ⚙️ Complete LAN configuration from app interface
 ⚔️ Duels and FFA tournaments
 🏆 Global tournament, with cutomizable points for each tournament
 👤 Players management
 🎯 Achievements
 🏅 Leaderboard for both players and teams

## Getting Started

This app can be used either using Docker or manually.

### Settings:

OOZTURN accepts the following settings, to set with environment variables:

| Environment variables | Usage | Default value |
| --------------------- | ----- | ------------- |
| NEW_USERS_BY_ADMIN | Only admins can register new users. This is ignored for the first account to be created. | true |
| AUTHENTICATION | A password is needed for the users to log-in | true |
| SECURE_PASSWORD | Users passwords must be of at least 8 character and contain:<br />- a lowercase<br />- an uppercase<br />- a number<br />- a special character | true |
| USE_HTTP_ONLY | Allow to use HTTP environment (useful for LANs for exemple) | false |
| NOTIFY_TOURNAMENT_CHANGE | Notify concerned users when a tournament gets an update | true |
| AUTO_REFRESH_TOURNAMENTS | Refresh tournaments list dynamically | true |
| AUTO_REFRESH_USERS | Refresh users list dynamically | true |
| ADMIN_PASSWORD | Admin password. This parameter is mandatory to enable the admin panel. Without it, admin pages can't be accessed. | empty |
| ALL_OPPONENTS_SCORE | Allow all opponents to score. can be "false", "duel_only", "true". | false |
| ASK_FOR_SEATS | Asks users to enter their seat. | true |
| ALLOW_EASY_LOGIN | Allow to list users on login page | false |

### Docker

You can run the following command to start your OOZTURN instance:

```
Docker run -p <PORT>:3000 -e ADMIN_PASSWORD=<PASSWORD> bug38/oozturn
```

If you want to access your DB from the host, or reuse an existing one, you can mount `/app/db`.

To access uploads (users avatars, tournament images, lan Map) you can mount `/app/uploads`.

### Manually

This app requires the LTS version of [NodeJS](https://nodejs.org). Then:

- Clone this repository and `cd` into it
- Install dependencies with `npm install`
- create a **.env** file and fill it with the required settings from above.
- To run the server in dev mode run `npm run dev`
- To run the server in production mode, build the application with `npm run build` then start the server with `npm run start`.
- Open http://localhost:3000 with your browser to see the app
- To access Admin panel after login, visit http://localhost:3000/admin

## Demo

Here is a [Demo](https://oozturn.bug38.com). This demo uses the Lan'Oween 2024 database.

## Used By

V1 was used for the Lan'Oween 2023 event, organized by the [Azerty team](https://www.team-azerty.com/).

V2 was used for the Lan'Oween 2024 event.

## Credits

This app uses a derivative of the [tournament-js](https://github.com/tournament-js) module written by [clux (Eirik A)](https://github.com/clux)

## License

[AGPL3](https://github.com/Oozturn/oozturn/blob/main/LICENSE)
