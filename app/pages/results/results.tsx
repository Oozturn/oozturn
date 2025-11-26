import { LoaderFunctionArgs, MetaFunction } from "@remix-run/node"
import { useState } from "react"
import { useLan } from "~/lib/components/contexts/LanContext"
import { useStats } from "~/lib/components/contexts/StatsContext"
import { useUsers } from "~/lib/components/contexts/UsersContext"
import { UserAvatar } from "~/lib/components/elements/user-avatar"
import { getLan } from "~/lib/persistence/lan.server"
import { requireUserLoggedIn } from "~/lib/session.server"
import { TeamStats, UserStats } from "~/lib/types/statistics"
import { User } from "~/lib/types/user"
import { ResultSelectContext, useResultSelect } from "./components/ResultSelectContext"
import { UserTileRectangle } from "~/lib/components/elements/user-tile"
import { clickorkey } from "~/lib/utils/clickorkey"
import { getAchievements } from "~/lib/runtimeGlobals/achievements.server"
import { Achievement } from "~/lib/types/achievements"
import { useLoaderData } from "@remix-run/react"
import { statsSorter } from "~/lib/utils/sorters"

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  return [{ title: data?.lanName + " - Admin" }]
}

export async function loader({ request }: LoaderFunctionArgs): Promise<{
  lanName: string
  achievements: Achievement[]
}> {
  await requireUserLoggedIn(request)
  return { lanName: getLan().name, achievements: getAchievements() }
}

export default function Results() {
  const lan = useLan()

  return (
    <div className="is-full-height is-flex m-0 p-3 justify-center">
      <div
        className={`is-flex gap-2 justify-center ${
          ["is-three-fifths", "is-four-fifths", "grow"][Number(lan.showTeamsResults) + Number(lan.showAchievements)]
        }`}
      >
        <PlayersLeaderboard />
        {lan.showTeamsResults && <TeamsLeaderboard />}
        {lan.showAchievements && <Achievements />}
      </div>
    </div>
  )
}

function PlayersLeaderboard() {
  const usersStats = useStats().usersStats
  const users = useUsers()
  const lan = useLan()
  return (
    <div className="leaderboard is-flex-col has-background-secondary-level grow no-basis">
      <div className="is-flex-col is-scrollable gap-2 p-2 mx-1 grow">
        {usersStats.sort(statsSorter).map((us, index) => {
          const user = users.find((user) => user.id == us.userId)
          if (!user) return null
          return <ResultTile key={us.userId} place={index + 1} user={user} stats={us} />
        })}
      </div>
      {lan.showPartialResults && <div className="bottomListInfo">Résultats partiels pris en compte</div>}
    </div>
  )
}

function TeamsLeaderboard() {
  const teamsStats = useStats().teamsStats
  const lan = useLan()
  const [activeTeam, setActiveResult] = useState("")
  return (
    <div className="leaderboard is-flex-col has-background-secondary-level grow no-basis">
      <div className="is-flex-col is-scrollable gap-2 p-2 mx-1">
        <ResultSelectContext.Provider value={{ setActiveResult }}>
          {teamsStats.map((ts, index) => {
            return (
              <ResultTile
                key={ts.teamName}
                place={index + 1}
                teamName={ts.teamName}
                stats={ts}
                showInfo={activeTeam == ts.teamName}
              />
            )
          })}
        </ResultSelectContext.Provider>
      </div>
      {lan.weightTeamsResults && (
        <div className="bottomListInfo">Résultats d&apos;équipe pondérés en fonction du nombre de joueurs</div>
      )}
    </div>
  )
}

