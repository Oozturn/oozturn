import { clickorkey } from "~/lib/utils/clickorkey"

interface CustomCheckboxProps {
	variable: boolean
	setter: CallableFunction
	customClass?: string
}

export function CustomCheckbox({ variable, setter, customClass }: CustomCheckboxProps) {
	return (
		<div className={`is-flex is-clickable ${customClass}`} {...clickorkey(() => setter(variable == false))}>
			<div className={`customCheckbox ${variable == true ? 'is-active' : ''}`} />
		</div>
	)
}