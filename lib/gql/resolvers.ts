import { GraphQLError } from "graphql"
import { IronSession } from "iron-session"
import { EditTournamentInput, Resolvers, TournamentStatus } from "../../__generated__/gql/types"
import { deleteOldAvatar, processAvatar } from "../image/image-processing"
import { logger } from "../logging/logging"
import { PlayerResult, StateLan, StatePlayer, StateTournament, TournamentTeam, BracketSeed, Bracket, getStateReadOnly as getStateCopy, doTransaction, DateType } from "../persistence/state"
import { IronUser } from "../session/config"
import { Match } from "../tournament/match"
import { Duel } from "../tournament/duel"
import { ResolveMatch, getBracketfromStorage, isAmbiguousScore, setScore, terminateTournament, userCanSetScore } from "../process/tournament-scoring-process"
import { addOrUpdateGame, removeGame, searchGame } from "../process/game-management-process"
import { checkPlayer, checkPlayerInTournament, getPlayer, getTournament } from "../process/access-object-process"
import { arrayMove } from "@dnd-kit/sortable"
import { range } from "../utils"



export const resolvers: Resolvers = {
    Query: {
        async lan() {
            return getStateCopy().lan
        },
        async me(_, __, context) {
            const session = context.req.session
            if (!session.user) {
                return null
            }
            const player = getPlayer(session.user.username)

            return {
                username: session.user.username,
                isAdmin: session.user.isAdmin,
                team: player.team,
                avatar: player.avatar,
                ip: player.ips[0]
            }
        },
        async players() {
            return getStateCopy().players
        },
        async tournaments() {
            const tournaments = getStateCopy().tournaments.map(tournament => {
                return {
                    id: tournament.id,
                    name: tournament.name,
                    game: tournament.game,
                    status: tournament.status,
                    startTime: tournament.startTime,
                    players: tournament.players
                }
            })
            return tournaments.sort(orderTournaments)
        },
        async tournament(_, { id: id }) {
            if (id == 'new') return null
            const tournament = getTournament(id, getStateCopy())

            // fill players
            const players = tournament.players.map(username => getPlayer(username))
            let matches: Match[] = []
            let results: PlayerResult[] = []
            if (tournament.status != TournamentStatus.Open) {
                let b = getBracketfromStorage(tournament.bracket)
                if (b) {
                    /** Get matches */
                    matches = b.matches
                    /** Apply score in progress to match */
                    matches.forEach(m => {
                        if (!m.m) {
                            let scoreInProgress = tournament.scoresInProgress[JSON.stringify(m.id)]
                            if (scoreInProgress) {
                                m.m = scoreInProgress
                            }
                        }
                    })
                    /** Get results */
                    b.results().map(r => {
                        const opponent = tournament.bracket.seeding?.find(s => s.nb == r.seed)?.opponent
                        if (opponent) {
                            if (!tournament.useTeams) {
                                results.push({ username: opponent, position: r.pos })
                            } else { // teams
                                tournament.teams?.find(t => t.name == opponent)?.players.forEach(p =>
                                    results.push({ username: p, position: r.pos })
                                );
                            }
                        }
                    })
                }
            }
            return {
                ...tournament,
                players: players,
                bracketProperties: {
                    type: tournament.bracket.type,
                    options: tournament.bracket.options,
                    seeding: tournament.bracket.seeding
                },
                matches: matches,
                results: tournament.bracket ? results : undefined
            }
        },
        async leaderboard() {            
            return getPlayersStats()
        },
        async achievements() {
            const achievements: {name: string, description: string, player: StatePlayer}[] = []

            const playersStats = getPlayersStats()

            if (!playersStats.length) return achievements

            /** For win/loss ratios, if draw, the winner is the one with more tournaments */
            achievements.push({
                name: "Le XXXXXX",
                description: 'Le prix XXXXXX est attribué au joueur qui a le meilleur ratio de victoires ! Mais pas forcément celui qui a le plus de points.',
                player: playersStats.sort((a,b) => a.wins/a.losses > b.wins/b.losses ? -1 : a.wins/a.losses < b.wins/b.losses ? 1 : a.tournaments > b.tournaments ? -1 : a.tournaments < b.tournaments ? 1 : 0)[0].player
            })
            achievements.push({
                name: "Le XXXXXX",
                description: 'Le prix XXXXXX est attribué au joueur qui a le pire ratio de victoires ! Mais pas forcément celui qui a le moins de points.',
                player: playersStats.sort((a,b) => a.wins/a.losses < b.wins/b.losses ? -1 : a.wins/a.losses > b.wins/b.losses ? 1 : a.tournaments > b.tournaments ? -1 : a.tournaments < b.tournaments ? 1 : 0)[0].player
            })
            achievements.push({
                name: "Le Napoléon",
                description: 'Le prix Napoléon est attribué au joueur qui, tel l’empereur, a réussi à revenir de son exil. C’est donc celui qui a remporté le plus de rencontres en looser bracket.',
                player: playersStats.sort((a,b) => a.LBwins > b.LBwins ? -1 : a.LBwins < b.LBwins ? 1 : 0)[0].player
            })
            achievements.push({
                name: "Le Drucker",
                description: 'Un prix spécial pour récompenser le joueur qui est toujours là ! Le prix va à celui qui a participé au plus de tournois.',
                player: playersStats.sort((a,b) => a.tournaments > b.tournaments ? -1 : a.tournaments < b.tournaments ? 1 : 0)[0].player
            })
            achievements.push({
                name: "Le Préféré",
                description: 'Un prix pour le joueur préféré de l’équipe OOZTURN. La méthode de désignation restera secrète ;)',
                player: playersStats.sort((a,b) => {
                    function score(p: {player: StatePlayer, points: number, wins: number, losses: number, LBwins: number, secondPlaces: number, tournaments: number }) {
                        let result = 0
                        for (let index = 0; index < p.player.username.length; index++) {
                            result *= p.player.username.charCodeAt(index)
                        }
                        result += p.points
                        result += p.wins*(p.losses + p.LBwins)
                        result /= p.secondPlaces + 1
                        result -= p.tournaments
                        return result % 42
                    }
                    const ascore = score(a), bscore = score(b);
                    return ascore < bscore ? -1 : ascore > bscore ? 1 : 0
                })[0].player
            })
            achievements.push({
                name: "Le Poulidor",
                description: 'Le Poulidor est le joueur qui arrive le plus souvent second.',
                player: playersStats.sort((a,b) => a.secondPlaces > b.secondPlaces ? -1 : a.secondPlaces < b.secondPlaces ? 1 : 0)[0].player
            })
            
            return achievements
        },
        async games() {
            return [...getStateCopy().games, {id: -1, name: "Jeu générique", platforms: [0], cover:"", picture: ""}]
        },
        async igdbGames(_, { searchCriteria: searchCriteria, idToSearch: idToSearch }, { req: {logger, session}}) {
            checkUserLoggedin(session);
            checkUserIsAdmin(session);
            return await searchGame(searchCriteria, idToSearch)
        }
    },
    Mutation: {
        async login(_, { username: rawUsername }, { req: { logger, session, socket } }) {
            const username = rawUsername.trim()

            if (username.length == 0) {
                logger.warn(`Someone tried to log-in with empty username.`)
                throw new GraphQLError("Nom d'utilisateur requis.")
            }

            if (username.length > 15) {
                logger.warn(`Someone tried to log-in with a too long username: ${username}`)
                throw new GraphQLError("Nom d'utilisateur trop long (15 caratères max.)")
            }

            const playername = await doTransaction(state => {
                let player = state.players.find(player => player.username.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '') == username.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, ''))
                    || { username: username, isAdmin: false, ips: [], avatar: "", team: "" }
                addIpToPlayer(player, socket)

                if (!state.players.find(p => p.username == player.username)) {
                    state.players.push(player)
                }

                return player.username
            })

            session.user = {
                username: playername,
                isAdmin: false
            }

            logger.info({ username: playername }, `${playername} logged in`)

            await session.save()
            return session.user
        },
        async adminElevation(_, { password: rawPassword }, { req: { logger, session } }) {
            checkUserLoggedin(session)

            const password = rawPassword.trim()
            if (!password || password != process.env.ADMIN_PASSWORD) {
                logger.warn(`${session.user?.username} tried to get admin rights with wrong password`)
                throw new GraphQLError("Mauvais mot de passe.")
            }

            session.user = { ...session.user, isAdmin: true }

            await doTransaction(async state => {
                let player = state.players.find(player => player.username == session.user?.username)
                if (player) {
                    player.isAdmin = true
                    logger.info(`${player.username} got admin rights`)
                    await session.save()
                } else {
                    logger.warn(`${session.user?.username} tried to get admin rights`)
                }
            })

            return session.user
        },
        async updateLan(_, { lan }, { req: { logger, session } }) {
            checkUserLoggedin(session);
            checkUserIsAdmin(session);

            return await doTransaction(async state => {
                state.lan = { ...state.lan, ...lan as StateLan }
                return state.lan
            })
        },
        async editTournament(_, { input }, { req: { logger, session } }) {
            checkUserLoggedin(session);
            checkUserIsAdmin(session);

            return await doTransaction(state => {
                const tournament = input
                let existingTournament = state.tournaments.find(t => t.id == tournament.id)
                let editedTournament = {}

                if (existingTournament) {
                    editedTournament = { ...existingTournament, ...(tournament.bracketProperties ? editTournamentInputToPartialStateTournament(tournament) : tournament) }
                    logger.info(editedTournament)
                    state.tournaments.splice(state.tournaments.indexOf(existingTournament), 1, editedTournament as StateTournament)
                    logger.info(`Tournament ${tournament.id} modified.`)
                } else {
                    state.tournaments.push(editTournamentInputToFullStateTournament(tournament))
                    logger.info(`Tournament ${tournament.id} created.`)
                }
                
                return tournament.id
            })
        },
        async startTournament(_, { id: tournamentId }, { req: { logger, session } }) {
            checkUserLoggedin(session);
            checkUserIsAdmin(session);

            return await doTransaction(state => {
                const tournament = getTournament(tournamentId, state)
                if (tournament.status == TournamentStatus.Running || tournament.status == TournamentStatus.Done) {
                    throw new GraphQLError(`Tournoi "${tournament.name}" ${tournament.status == TournamentStatus.Running ? "déjà démarré" : "terminé"}.`)
                }
                if (tournament.status == TournamentStatus.Paused) {
                    tournament.status = TournamentStatus.Running
                    logger.info(`Tournament ${tournament.id} resumed.`)
                    return tournamentId
                }
                checkTournamentCanStart(tournament)
                const opponents = (tournament.useTeams && tournament.teams) ? tournament.teams.filter(team => team.players.length > 0).map(t => t.name) : tournament.players
                tournament.teams = tournament.teams?.filter(team => team.players.length > 0)
                tournament.bracket.seeding = opponents.map((o, i) => <BracketSeed>{ nb: i + 1, opponent: o })
                tournament.bracket.state = []
                tournament.status = TournamentStatus.Running
                tournament.scoresInProgress = {}
                return tournamentId
            })
        },
        async stopTournament(_, { id: tournamentId }, { req: { logger, session } }) {
            checkUserLoggedin(session);
            checkUserIsAdmin(session);
            
            return await doTransaction(state => {
                const tournament = getTournament(tournamentId, state)
                if (tournament.status == TournamentStatus.Running) {
                    tournament.status = TournamentStatus.Paused
                    logger.info(`Tournament ${tournamentId} suspended`)
                }
                else if (tournament.status == TournamentStatus.Paused) {
                    tournament.status = TournamentStatus.Open
                    logger.info(`Tournament ${tournamentId} stopped`)
                }
                /// Don't delete bracket here :
                /// If the tournament abort was an error, an admin could always restart it by editting DB file directly.
                /// If it was not an error, bracket will be overwritten at tournament restart
                return tournamentId
            })
        },
        async validateTournament(_, { id: tournamentId }, { req: { logger, session } }) {
            checkUserLoggedin(session);
            checkUserIsAdmin(session);

            if (await terminateTournament(tournamentId, logger, session))
                logger.info(`Tournament ${tournamentId} validated and now done`)
            else
                throw new GraphQLError(`Impossible de valider le tournoi (id "${tournamentId}").`)

            return tournamentId
        },
        async balanceTournament(_, { id: tournamentId }, { req: { logger, session } }) {
            checkUserLoggedin(session);
            checkUserIsAdmin(session);
            
            return await doTransaction(state => {
                const tournament = getTournament(tournamentId, state)
                if (tournament.status == TournamentStatus.Open) {
                    tournament.status = TournamentStatus.Balancing
                    logger.info(`Tournament ${tournamentId} ready to balance`)
                }
                else if (tournament.status == TournamentStatus.Balancing) {
                    tournament.status = TournamentStatus.Open
                    logger.info(`Tournament ${tournamentId} is open to players again`)
                }
                return tournamentId
            })
        },
        async removeTournament(_, { id: tournamentId }, { req: { logger, session } }) {
            checkUserLoggedin(session);
            checkUserIsAdmin(session);

            return await doTransaction(state => {
                const index = state.tournaments.findIndex(t => t.id == tournamentId)
                if (index != -1) {
                    state.tournaments.splice(index, 1);
                    logger.info(`Tournament ${tournamentId} deleted`)
                    return tournamentId
                } else {
                    throw new GraphQLError(`Tournoi inconnu (id "${tournamentId}").`)
                }
            })
        },
        async addPlayerToTournament(_, { tournamentId, player }, { req: { logger } }) {
            await doTransaction(state => {
                checkPlayer(player, state)
                const tournament = getTournament(tournamentId, state)
                if (tournament.players.find(p => p == player)) {
                    throw new GraphQLError(`Joueur "${player}" déjà dans le tournoi ${tournament.name}`)
                }
                tournament.players.push(player)
                logger.info(`Added player ${player} to tournament ${tournamentId}`)
            })
            return "Success"
        },
        async removePlayerFromTournament(_, { tournamentId, player }, { req: { logger } }) {
            await doTransaction(state => {
                checkPlayer(player, state)
                const tournament = getTournament(tournamentId, state)
                checkPlayerInTournament(player, tournament)
                tournament.players.splice(tournament.players.findIndex(p => p == player), 1)
                if (tournament.teams) {
                    tournament.teams.forEach(t => {
                        if(t.players.includes(player))
                            t.players.splice(t.players.findIndex(p => p == player), 1)
                    })
                }
                logger.info(`Removed player ${player} from tournament ${tournamentId}`)
            })
            return "Success"
        },
        async movePlayer(_, { tournamentId, player, newIndex }, { req: { logger, session } }) {
            await doTransaction(state => {
                checkUserIsAdmin(session)
                checkPlayer(player, state)
                const tournament = getTournament(tournamentId, state)
                checkPlayerInTournament(player, tournament)
                const oldIndex = tournament.players.findIndex(p => p == player)
                tournament.players = arrayMove(tournament.players, oldIndex, newIndex);
                logger.info(`Moved player ${player} in tournament ${tournamentId}`)
            })
            return ""
        },
        async moveTeam(_, { tournamentId, team, newIndex }, { req: { logger, session } }) {
            await doTransaction(state => {
                checkUserIsAdmin(session)
                const tournament = getTournament(tournamentId, state)
                if (!tournament.teams?.find(t => t.name == team))
                    throw new GraphQLError(`L'équipe ${team} n'existe pas dans le tournoi ${tournament.name}.`)
                const oldIndex = tournament.teams?.findIndex(t => t.name == team)
                tournament.teams = arrayMove(tournament.teams, oldIndex, newIndex);
                logger.info(`Moved team ${team} in tournament ${tournamentId}`)
            })
            return ""
        },
        async newTournamentTeam(_, { tournamentId, teamName }, { req: { logger, session } }) {
            checkUserLoggedin(session);
            await doTransaction(state => {
                const tournament = getTournament(tournamentId, state)
                if (!tournament.teams)
                    tournament.teams = []
                if (tournament.teams.map(t => t.name).includes(teamName))
                    throw new GraphQLError(`L'équipe ${teamName} existe déjà dans le tournoi ${tournament.name}.`)
                tournament.teams.push({name: teamName, players: []})
            })
            logger.info(`New team "${teamName}" in tournament ${tournamentId}`)
            return "Success"
        },
        async removeTournamentTeam(_, { tournamentId, teamName }, { req: { logger, session } }) {
            checkUserLoggedin(session);
            await doTransaction(state => {
                const tournament = getTournament(tournamentId, state)
                if (!tournament.teams?.find(t => t.name == teamName))
                    throw new GraphQLError(`L'équipe ${teamName} n'existe pas dans le tournoi ${tournament.name}.`)
                tournament.teams.splice(tournament.teams.findIndex(t => t.name == teamName), 1)
            })
            logger.info(`Removed team "${teamName}" from tournament ${tournamentId}`)
            return "Success"
        },
        async renameTournamentTeam(_, { tournamentId, oldTeamName, newTeamName }, { req: { logger, session } }) {
            checkUserLoggedin(session);
            await doTransaction(state => {
                const tournament = getTournament(tournamentId, state)
                const team = tournament.teams?.find(t => t.name == oldTeamName)
                if (!team)
                    throw new GraphQLError(`L'équipe ${oldTeamName} n'existe pas dans le tournoi ${tournament.name}.`)
                team.name = newTeamName
            })
            logger.info(`Renamed team "${oldTeamName}" to "${newTeamName}" in tournament ${tournamentId}`)
            return "Success"
        },
        async addPlayersToTeam(_, { tournamentId, teamName, players }, { req: { logger, session } }) {
            checkUserLoggedin(session);
            await doTransaction(state => {
                const tournament = getTournament(tournamentId, state)
                const team = tournament.teams?.find(t => t.name == teamName)
                if (!team)
                    throw new GraphQLError(`L'équipe ${teamName} n'existe pas dans le tournoi ${tournament.name}.`)
                players.forEach(playername => {
                    removePlayerFromTournamentTeams(tournament, playername)
                    team.players.push(playername)
                })
            })
            logger.info(`Added players to team "${teamName}" in tournament ${tournamentId}`)
            return "Success"
        },
        async removePlayersFromTeam(_, { tournamentId, players }, { req: { logger, session } }) {
            checkUserLoggedin(session);
            await doTransaction(state => {
                const tournament = getTournament(tournamentId, state)
                players.forEach(playername => {
                    removePlayerFromTournamentTeams(tournament, playername)
                })
            })
            logger.info(`Removed players from their team in tournament ${tournamentId}`)
            return "Success"
        },
        async updateProfile(_, { avatarFile, team, removeAvatar }, {req: { logger, session } }) {
            checkUserLoggedin(session)
            return await doTransaction(async state => {
                const player = getPlayer(session.user.username, state)
                if (team != null) {
                    player.team = team
                }
                if (avatarFile) {
                    const newImage = await processAvatar(avatarFile)
                    if (player.avatar) {
                        deleteOldAvatar(player.avatar)
                    }
                    player.avatar = newImage
                }
                if (removeAvatar) {
                    if(player.avatar) {
                        deleteOldAvatar(player.avatar)
                    }
                    player.avatar = ""
                }
    
                logger.info(`Updated user ${player.username} profile`)

                return player
            })
        },
        async forfeitOpponentFromTournament(_, { tournamentId, opponent }, { req: { logger, session } }) {
            const needsToResolveMatches = await doTransaction(state => {
                const tournament = getTournament(tournamentId, state)
                const opponentSeed = tournament.bracket.seeding?.find(o => o.opponent == opponent)?.nb
                if (!opponentSeed) {
                    throw new GraphQLError(`Opposant ${opponent} non présent dans le tournoi ${tournament.name}.`)
                }
                if (!tournament.forfeitOpponents) tournament.forfeitOpponents = []
                // already ff players can come back
                if (tournament.forfeitOpponents.includes(opponent)) {
                    logger.info(`Restored opponent ${opponent} in tournament ${tournamentId}`)
                    tournament.forfeitOpponents.splice(tournament.forfeitOpponents.findIndex(o => o == opponent), 1)
                } else {
                    logger.info(`Forfeit opponent ${opponent} for tournament ${tournamentId}`)
                    tournament.forfeitOpponents.push(opponent)
                    return true
                }
                return false
            })
            if (needsToResolveMatches) {
                const state = getStateCopy()
                const tournament = getTournament(tournamentId, state)
                const opponentSeed = tournament.bracket.seeding?.find(o => o.opponent == opponent)?.nb
                if (!opponentSeed) {
                    throw new GraphQLError(`Opposant ${opponent} non présent dans le tournoi ${tournament.name}.`)
                }
                // find all matches involving player, and check if they can be finished
                const bracket = getBracketfromStorage(tournament.bracket)
                const matchesToCheck = bracket?.matchesFor(opponentSeed)
                // Check all but done matches
                matchesToCheck?.forEach(match => (match.m == undefined) && ResolveMatch(tournamentId, match.id, logger, session))
            }
            return "Success"
        },
        async setScore(_, { tournamentId, matchId, player, score }, { req: { logger, session } }) {
            checkUserLoggedin(session)
            let state = getStateCopy()
            if (userIsAdmin(session) || userCanSetScore(state, session.user!!.username, tournamentId, matchId, player)) {
                if (isAmbiguousScore(state, tournamentId, matchId, player, score))
                    throw new GraphQLError(`Impossible d'appliquer un score ambigü empêchant de déterminer les qualifiés.`)
                if (!(await setScore(tournamentId, matchId, player, score, logger, session))) {
                    // setScore returns true if score has been applied directly, else false
                    ResolveMatch(tournamentId, matchId, logger, session)
                }
            } else {
                throw new GraphQLError("Impossible d'appliquer le score")
            }
            return ""
        },
        async setGame(_, { id, name, cover, picture, platforms, release }, { req: { logger, session } }) {
            checkUserLoggedin(session)
            checkUserIsAdmin(session)

           return await addOrUpdateGame(id, name, cover, picture, platforms, release, logger)
        },
        async removeGame(_, { id }, { req: { logger, session } }) {
            checkUserLoggedin(session)
            checkUserIsAdmin(session)

           return removeGame(id)
        }
    }
}

