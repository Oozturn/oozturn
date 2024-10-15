import { LoaderFunctionArgs, MetaFunction } from "@remix-run/node"
import { useUsers } from "~/lib/components/contexts/UsersContext"
import { UserTileUsersPage } from "~/lib/components/elements/user-tile"
import { getLan } from "~/lib/persistence/lan.server"
import { requireUserLoggedIn } from "~/lib/session.server"
import { useRevalidateOnUsersUpdate } from "~/api/sse.hook"
import { useStats } from "~/lib/components/contexts/StatsContext"


export const meta: MetaFunction<typeof loader> = ({ data }) => {
  return [
    { title: data?.lanName + " - Users" }
  ]
}

export async function loader({ request }: LoaderFunctionArgs): Promise<{
  lanName: string
}> {
  await requireUserLoggedIn(request)
  return { lanName: getLan().name }
}


export default function Users() {
  const users = useUsers()
  const usersStats = useStats().usersStats
  useRevalidateOnUsersUpdate()

  return <div className="is-full-height is-flex-col gap-3 p-3 align-stretch">
    <div className="is-title big has-background-secondary-level p-2 px-4">
      Participants
    </div>
    <div className="is-flex wrap grow is-scrollable gap-3">
      {users.sort((a, b) => a.username.toLowerCase().localeCompare(b.username.toLowerCase())).map(user => {
        const userStatsIndex = usersStats.findIndex(us => us.userId == user.id)
        return <UserTileUsersPage key={user.id} userId={user.id} tournaments={usersStats[userStatsIndex]?.playedTournaments || 0} leaderboardPlace={userStatsIndex == -1 ? usersStats.length + 1 : userStatsIndex + 1} points={usersStats[userStatsIndex]?.globalTournamentPoints || 0} />
      })}
    </div>
  </div>
}
