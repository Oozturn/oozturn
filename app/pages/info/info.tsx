import { MetaFunction } from "@remix-run/node"
import { useNavigate } from "@remix-run/react"
import { useLan } from "~/lib/components/contexts/LanContext"
import { CustomButton } from "~/lib/components/elements/custom-button"
import { FormattedTextWithUrls } from "~/lib/components/elements/formatted-text-url"
import { getLan } from "~/lib/persistence/lan.server"

export const meta: MetaFunction<typeof loader> = ({ data }) => {
	return [
		{ title: data?.lanName + " - Admin" }
	]
}

export async function loader(): Promise<{
	lanName: string
}> {

	return { lanName: getLan().name}
}

export default function Info() {
	const lan = useLan()
	const navigate = useNavigate()

	return (<div className="is-full-height is-flex-row gap-3 m-0 p-3">
		<div className="is-flex-col gap-3 is-one-quarter is-scrollable">
			{lan?.motd && <div className='is-flex-col gap-3 has-background-secondary-level p-3'>
				<div className='is-title big pb-3'>MOT DU JOUR</div>
				<p className='enable-line-break'>
					<FormattedTextWithUrls text={lan?.motd} />
				</p>
			</div>}
			<div className='is-flex-col gap-3 has-background-secondary-level p-3 align-center'>
				<div className='is-title big pb-3 is-align-self-flex-start'>Participants</div>
				<CustomButton callback={() => navigate('/info/users')} contentItems={["→ Liste ici ←"]} />
			</div>
		</div>
		<div className="is-flex-col has-background-secondary-level gap-3 p-3 grow no-basis">
			<div className='is-title big pb-3'>Plan de la LAN</div>
			<img src="lanMap.webp" alt="Demande à un admin le plan de la LAN !" />
		</div>
	</div>)
}