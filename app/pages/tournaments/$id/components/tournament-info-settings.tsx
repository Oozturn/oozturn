import { GetFFAMaxPlayers } from "~/lib/utils/tournaments"
import { Days } from "~/lib/utils/ranges"
import { BracketType } from "~/lib/tournamentEngine/types"
import { ShowGlobalTournamentPoints } from "~/lib/components/elements/global-tournament-points"
import { FormattedTextWithUrls } from "~/lib/components/elements/formatted-text-url"
import { useTournament } from "~/lib/components/contexts/TournamentsContext"


export default function TournamentInfoSettings() {
  const tournament = useTournament()

  return (
    <div className='is-flex-col gap-4 grow no-basis'>
      <div className='is-title medium is-uppercase'>Informations sur le tournoi</div>
      <div className='is-flex-col grow gap-4'>
        {/* Type de matchs */}
        <div className="is-flex gap-3 wrap">
          <div className='has-text-right is-one-quarter'>Matchs :</div>
          {tournament.bracketSettings[0].type == BracketType.Duel && <div>Affrontements de deux {tournament.settings.useTeams ? "équipes" : "joueurs"}</div>}
          {tournament.bracketSettings[0].type == BracketType.FFA && <div>FFA en {tournament.settings.useTeams ? "équipe" : "solo"}</div>}
        </div>
        {/* Points rapportés */}
        <div className="is-flex gap-3 wrap">
          <div className='has-text-right is-one-quarter'>Points :</div>
          <ShowGlobalTournamentPoints points={tournament.properties.globalTournamentPoints} />
        </div>
        {/* Joueurs incrits */}
        <div className="is-flex gap-3 wrap">
          <div className='has-text-right is-one-quarter'>Inscrits :</div>
          <div className="is-flex gap-2">
            <div>{tournament.players.length}</div>
            {tournament.bracketSettings[0].type == BracketType.FFA && tournament.bracketSettings[0].sizes && tournament.bracketSettings[0].advancers &&
              <div className='fade-text ml-1'>
                / {GetFFAMaxPlayers(tournament.bracketSettings[0].sizes, tournament.bracketSettings[0].advancers) * (tournament.settings.useTeams ? tournament.settings.teamsMaxSize || 1 : 1)} max
              </div>
            }
          </div>
        </div>
        {/* Équipes créées */}
        {tournament.settings.useTeams &&

          <div className="is-flex gap-3 wrap">
            <div className='has-text-right is-one-quarter'>Équipes :</div>
            <div className="is-flex gap-2">
              <div>{tournament.teams ? tournament.teams.length : 0}</div>
              {tournament.bracketSettings[0].type == BracketType.FFA && tournament.bracketSettings[0].sizes && tournament.bracketSettings[0].advancers &&
                <div className='fade-text ml-1'>
                  / {GetFFAMaxPlayers(tournament.bracketSettings[0].sizes, tournament.bracketSettings[0].advancers)} max
                </div>
              }
            </div>
          </div>
        }
        {/* Début du tournoi */}
        <div className='is-flex gap-3 wrap'>
          <div className='has-text-right is-one-quarter'>Démarrage :</div>
          <div>{Days[tournament.properties.startTime.day]} {tournament.properties.startTime.hour}h</div>
        </div>
        {/* Commentaires */}
        <div className='is-flex gap-3 wrap'>
          {tournament.properties.comments && <div className=''>Commentaires :</div>}
          {tournament.properties.comments && <div className='is-scrollable enable-line-break'><FormattedTextWithUrls text={tournament.properties.comments} /></div>}
        </div>
      </div>
    </div>
  )
}