function userIsAdmin(session: IronSession) {
    return session.user?.isAdmin
}

function checkUserLoggedin(session: IronSession): asserts session is (IronSession & { user: IronUser }) {
    if (!session.user) {
        throw new GraphQLError("Joueur non connecté")
    }
}

function checkUserIsAdmin(session: IronSession) {
    if (!session.user?.isAdmin) {
        throw new GraphQLError("Tu n'es pas admin")
    }
}

function checkTournamentCanStart(tournament: StateTournament) {
    const useTeams = tournament.useTeams
    const nbTeams = tournament.teams?.filter(team => team.players.length).length || 0
    const nbPlayers = tournament.players.length
    const isFFA = tournament.bracket.type == 'FFA'
    if (tournament.bracket.options.short == true || isFFA) {
        if ((useTeams ? nbTeams : nbPlayers) < 2)
            throw new GraphQLError(`Impossible de démarrer le tournoi "${tournament.name}". 2 ${useTeams ? "équipes requises" : "joueurs requis"}${isFFA ? '' : ' en tournois courts'}.`)
    } else {
        if ((useTeams ? nbTeams : nbPlayers) < 4)
            throw new GraphQLError(`Impossible de démarrer le tournoi "${tournament.name}". 4 ${useTeams ? "équipes requises" : "joueurs requis"}.`)
    }
}

