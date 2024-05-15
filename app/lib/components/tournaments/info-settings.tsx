import { TournamentType } from "~/lib/types/tournaments"
import { useTournament } from "../contexts/TournamentsContext"
import { GetFFAMaxPlayers } from "~/lib/utils/tournaments"
import { Days } from "~/lib/utils/ranges"
import { FormattedTextWithUrls } from "../elements/formatted-text-url"
import { useUser } from "../contexts/UserContext"
import { useState } from "react"
import { CustomButton } from "../elements/custom-button"
import { CustomModalBinary } from "../elements/custom-modal"
import { BinSVG, StartSVG, SubsribedSVG } from "../data/svg-container"
import { ShowGlobalTournamentPoints } from "../elements/global-tournament-points"


export default function TournamentInfoSettings() {
    const tournament = useTournament()
  
    return (
      <div className='tournamentInfoSettings has-background-secondary-level is-flex-col'>
        <div className='is-title medium is-uppercase'>Informations sur le tournoi</div>
        <div className='ml-3 is-size-5 is-flex-col is-scrollable'>
          {/* Type de matchs */}
          {tournament.settings.type == TournamentType.Duel && <div className='mb-3'>Type de matchs : Affrontement de deux {tournament.settings.useTeams ? "équipes" : "joueurs"}</div>}
          {tournament.settings.type == TournamentType.FFA && <div className='mb-3'>Type de matchs : FFA en {tournament.settings.useTeams ? "équipe" : "solo"}</div>}
          {/* Points rapportés */}
          <ShowGlobalTournamentPoints points={tournament.settings.globalTournamentPoints} />
          {/* Joueurs incrits */}
          <div className='is-flex'>
            <div>Joueurs inscrits : {tournament.players.length}</div>
            {tournament.settings.type == TournamentType.FFA &&
              tournament.bracket.options.sizes &&
              tournament.bracket.options.advancers &&
              <div className='fade-text ml-1'>
                / {GetFFAMaxPlayers(tournament.bracket.options.sizes, tournament.bracket.options.advancers) * (tournament.settings.useTeams ? tournament.settings.teamsMaxSize || 1 : 1)} max
              </div>
            }
          </div>
          {/* Équipes créées */}
          {tournament.settings.useTeams &&
            <div className='mb-3 is-flex'>
              <div>Équipes créées : {tournament.teams ? tournament.teams.length : 0}</div>
              {tournament.bracket.type == 'FFA' &&
                tournament.bracket.options.sizes &&
                tournament.bracket.options.advancers &&
                <div className='fade-text ml-1'>
                  / {GetFFAMaxPlayers(tournament.bracket.options.sizes, tournament.bracket.options.advancers)} max
                </div>
              }
            </div>
          }
          {/* Début du tournoi */}
          <div className='mb-3 is-flex'>
            <div className='mr-3'>Début du tournoi :</div>
            <div className='has-text-weight-semibold'>{Days[tournament.settings.startTime.day]} {tournament.settings.startTime.hour}h</div>
          </div>
          {/* Commentaires */}
          {tournament.comments && <div className=''>Commentaires :</div>}
          {tournament.comments && <div className='comments ml-6 is-scrollable enable-line-break'><FormattedTextWithUrls text={tournament.comments} /></div>}
        </div>
      </div>
    )
  }