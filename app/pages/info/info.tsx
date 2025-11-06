import { MetaFunction } from "@remix-run/node"
import { UsersList } from "~/lib/components/elements/users-list"
import { getLan } from "~/lib/persistence/lan.server"

export const meta: MetaFunction<typeof loader> = ({ data }) => {
	return [
		{ title: data?.lanName + " - Admin" }
	]
}

export async function loader(): Promise<{
	lanName: string
}> {

	return { lanName: getLan().name }
}

export default function Info() {
	return (
		<div className="is-full-height is-flex-row gap-3 m-0 p-3">
			<UsersList />
			<div className="is-flex-col has-background-secondary-level gap-3 p-3" style={{ flex: 5}}>
				<div className='is-title big pb-3'>Plan de la LAN</div>
				<div className="is-flex is-scrollable">
					<a href="lanMap.webp" target="blank">
						<img src="lanMap.webp" alt="Demande à un admin le plan de la LAN !" />
					</a>
				</div>
			</div>
		</div>)
}