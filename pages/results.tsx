import Head from 'next/head'
import { useAchievements, useLan, useLeaderboard } from "../lib/hooks";
import { Player } from '../__generated__/gql/types';
import { Dispatch, SetStateAction, useState } from 'react';

interface Team {
  teamName: string,
  points: number,
  members: string[],
  tournaments: number,
  losses: number
}

export default function ResultsPage() {
  const { data: lanResult, error: lanError } = useLan()

  const { data: leaderboardResult, error: leaderboardError } = useLeaderboard()
  const { data: AchievementsResult, error: achievementsError } = useAchievements()
  
  const playersLeaderboard = leaderboardResult?.leaderboard || []
  const achievements = AchievementsResult?.achievements || []

  const teamsLeaderboard : Team[] = []
  function populateTeamsLeaderboard(player: string, teamToAdd: string, points: number, tournaments: number, losses: number) {
    const index = teamsLeaderboard.findIndex(team => team.teamName == teamToAdd)
    if(index != -1) {
      teamsLeaderboard[index].points += points
      teamsLeaderboard[index].members.push(player)
      teamsLeaderboard[index].tournaments += tournaments
      teamsLeaderboard[index].losses += losses
    } else {
      teamsLeaderboard.push({teamName: teamToAdd, points: points, members: [player], tournaments: tournaments, losses: losses})
  }
  }
  playersLeaderboard?.forEach(playerStats => playerStats.player.team && populateTeamsLeaderboard(playerStats.player.username, playerStats.player.team, playerStats.points, playerStats.tournaments, playerStats.losses))

  return (
    <>
      <Head>
        <title>{lanResult?.lan.name || ""} - Résultats</title>
      </Head>
      <div className='resultsPage is-full-height is-flex p-3'>
        <PlayersLeaderboard results={playersLeaderboard?.map(player =>{return {playerName: player.player.username, playerTeam: player.player.team || undefined, points: player.points, tournaments: player.tournaments, losses: player.losses}})} />
        <TeamsLeaderboard results={teamsLeaderboard.map(team => {return {teamName: team.teamName, points: team.points / (lanResult?.lan.weightTeamsResults ? team.members.length : 1), tournaments: team.tournaments, losses: team.losses}})} teams={teamsLeaderboard}/>
        <Achievements results={achievements}/>
      </div>
    </>
  )
}

function sortResults(resa: {points: number, tournaments: number, losses: number}, resb: {points: number, tournaments: number, losses: number}) {
  return resa.points < resb.points ? 1 : resb.points < resa.points ? -1 : resa.tournaments < resb.tournaments ? -1 : resa.losses > resb.losses ? 1 : -1
}

interface LeaderboardsProps {
  results: {playerName: string, playerTeam?: string, points: number, tournaments: number, losses: number}[]
  teams?: Team[]
}
function PlayersLeaderboard({results}: LeaderboardsProps ) {
  const { data: lanResult, error: lanError } = useLan()

  return (
    <div className='leaderboard has-background-secondary-level flat-box is-flex is-flex-direction-column pr-2'>
      <div className='is-title medium mb-4'>Classement joueurs</div>
      <div className='topLeaderboardList is-flex is-flex-direction-column pr-2 mb-3'>
        {results?.sort(sortResults).slice(0, 3).map((result, place) => 
          <ResultPlayerTile key={place} place={place + 1} playerName={result.playerName} playerTeam={result.playerTeam} points={result.points}/>
        )}
      </div>
      <div className='leaderboardList is-scrollable is-flex is-flex-direction-column pr-2'>
        {results?.sort(sortResults).slice(3).map((result, place) => 
          <ResultPlayerTile key={place} place={place + 4} playerName={result.playerName} playerTeam={result.playerTeam} points={result.points}/>
        )}
      </div>
      {lanResult?.lan.partialResults && <div className='bottomListInfo'>Résultats partiels pris en compte</div>}
    </div>
  )
}

interface LeaderboardsTeamProps {
  results: {
    teamName: string,
    points: number,
    tournaments: number,
    losses: number
  }[]
  teams: Team[]
}