function removePlayerFromTournamentTeams(tournament: StateTournament, playername: string) {
    const team = tournament.teams?.find(t => t.players.includes(playername))
    team && team?.players.splice(team.players.findIndex(p => p == playername), 1)
}

function addIpToPlayer(player: StatePlayer, socket: any) {
    let ip: string = socket.remoteAddress as unknown as string
    if (!ip) {
        return
    }
    ip = ip.replace(/^.*:/, '')
    if (player.ips.find(it => it == ip)) {
        player.ips.splice(player.ips.indexOf(ip), 1);
    }
    player.ips.push(ip)
}

const editTournamentInputToPartialStateTournament = ({ bracketProperties, ...other }: EditTournamentInput) => ({ bracket: bracketProperties, ...other })

function editTournamentInputToFullStateTournament(t: EditTournamentInput): StateTournament {
    const gamesList = getStateCopy().games
    return {
        id: t.id,
        name: t.name || gamesList.find(g => g.id == t.game)?.name || "générique",
        game: t.game || gamesList[0].id,
        bracket: {
            type: t.bracketProperties?.type || 'Duel',
            options: {
                last: t.bracketProperties?.type == 'FFA' ? undefined : t.bracketProperties?.options.last || Duel.WB,
                short: t.bracketProperties?.type == 'FFA' ? undefined : t.bracketProperties?.options.short || false,
                lowerScoreIsBetter: t.bracketProperties?.options.lowerScoreIsBetter || false,
                sizes: t.bracketProperties?.type == 'FFA' ? t.bracketProperties?.options.sizes || [] : undefined,
                advancers: t.bracketProperties?.type == 'FFA' ? t.bracketProperties?.options.advancers || [] : undefined,
                limit: t.bracketProperties?.type == 'FFA' ? t.bracketProperties?.options.limit || 1 : undefined,
            }
        },
        status: TournamentStatus.Open,
        players: [],
        useTeams: t.useTeams || false,
        usersCanCreateTeams: t.usersCanCreateTeams || false,
        teamsMaxSize: t.teamsMaxSize || undefined,
        startTime: t.startTime || {"day":5, "hour": 18, "min": 0},
        globalTournamentSettings: t.globalTournamentSettings || getStateCopy().lan.defaultTournamentSettings,
        comments: t.comments || "",
        scoresInProgress: {}
    }
}

