import { MetaFunction } from "@remix-run/node"
import { useNavigate } from "@remix-run/react"
import { useTranslation } from "react-i18next"
import { useLan } from "~/lib/components/contexts/LanContext"
import { CustomButton } from "~/lib/components/elements/custom-button"
import { FormattedTextWithUrls } from "~/lib/components/elements/formatted-text-url"
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
	const { t } = useTranslation();

	return (
		<div className="is-full-height is-flex-row gap-3 m-0 p-3">
			<UsersList />
			<div className="is-flex-col has-background-secondary-level gap-3 p-3" style={{ flex: 5}}>
				<div className='is-title big pb-3'>{t("info.plan_de_la_lan")}</div>
				<img src="lanMap.webp" alt={t("info.demande_plan_lan")} />
			</div>
		</div>)
}