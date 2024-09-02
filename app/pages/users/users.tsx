import { LoaderFunctionArgs, MetaFunction } from "@remix-run/node"
import { Fragment } from "react"
import { useUsers } from "~/lib/components/contexts/UsersContext"
import { UserTileUsersPage } from "~/lib/components/elements/user-tile"
import { getLan } from "~/lib/persistence/lan.server"
import { requireUserLoggedIn } from "~/lib/session.server"
import { useRevalidateOnUsersUpdate } from "../../api/sse.hook"


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
  useRevalidateOnUsersUpdate()

  return <div className="is-full-height is-flex-col gap-3 p-3 align-stretch">
    <div className="is-title big is-uppercase has-background-secondary-level p-2 px-4">
      Inscrits
    </div>
    <div className="is-flex wrap grow has-background-secondary-level p-3 is-scrollable gap-3">
      {users.sort((a, b) => a.username.toLowerCase().localeCompare(b.username.toLowerCase())).map((user, place) =>
        <Fragment key={user.id}>
          <UserTileUsersPage userId={user.id} tournaments={0} leaderboardPlace={place + 1} points={0} />
        </Fragment>
      )}
    </div>
  </div>
}
