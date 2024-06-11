import { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { useLan } from "~/lib/components/contexts/LanContext";
import { useUsers } from "~/lib/components/contexts/UsersContext";
import { UserTileUsersPage } from "~/lib/components/elements/user-tile";
import { requireUserLoggedIn } from "~/lib/session.server";


export const meta: MetaFunction = () => {
  return [
      { title: useLan().name + " - Users" }
  ]
}

export async function loader({ request }: LoaderFunctionArgs) {
  await requireUserLoggedIn(request)
  return null
}

export default function Users() {
  const users = useUsers()

  return <div className="is-full-height is-flex-col gap-3 p-3 align-stretch">
    <div className="is-title big is-uppercase has-background-secondary-level p-2 px-4">
      Inscrits
    </div>
    <div className="is-flex wrap grow has-background-secondary-level p-3 is-scrollable gap-3">
      {users.sort((a, b) => a.username.toLowerCase().localeCompare(b.username.toLowerCase())).map((user, place) =>
        <UserTileUsersPage userId={user.id} tournaments={0} leaderboardPlace={place + 1} points={0} />
      )}
    </div>
  </div>
}