function TeamsLeaderboard( {results, teams}: LeaderboardsTeamProps ) {
  const { data: lanResult, error: lanError } = useLan()
  const [showInfoTeam, setShowInfoTeam] = useState("")

  return (
    <div className='leaderboard has-background-secondary-level flat-box is-flex is-flex-direction-column pr-2'>
      <div className='is-title medium mb-4'>Classement équipes</div>
      <div className='topLeaderboardList is-flex is-flex-direction-column pr-2 mb-3'>
        {results?.sort(sortResults).slice(0, 3).map((result, place) => 
          <ResultTeamTile key={place} place={place + 1} teamName={result.teamName} points={result.points} team={teams.find(t => t.teamName == result.teamName)} showInfo={result.teamName == showInfoTeam} infoSetter={setShowInfoTeam}/>
        )}
      </div>
      <div className='leaderboardList is-scrollable is-flex is-flex-direction-column pr-2'>
        {results?.sort(sortResults).slice(3).map((result, place) => 
          <ResultTeamTile key={place} place={place + 4} teamName={result.teamName} points={result.points} team={teams.find(t => t.teamName == result.teamName)} showInfo={result.teamName == showInfoTeam} infoSetter={setShowInfoTeam}/>
        )}
      </div>
      {lanResult?.lan.weightTeamsResults && <div className='bottomListInfo'>Résultats d&apos;équipe pondérés en fonction du nombre de joueurs</div>}
    </div>
  )
}
interface AchievementsProps {
  results: {name: string, player: Player, description: string}[]
}
function Achievements( {results}: AchievementsProps ) {
  return (
    <div className='achievements has-background-secondary-level flat-box'>
      <div className='is-title medium'>Hauts faits</div>
      <div className='achievementsList is-flex is-flex-direction-column'>
        {results.map(achievement =>
          <div key={achievement.name} className='achievementTile is-flex'>
            <div className='name'>{achievement.name}</div>
            <div className='content is-flex is-flex-direction-column'>
              <div className='playername is-unselectable'>{achievement.player.username}</div>
              <div className='is-size-7'>{achievement.description}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

interface ResultPlayerTileProps {
  place: number
  playerName: string
  playerTeam?: string
  points: number
}
function ResultPlayerTile( {place, playerName, playerTeam, points}: ResultPlayerTileProps ) {
  return (
    <div className='resultTile is-unselectable'>
      <div className='resultTilemain is-flex has-background-primary-level px-2 py-1 is-align-items-center'>
        <div className='place'>{place == 1 ? '1ER' : place < 4 ? place+'EME' : place + '.'}</div>
        <div className='texts is-flex-grow-1 is-flex is-justify-content-center is-align-items-center'>
          <div className='mainText'>{playerName}</div>
          {playerTeam && <div className='secondaryText fade-text'>[{playerTeam}]</div>}
        </div>
        <div className='points'>{points == Math.trunc(points) ? points : points.toFixed(1)} Pts</div>
      </div>
    </div>
  )
}

interface ResultTeamTileProps {
  place: number
  teamName: string
  points: number
  team?: Team
  showInfo: boolean
  infoSetter: Dispatch<SetStateAction<string>>
}
function ResultTeamTile( {place, teamName, points, team, showInfo, infoSetter}: ResultTeamTileProps ) {
  return (
    <div className={`resultTile is-clickable is-unselectable ${showInfo ? "showInfo":""}`} onClick={() => showInfo ? infoSetter("") : infoSetter(teamName)}>
      <div className='resultTilemain is-flex has-background-primary-level px-2 py-1 is-align-items-center'>
        <div className='place'>{place == 1 ? '1ER' : place < 4 ? place+'EME' : place + '.'}</div>
        <div className='texts is-flex-grow-1 is-flex is-justify-content-center is-align-items-center'>
          <div className='mainText'>{teamName}</div>
        </div>
        <div className='points'>{points == Math.trunc(points) ? points : points.toFixed(1)} Pts</div>
      </div>
      {team &&
        <div className={`info has-background-primary-level fade-text ${showInfo ? "showInfo":""}`} style={{height: showInfo ? (30 * team.members.length + 60) + "px" : 0}}>
          <div className='tournamentsCount fade-text'>Tournois participés : {team.tournaments}</div>
          <div className='teamMembersTitle fade-text'>Membres :</div>
          {team.members.map(member =>
            <div key={member} className='pl-4'>{member}</div>
          )}
        </div>
      }
    </div>
  )
}