function orderTournaments(a: {status: TournamentStatus, startTime: DateType}, b: {status: TournamentStatus, startTime: DateType}) {
    const lanDays = [...range(getStateCopy().lan.startDate.day, 6, 1), ...range(0, getStateCopy().lan.endDate.day, 1)]
    if (a.status != TournamentStatus.Done && b.status == TournamentStatus.Done) return -1
    if (a.status == TournamentStatus.Done && b.status != TournamentStatus.Done) return 1
    if (lanDays.indexOf(a.startTime.day) < lanDays.indexOf(b.startTime.day)) return -1
    if (lanDays.indexOf(a.startTime.day) > lanDays.indexOf(b.startTime.day)) return 1
    if (a.startTime.hour < b.startTime.hour) return -1
    if (a.startTime.hour > b.startTime.hour) return 1
    return 0
}

function getPlayersStats() {
    const partialResults = getStateCopy().lan.partialResults == true
    const tournaments = getStateCopy().tournaments.filter(tournament => partialResults ? ['DONE', 'PAUSED', 'RUNNING'].includes(tournament.status) : tournament.status == 'DONE')

    const playersStats: {player: StatePlayer, points: number, wins: number, losses: number, LBwins: number, secondPlaces: number, tournaments: number}[] = []
    function createStat({player, points, wins, losses, LBwins, secondPlaces, tournaments}:{player: string, points?: number, wins?: number, losses?: number, LBwins?: number, secondPlaces?: number, tournaments?: number}) {
        if (playersStats.find(stat => stat.player.username == player)) return
        playersStats.push({player: getPlayer(player), points: points || 0, wins: wins || 0, losses: losses || 0, LBwins: LBwins || 0, secondPlaces: secondPlaces || 0, tournaments: tournaments || 0})
    }
    tournaments.forEach(tournament => {
        /** Points */
        const rules = tournament.globalTournamentSettings
        tournament.results?.map(result => {
            // Tournament cutom rules ?
            let pointsToAdd = rules.leaders[result.position - 1] || rules.default
            // Remove points if FF
            if (tournament.forfeitOpponents?.includes(result.username))
                pointsToAdd -= rules.default
            const index = playersStats.findIndex(entry => entry.player.username == result.username)
            if (index > -1) {
                playersStats[index].points += pointsToAdd
            } else {
                createStat({player: result.username, points: pointsToAdd})
            }
        })
        
        /** Win/loss ratio and LB wins */
        function getOpponent(seed: number) {
            return tournament.bracket.seeding?.find(s => s.nb == seed)?.opponent
        }
        function updateOpponentWinLoss(opponent: string, haswon: boolean, isLBmatch: boolean) {
            function updatePlayerWinLoss(player: string, haswon: boolean, isLBmatch: boolean) {
                const index = playersStats.findIndex(entry => entry.player.username == player)
                if (index > -1) {
                    haswon ? playersStats[index].wins += 1 : playersStats[index].losses += 1;
                    (haswon && isLBmatch) ? playersStats[index].LBwins += 1 : null
                }
                else {
                    createStat({player: player, wins: haswon ? 1 : 0, losses: haswon ? 0 : 1, LBwins: (haswon && isLBmatch) ? 1 : 0})
                }
            }
            if (tournament.useTeams) {
                tournament.teams?.find(team => team.name == opponent)?.players.forEach(player => updatePlayerWinLoss(player, haswon, isLBmatch))
            } else {
                updatePlayerWinLoss(opponent, haswon, isLBmatch)
            }
        }
        const tmatches = getBracketfromStorage(tournament.bracket)?.matches
        tmatches?.forEach(match => match.p.forEach((opponent, index) => {
            if (!match) return
            if (!match.m) return
            const position = match.m.findIndex(score => (match.m as number[])[index] == score) + 1
            if (position != 0) {
                const haswon = tournament.bracket.type == 'Duel' ?
                    position == 1
                    :
                    (match.id.s == 1 && tournament.bracket.options.advancers) ?
                        position <= tournament.bracket.options.advancers[match.id.r - 1]
                        :
                        false
                getOpponent(opponent) && updateOpponentWinLoss(getOpponent(opponent) as string, haswon, tournament.bracket.options.last == Duel.LB && match.id.s == 2)
            }
        }))
        
        /** Nb tournaments */
        tournament.players.forEach(player => {
            const index = playersStats.findIndex(entry => entry.player.username == player)
            if (index > -1) {
                playersStats[index].tournaments += 1
            }
            else {
                createStat({player: player, tournaments: 1})
            }
        })
        /** Second place */
        tournament.results?.forEach(result => {
            if (result.position != 2) return
            const index = playersStats.findIndex(entry => entry.player.username == result.username)
            if (index > -1) {
                playersStats[index].secondPlaces += 1
            }
            else {
                createStat({player: result.username, secondPlaces: 1})
            }
        })
    })
    return playersStats
}