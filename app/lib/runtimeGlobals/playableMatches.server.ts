import { PlayableMatch, TournamentStatus } from "../tournamentEngine/types"

declare global {
    // eslint-disable-next-line no-var
    var playableMatches: PlayableMatch[]
}

export function getAllPlayableMatches() {
    if (!global.playableMatches) {
        updatePlayableMatches()
    }
    return global.playableMatches
}
export function getPlayableMatches(userId: string) {
    if (!global.playableMatches) {
        updatePlayableMatches()
    }
    return global.playableMatches.filter(match => match.concernedUserIds.includes(userId))
}

export function updatePlayableMatches() {
    const tournaments = global.tournaments.filter(tournament => tournament.getStatus() == TournamentStatus.Running)
    global.playableMatches = tournaments.flatMap(tournament => tournament.getMatches()
                                        .filter(match => match.opponents.every(o => o != undefined) && match.score.every(s => s == undefined))
                                        .map(match => {
        const opponentsAreTeams = tournament.getFullData().settings.useTeams
        const tournamentForfeits = tournament.getPlayers().filter(player => player.isForfeit).map(player => player.userId)
        const concerned = match.opponents.flatMap(opponent => opponentsAreTeams ? tournament.getTeams().filter(team => team.name == opponent)[0]?.members : opponent)
                                         .filter(player => (player != undefined) && !tournamentForfeits.includes(player)) as string[]
        return {
            tournamentId: tournament.getId(),
            bracket: match.bracket,
            matchId: match.id,
            opponents: match.opponents.map(opponent => opponent as string),
            concernedUserIds: concerned
        }}
    ))
}