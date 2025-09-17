import { GetFFAMaxPlayers } from "~/lib/utils/tournaments"
import { Days } from "~/lib/utils/ranges"
import { BracketType } from "~/lib/tournamentEngine/types"
import { ShowGlobalTournamentPoints } from "~/lib/components/elements/global-tournament-points"
import { FormattedTextWithUrls } from "~/lib/components/elements/formatted-text-url"
import { useTournament } from "~/lib/components/contexts/TournamentsContext"
import { useTranslation } from "react-i18next"


export default function TournamentInfoSettings() {
  const tournament = useTournament()
  const { t } = useTranslation()

  return (
    <div className='is-flex-col gap-4 grow no-basis is-scrollable'>
      <div className='is-title medium is-uppercase'>{t("tournoi.infos")}</div>
      <div className='is-flex-col grow gap-2'>

        {/* Brackets and Teams */}
        {tournament.bracketsCount == 1 ?
          <div className="is-flex gap-3 wrap">
            <div className='has-text-right is-one-quarter'>{t("matchs_colon")}</div>
            <div>{t(`match.${tournament.settings.useTeams ? "equipe" : "solo"}_${tournament.bracketSettings[0].type}`)}</div>
          </div>
          :
          <>
            <div className="is-flex gap-3 wrap">
              <div className='has-text-right is-one-quarter'>{t("tournoi.poules_colon")}</div>
              <div>{t(`match.${tournament.settings.useTeams ? "equipe" : "solo"}_${tournament.bracketSettings[0].type}`)}</div>
            </div>
            <div className="is-flex gap-3 wrap">
              <div className='has-text-right is-one-quarter'>{t("tournoi.finale_colon")}</div>
              <div>{t(`match.${tournament.settings.useTeams ? "equipe" : "solo"}_${tournament.bracketSettings[1].type}`)} {tournament.bracketSettings[1].size ? `(${tournament.bracketSettings[1].size} ${tournament.settings.useTeams ? "équipes" : "joueurs"})` : ""}</div>
            </div>
          </>
        }

        {/* Global Points */}
        <div className="is-flex gap-3 wrap">
          <div className='has-text-right is-one-quarter'>{t("points_colon")}</div>
          <ShowGlobalTournamentPoints points={tournament.properties.globalTournamentPoints} />
        </div>

        {/* Players number */}
        <div className="is-flex gap-3 wrap">
          <div className='has-text-right is-one-quarter'>{t("inscrits_colon")}</div>
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
            <div className='has-text-right is-one-quarter'>{t("equipes_colon")}</div>
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
          <div className='has-text-right is-one-quarter'>{t("tournoi.demarrage_colon")}</div>
          <div>{t(Days[tournament.properties.startTime.day])} {tournament.properties.startTime.hour}h</div>
        </div>
        {/* Comments */}
        <div className='is-flex gap-3 wrap'>
          {tournament.properties.comments && <div className=''>{t("tournoi.commentaires_colon")}</div>}
          {tournament.properties.comments && <div className='is-scrollable enable-line-break'><FormattedTextWithUrls text={tournament.properties.comments} /></div>}
        </div>
      </div>
    </div>
  )
}