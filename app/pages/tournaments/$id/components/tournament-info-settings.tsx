import { GetFFAMaxPlayers } from "~/lib/utils/tournaments"
import { Days } from "~/lib/utils/ranges"
import { BracketType } from "~/lib/tournamentEngine/types"
import { ShowGlobalTournamentPoints } from "~/lib/components/elements/global-tournament-points"
import { FormattedTextWithUrls } from "~/lib/components/elements/formatted-text-url"
import { useTournament } from "~/lib/components/contexts/TournamentsContext"
import { useGames } from "~/lib/components/contexts/GamesContext"


export default function TournamentInfoSettings() {
  const tournament = useTournament()
  const game = useGames().find(game => game.id == tournament.properties.game)

  return (
    <div className='is-flex-col gap-4 grow no-basis is-scrollable'>
      <div className='is-title medium is-uppercase'>Informations sur le tournoi</div>
      <div className='is-flex-col grow gap-2'>

        {/* Game */}
        {game != undefined && <div className="is-flex gap-3 wrap">
          <div className='has-text-right is-one-quarter'>Jeu :</div>
          <div>{game.name}</div>
        </div>}

        {/* Brackets and Teams */}
        {tournament.bracketsCount == 1 ?
          <div className="is-flex gap-3 wrap">
            <div className='has-text-right is-one-quarter'>Matchs :</div>
            <div>{tournament.bracketSettings[0].type} {tournament.settings.useTeams ? "par équipes" : "en solo"}</div>
          </div>
          :
          <>
            <div className="is-flex gap-3 wrap">
              <div className='has-text-right is-one-quarter'>Poules :</div>
              <div>{tournament.bracketSettings[0].type} {tournament.settings.useTeams ? "par équipes" : "en solo"} {tournament.bracketSettings[1].size ? "" : "(Classement)"}</div>
            </div>
            <div className="is-flex gap-3 wrap">
              <div className='has-text-right is-one-quarter'>Finale :</div>
              <div>{tournament.bracketSettings[1].type} {tournament.settings.useTeams ? "par équipes" : "en solo"} {tournament.bracketSettings[1].size ? `(${tournament.bracketSettings[1].size} ${tournament.settings.useTeams ? "équipes" : "joueurs"})` : ""}</div>
            </div>
          </>
        }

        {/* Global Points */}
        <div className="is-flex gap-3 wrap">
          <div className='has-text-right is-one-quarter'>Points :</div>
          <ShowGlobalTournamentPoints points={tournament.properties.globalTournamentPoints} />
        </div>

        {/* Players number */}
        <div className="is-flex gap-3 wrap">
          <div className='has-text-right is-one-quarter'>Inscrits :</div>
          <div className="is-flex gap-2">
            <div>{tournament.players.length}</div>
            {tournament.bracketsCount == 1 && tournament.bracketSettings[0].type == BracketType.FFA && tournament.bracketSettings[0].sizes && tournament.bracketSettings[0].advancers &&
              <div className='fade-text ml-1'>
                / {GetFFAMaxPlayers(tournament.bracketSettings[0].sizes, tournament.bracketSettings[0].advancers) * (tournament.settings.useTeams ? tournament.settings.teamsMaxSize || 1 : 1)} max
              </div>
            }
          </div>
        </div>

        {/* Created teams */}
        {tournament.settings.useTeams &&
          <div className="is-flex gap-3 wrap">
            <div className='has-text-right is-one-quarter'>Équipes :</div>
            <div className="is-flex gap-2">
              <div>{tournament.teams ? tournament.teams.length : 0}</div>
              {tournament.bracketsCount == 1 && tournament.bracketSettings[0].type == BracketType.FFA && tournament.bracketSettings[0].sizes && tournament.bracketSettings[0].advancers &&
                <div className='fade-text ml-1'>
                  / {GetFFAMaxPlayers(tournament.bracketSettings[0].sizes, tournament.bracketSettings[0].advancers)} max
                </div>
              }
            </div>
          </div>
        }

        {/* Start time */}
        <div className='is-flex gap-3 wrap'>
          <div className='has-text-right is-one-quarter'>Démarrage :</div>
          <div>{Days[tournament.properties.startTime.day]} {tournament.properties.startTime.hour}h</div>
        </div>
        {/* Comments */}
        <div className='is-flex gap-3 wrap'>
          {tournament.properties.comments && <div className=''>Commentaires :</div>}
          {tournament.properties.comments && <div className='is-scrollable enable-line-break'><FormattedTextWithUrls text={tournament.properties.comments} /></div>}
        </div>
      </div>
    </div>
  )
}