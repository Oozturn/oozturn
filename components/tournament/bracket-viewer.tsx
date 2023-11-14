import { FFA } from "ffa"
import { useMe, usePlayers } from "../../lib/hooks"
import { BracketProperties, SetScoreMutation, SetScoreMutationVariables, MatchId as Id, Match, Player, Tournament, TournamentStatus, MatchId } from "../../__generated__/gql/types"
import { SET_SCORE_MUTATION, GET_TOURNAMENTS_QUERY } from "../../lib/gql/operations/operations"
import { client } from "../../lib/gql/client"
import { mutate } from "swr"
import { Duel } from "../../lib/tournament/duel"
import { BaseSyntheticEvent, Dispatch, SetStateAction, useCallback, useEffect, useMemo, useState } from "react"
import { debounce } from "lodash"
import { isClientError } from "../../lib/gql/error/error"

interface BracketViewerProps {
    tournament: Tournament
    setterOpponentToShowInfo: Dispatch<SetStateAction<string>>
  }

export default function BracketViewer({tournament, setterOpponentToShowInfo}: BracketViewerProps) {
    if (tournament.bracketProperties.type == "Duel") {
        return DuelViewer(tournament, setterOpponentToShowInfo)
    }
    if (tournament.bracketProperties.type == "FFA") {
        return FFAViewer(tournament, setterOpponentToShowInfo)
    }
    
    return null
}

function idToString(id: Id) {
    return Object.entries(id).map(v => v[1]).join('.')
}

interface ScoreInputProp {
    tournamentId: string
    matchId: MatchId
    player: number
    score?: number | null
}

function ScoreInput({ tournamentId, matchId, player, score }: ScoreInputProp) {
    const [value, setValue] = useState<string>(score?.toString() || "")

    const applyScore = useCallback(async (value: number) => {
        try {
            await client.unsafeRequest<SetScoreMutation, SetScoreMutationVariables>(SET_SCORE_MUTATION, {
                tournamentId: tournamentId,
                matchId: matchId,
                player: player,
                score: value
                })
            await mutate(GET_TOURNAMENTS_QUERY)
        } catch (error) {
            setValue(score?.toString() || "")
            return;
        }
    }, [matchId, player, tournamentId, score])

    const applyScoreWithDelay = useMemo(() => debounce(applyScore, 1000), [applyScore]);

    const handleOnInput = useMemo(() => async (e: React.ChangeEvent<HTMLInputElement & HTMLTextAreaElement>) => {
        setValue(e.target.value)
        if (!e.target.value || Number.isNaN(parseInt(e.target.value))) {
            return;
        }
        await applyScoreWithDelay(parseInt(e.target.value))
    }, [applyScoreWithDelay]);

    return (
        <input className="playerScore" type="number" min="0"
            value={value} onInput={handleOnInput}/>
    )
}

function getMatchPlayers(match: Match, tournament: Tournament) {
    const matchPlayers: string[] = []
    match.p.map(pMatch => {
        let opponent : string | undefined
        tournament.useTeams ?
            opponent = tournament.teams?.find(t => t?.name == tournament.bracketProperties.seeding?.find(ps => ps.nb == pMatch)?.opponent)?.name
            :
            opponent = tournament.players.find(p => p.username == tournament.bracketProperties.seeding?.find(ps => ps.nb == pMatch)?.opponent)?.username
        opponent != undefined && matchPlayers.push(opponent)
    })
    return matchPlayers
}

{/** seat is either 0 or 1, depending the player being the top or bottom one */}
function getPreviousDuelMatchIds(duelStructure: Duel) {
    
    const previousMatches : {id: string, parents: {id: string, from: string}[]}[] = []

    duelStructure.matches.forEach(match => {
        const right = duelStructure.right(match.id)
        const down = duelStructure.down(match.id)
        if (right) {
            const index = previousMatches.findIndex(prevmatch => prevmatch.id == idToString(right[0]))
            if (index == -1) {
                const parents = [{id: "", from: "win"}, {id: "", from: "win"}]
                parents[right[1]] = {id: idToString(match.id), from: "win"}
                previousMatches.push({id: idToString(right[0]), parents: parents})
            }
            else
                previousMatches[index].parents[right[1]] = {id: idToString(match.id), from: "win"}
        }
        if (down) {
            const index = previousMatches.findIndex(prevmatch => prevmatch.id == idToString(down[0]))
            if (index == -1) {
                const parents = [{id: "", from: "loss"}, {id: "", from: "loss"}]
                parents[down[1]] = {id: idToString(match.id), from: "loss"}
                previousMatches.push({id: idToString(down[0]), parents: parents})
            }
            else
                previousMatches[index].parents[down[1]] = {id: idToString(match.id), from: "loss"}
        }
    })
    
    return previousMatches
}