interface ResultPlayerTileProps {
  place: number
  user?: User
  teamName?: string
  stats: UserStats | TeamStats
  showInfo?: boolean
}
function ResultTile({ place, user, teamName, stats, showInfo }: ResultPlayerTileProps) {
  const teamMembers = useUsers().filter((user) => user.team == teamName)
  const { setActiveResult } = useResultSelect()
  if (!user && !teamName) return null
  const points =
    stats.globalTournamentPoints == Math.trunc(stats.globalTournamentPoints)
      ? stats.globalTournamentPoints
      : stats.globalTournamentPoints.toFixed(1)
  return (
    <div
      className={`resultTile is-relative is-unselectable is-flex-col is-clipped has-background-primary-level pr-1 no-shrink ${
        teamName ? "is-clickable teamResult" : ""
      }`}
      {...clickorkey(() => setActiveResult(showInfo ? "" : teamName || user?.username || ""))}
    >
      <div
        className="is-flex-row align-center gap-2"
        style={{
          height: [80, 65, 55][place - 1] || 38,
          fontSize: [28, 24, 20][place - 1] || 20,
          fontWeight: [800, 800, 800][place - 1] || 400
        }}
      >
        {user && (
          <div style={{ zIndex: 2, width: [80, 65, 55][place - 1] || 38 }}>
            <UserAvatar username={user.username} avatar={user.avatar} size={[80, 65, 55][place - 1] || 38} />
          </div>
        )}
        <div
          className="place justify-end"
          style={{
            zIndex: 2,
            width: [teamName ? 95 : 86, 60, 35][place - 1] || "2rem",
            textAlign: place < 4 ? "center" : "right",
            fontStyle: "italic"
          }}
        >
          {place == 1 ? "1ER" : place < 4 ? place + "E" : place + "."}
        </div>
        <div
          className="opponent is-clipped is-flex grow no-basis"
          style={{
            paddingLeft: [teamName ? 30 : 25, 25, 15][place - 1] || 0,
            gap: place < 3 ? 0 : ".5rem",
            flexDirection: place < 3 ? "column" : "row"
          }}
        >
          <div className="name">{user ? user.username : teamName}</div>
          {user && user.team && (
            <div className="team fade-text" style={{ fontSize: 20 }}>
              [{user.team}]
            </div>
          )}
        </div>
        <div
          className="has-text-right"
          style={{
            color:
              ["var(--accent-primary-color)", "var(--accent-secondary-color)", "var(--grey)"][place - 1] ||
              "var(--text-color)"
          }}
        >
          {points} Pts
        </div>
      </div>
      {teamName && (
        <div
          className={`is-flex-row has-background-primary-level fade-text ${showInfo ? "showInfo" : ""}`}
          style={{ height: showInfo ? "unset" : 0 }}
        >
          <div
            className="mr-2 mt-1"
            style={{
              marginLeft: [99, 62, 30][place - 1] || 30,
              backgroundColor:
                ["var(--accent-primary-color)", "var(--accent-secondary-color)", "var(--grey)"][place - 1] ||
                "var(--text-color-70)",
              paddingLeft: 1
            }}
          ></div>
          <div className="">
            <div className="tournamentsCount fade-text">Participations aux tournois : {stats.playedTournaments}</div>
            <div className="teamMembersTitle fade-text">Membres :</div>
            <div className="pl-5">
              {teamMembers.map((member) => (
                <UserTileRectangle key={member.username} userId={member.id} showTeam={false} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Achievements() {
  const { achievements } = useLoaderData<typeof loader>()

  return (
    <div className="is-flex-col has-background-secondary-level grow no-basis">
      <div className="is-title big p-2 has-text-centered">Achievements</div>
      <div className="is-flex-col is-scrollable gap-2 p-2 mx-1 grow gap-5">
        {achievements.map((achievement) => {
          if (!achievement.active || !achievement.userId || !achievement.value) return null
          return (
            <div key={achievement.type} className="is-flex-col gap-">
              <div className="is-title medium mb-2">{achievement.name}</div>
              <div className="is-flex-row gap-3 align-center">
                <div className="is-two-fifths is-hal">
                  <UserTileRectangle userId={achievement.userId} colorClass="has-background-grey" />
                </div>
              </div>
              <div className="is-flex-row gap-2" title={achievement.title}>
                <div>{achievement.valueDescription} :</div>
                <div>{achievement.value % 1 == 0 ? achievement.value : achievement.value.toFixed(2)}</div>
              </div>
              <div className="is-flex-col gap-3 fade-text">
                <div>{achievement.description}</div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
