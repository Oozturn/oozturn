import { GraphQLError } from "graphql";
import { StateRoot, StateTournament, getStateReadOnly } from "../persistence/state";


export function getPlayer(username: string, state: StateRoot = getStateReadOnly()) {
    const player = state.players.find(p => p.username == username)
    if (!player) {
        throw new GraphQLError(`Joueur "${player}" inconnu.`)
    }
    return player;
}

export function checkPlayer(username: string, state: StateRoot) {
    const player = state.players.find(p => p.username == username)
    if (!player) {
        throw new GraphQLError(`Joueur "${player}" inconnu.`)
    }
}

export function getTournament(tournamentId: string, state: StateRoot) {
    let tournament = state.tournaments.find(t => t.id == tournamentId)
    if (!tournament) {
        throw new GraphQLError(`Tournoi inconnu (id "${tournamentId}").`)
    }
    return tournament;
}

export function checkPlayerInTournament(username: string, tournament: StateTournament) {
    const player = tournament.players.find(p => p == username)
    if (!player) {
        throw new GraphQLError(`Joueur "${username}" non présent dans le tournoi ${tournament.name}.`)
    }
}