function getEditableMatches(duelStructure: Duel, tournament: Tournament) {
    const lockedMatches: string[] = []
    duelStructure.matches.forEach(match => {
        const parents = [duelStructure.right(match.id), duelStructure.down(match.id)]
        parents.forEach(parent => {
            if (parent) {
                const p_id = idToString(parent[0])
                const m = tournament.matches?.find(tmatch => idToString(tmatch.id) == p_id)
                if (m?.m && !m?.p.includes(-1)) {
                    lockedMatches.push(idToString(match.id))
                }
            }
        })
    })
    return duelStructure.matches.map(m => !lockedMatches.includes(idToString(m.id)) && idToString(m.id))
}


interface MatchViewerProp {
    match: Match
    tournament: Tournament
    matchPrecedences?: {id: string, parents: {id: string, from: string}[]}[]
    finals?: string[]
    isEditable?: boolean
    setterOpponentToShowInfo: Dispatch<SetStateAction<string>>
}

function MatchViewer({match, tournament, matchPrecedences, finals, isEditable, setterOpponentToShowInfo}: MatchViewerProp) {
    const { data: meResult, error: meError } = useMe()
    const user = meResult?.me
    const userOpponent = user ? (tournament.useTeams ? tournament.teams?.find(t => t.players.includes(user.username))?.name || "" : user.username) : ""
    
    const isFFAmatch = tournament.bracketProperties.type == 'FFA'
    isEditable = isEditable == false ? false : true

    const places : (number | string)[] = []
    if (isFFAmatch && match.m && !match.m.includes(null)) {

        let opponentAndScore: {opponent: number, score: number}[] = []
        match.m.forEach((_, index) => {
            opponentAndScore.push({opponent: match.p[index], score: match.m ? match.m[index] || 0 : 0 })
        })
        opponentAndScore.sort((a, b) => {
            if (tournament.bracketProperties.options.lowerScoreIsBetter) {
                return a.score > b.score ? 1 : -1
            } 
            return a.score > b.score ? -1 : 1
        })

        match.m = opponentAndScore.map(oas => oas.score)
        match.p = opponentAndScore.map(oas => oas.opponent)
        opponentAndScore.forEach(oas => match.m && places.push(match.m.findIndex(m => m == oas.score) + 1))
    }

    const matchPlayers = getMatchPlayers(match, tournament)
    const matchParents = matchPrecedences?.find(mp => mp.id == idToString(match.id))?.parents
    const ffmatch = match.p.includes(-1)
    const isReady = !ffmatch && matchPlayers.length == match.p.length
    const scoreLines = match.p.map((player, index) => {
        return {
            seed:player,
            playername:matchPlayers[index],
            matchParent:matchParents?.[index],
            scoreValue:match?.m?.[index],
            place:places[index]
        }
    })

    const secondFinalText = () => {
        if (finals?.includes(idToString(match.id)) && matchParents) {
            const player = tournament.matches?.find(m => idToString(m.id) == matchParents[0].id)?.p[1]
            if (player == 0)
                return " le gagnant de " + matchPrecedences?.find(mp => mp.id == matchParents[1].id)?.parents[1].id
            return tournament.bracketProperties.seeding?.find(s => s.nb == player)?.opponent
        }
    }

    function isAllowToEdit(opponent: string) {
        if (!user) return false
        if (tournament.forfeitOpponents?.includes(opponent)) return false
        if ([TournamentStatus.Open, TournamentStatus.Balancing, TournamentStatus.Done].includes(tournament.status)) return false
        if (user.isAdmin) {
            if ([TournamentStatus.Running, TournamentStatus.Paused, TournamentStatus.Validating].includes(tournament.status))
                return true
        }
        if (tournament.status != TournamentStatus.Running) return false
        if (!tournament.useTeams && user.username == opponent) return true
        if (tournament.teams?.find(team => team?.name == opponent)?.players.includes(user.username)) return true
        return false
    }

    function highlightOpponent(opponent: string) {
        document.querySelectorAll(".opponent_"+opponent.replace(RegExp("[^a-zA-Z0-9]", "g"), "_")).forEach(item =>
            item.classList.add("highlightOpponent"))
        setterOpponentToShowInfo(opponent)
        if (!user) return
        if (opponent.replace(RegExp("[^a-zA-Z0-9]", "g"), "_") == userOpponent.replace(RegExp("[^a-zA-Z0-9]", "g"), "_")) return
        document.querySelectorAll(".opponent_"+userOpponent.replace(RegExp("[^a-zA-Z0-9]", "g"), "_")).forEach(item =>
            item.classList.remove("highlightOpponent"))
    }
    function revertHighlightOpponent(opponent: string) {
        document.querySelectorAll(".opponent_"+opponent.replace(RegExp("[^a-zA-Z0-9]", "g"), "_")).forEach(item =>
            item.classList.remove("highlightOpponent"))
        setterOpponentToShowInfo("")
        if (!user) return
        if (opponent.replace(RegExp("[^a-zA-Z0-9]", "g"), "_") == userOpponent.replace(RegExp("[^a-zA-Z0-9]","g"), "_")) return
        document.querySelectorAll(".opponent_"+userOpponent.replace(RegExp("[^a-zA-Z0-9]", "g"), "_")).forEach(item =>
            item.classList.add("highlightOpponent"))
    }

    return (
        <div key={idToString(match.id)} className="match m-1">
            <div className="match-id p-0 m-0">{idToString(match.id)}</div>
            <div className={`opponentsView ${isFFAmatch ? 'FFA' : 'Duel'} ${finals?.includes(idToString(match.id)) ? 'finale' : ""}`}>
                {finals?.includes(idToString(match.id)) && (
                    finals[0] == idToString(match.id) ?
                        <div className="final-title is-title medium">Finale</div>
                        :
                        <>
                            <div className="final-title is-title">2<sup className="is-size-7"> nde</sup> Manche</div>
                            {tournament.status != TournamentStatus.Done && <div className="final-desc is-size-7">Optionnelle, se produit si {secondFinalText()} gagne la manche précédente</div>}
                        </>
                )}
                {isFFAmatch &&
                    <div className="playerLine is-flex fade-text">
                        <div className="playerName">{tournament.useTeams ? "Équipes" : "Joueurs"}</div>
                        <div className="playerScore">Score</div>
                        <div className="playerPosition">Place</div>
                    </div>}
                {scoreLines.map((scoreLine, i) =>
                    <div key={idToString(match.id) + '-' + scoreLine.seed + '-' + i} className={`playerLine opponent_${(scoreLine.playername || "").replace(RegExp("[^a-zA-Z0-9]", "g"), "_")} ${userOpponent == scoreLine.playername ? "highlightOpponent" : ""}`} onMouseEnter={() => scoreLine.playername && highlightOpponent(scoreLine.playername)} onMouseLeave={() => scoreLine.playername && revertHighlightOpponent(scoreLine.playername)}>
                        {scoreLine.playername ?
                            <div className={`playerName is-unselectable`}>{scoreLine.playername}</div>
                            :
                            <div className="playerName fade-text" title={(scoreLine.seed == 0) && scoreLine.matchParent && ((scoreLine.matchParent.from == "win" ? "Gagnant" : "Perdant") + " de " + scoreLine.matchParent.id) || ""}>{(scoreLine.seed == 0) && scoreLine.matchParent && ((scoreLine.matchParent.from == "win" ? "Gagnant" : "Perdant") + " de " + scoreLine.matchParent.id)}</div>
                        }
                        {isReady ?
                            isAllowToEdit(scoreLine.playername) ?
                                <ScoreInput tournamentId={tournament.id} matchId={match.id} player={scoreLine.seed} score={scoreLine.scoreValue} />
                                :
                                <div className="playerScore">{tournament.forfeitOpponents?.includes(scoreLine.playername) ? "x" : (scoreLine.scoreValue != undefined && scoreLine.scoreValue != null) ? scoreLine.scoreValue : "?"}</div>
                            :
                            ffmatch ?
                                scoreLine.playername || (scoreLine.seed == 0) ?
                                    <div className="playerScore">V</div>
                                    :
                                    <div className="playerScore"></div>
                                :
                                <div className="playerScore">?</div>
                        }
                        {isFFAmatch &&
                            <div className={`playerPosition ${match.m && !match.m?.includes(null) && tournament.bracketProperties.options.advancers && i < tournament.bracketProperties.options.advancers[match.id.r - 1] && 'pass'}`}>{match.m && !match.m?.includes(null) ? scoreLine.place : "?"}</div>
                        }
                    </div>
                )}
            </div>
        </div>
    )
}

function DuelViewer(tournament: Tournament, setterOpponentToShowInfo: Dispatch<SetStateAction<string>>) {
    const bracket = tournament.bracketProperties
    const matches = tournament.matches
    if (!matches) return null

    if (
        !bracket.seeding ||
        bracket.options.last == undefined ||
        bracket.options.short == undefined ||
        bracket.options.lowerScoreIsBetter == undefined) return null

    const duelStructure = Duel.restore(
        bracket.seeding.length,
        {
            last: bracket.options.last,
            short: bracket.options.short,
            lowerScoreIsBetter: bracket.options.lowerScoreIsBetter
        },
        []
    )

    const matchPrecedences = getPreviousDuelMatchIds(duelStructure)
    const editableMatches = getEditableMatches(duelStructure, tournament)

    const WBR1matches = matches.filter(m => m.id.s == 1 && m.id.r == 1)
    const bracket_power = Math.log(2*WBR1matches.length) / Math.log(2)
    const wb_matches = matches.filter(m => m.id.s == Duel.WB)
    const lb_matches = matches.filter(m => m.id.s == Duel.LB && m.id.r < 2 * bracket_power - 1)
    const gf_matches = matches.filter(m => m.id.s == Duel.LB && m.id.r >= 2 * bracket_power - 1)

    const finalsList : string[] = []
    if (bracket.options.last == Duel.WB) {
        finalsList.push(idToString({s: Duel.WB, r: bracket_power, m: 1}))
    }
    else {
        finalsList.push(idToString({s: Duel.LB, r: 2 * bracket_power - 1, m: 1}))
        if (!bracket.options.short)
            finalsList.push(idToString({s: Duel.LB, r: 2 * bracket_power, m: 1}))

    }

    function blurInput() {
        const toBlur = document.activeElement
        if (!toBlur || !(toBlur instanceof HTMLInputElement)) return
        toBlur.blur()
    }

    return (
        <div className="is-flex is-flex-direction-column" style={{margin:"1rem 1rem 4.5rem"}}>
            <div className='bracketViewBackground' onClick={blurInput}></div>
            {/* Winner bracket and bronze final if any */}
            <div className="mb-6 is-title medium">Tableau principal</div>
            <div className="bracket mb-6">
                {Array.from(Array(bracket_power).keys()).map(i => i+1).map(i =>
                    <div key={i} className="round">
                        {/* Winner bracket */}
                        {wb_matches.map(m => m.id.r == i &&
                            <MatchViewer match={m} tournament={tournament} matchPrecedences={matchPrecedences} finals={finalsList} isEditable={editableMatches.includes(idToString(m.id))} setterOpponentToShowInfo={setterOpponentToShowInfo}/>
                        )}
                    </div>
                )}
                {/* Grand final */}
                {bracket.options.last == Duel.LB &&
                <div className="is-flex is-align-content-stretch is-justify-content-space-between LB is-flex-grow-1">
                    {gf_matches.map(m =>
                        (tournament.status != TournamentStatus.Done || tournament.status == TournamentStatus.Done && m.m) &&
                        <MatchViewer match={m} tournament={tournament} matchPrecedences={matchPrecedences} finals={finalsList} setterOpponentToShowInfo={setterOpponentToShowInfo}/>
                    )}
                </div>}
            </div>
            {bracket.options.last == Duel.LB ?
                <div className="my-6 is-title medium">Rattrapage</div>
                :
                bracket.options.short == false ?
                    <div className="my-6 is-title medium">Petite finale</div>
                    :
                    <></>
            }
            {/* Looser bracket or bronze final */}
            <div className="bracket">
                {Array.from(Array(2 * bracket_power - 1).keys()).map(i => i+1).map(i =>
                    <div key={i} className="round">
                        {lb_matches.map(m => m.id.r == i &&
                            <MatchViewer match={m} tournament={tournament} matchPrecedences={matchPrecedences} finals={finalsList} setterOpponentToShowInfo={setterOpponentToShowInfo}/>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

function FFAViewer(tournament: Tournament, setterOpponentToShowInfo: Dispatch<SetStateAction<string>>) {
    const bracket = tournament.bracketProperties
    const matches = tournament.matches
    if (!matches) return (<></>)

    const nb_rounds = Math.max(...matches.map(m => m.id.r))

    const finals = [idToString({s: 1, r:nb_rounds, m: 1})]

    return (
        <div style={{margin:"1rem 1rem 4.5rem"}}>
            {/* Winner bracket and bronze final if any */}
            <div className="is-flex is-align-content-stretch is-justify-content-space-between WB is-flex-grow-1">
                {Array.from(Array(nb_rounds).keys()).map(i => i+1).map(i =>
                    <div key={i} className="is-flex is-flex-direction-column is-align-content-stretch round-viewer">
                        {matches.map(m => m.id.r == i &&
                            <MatchViewer match={m} tournament={tournament} finals={finals} setterOpponentToShowInfo={setterOpponentToShowInfo}/>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
