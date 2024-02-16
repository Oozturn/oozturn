interface CustomCheckboxProps {
	variable: boolean
	setter: Function
	customClass?: string
}

export function CustomCheckbox({ variable, setter, customClass }: CustomCheckboxProps) {
	return (
		<div className={`is-flex is-clickable ${customClass}`} onClick={() => setter(variable == false)}>
			<div className={`customCheckbox ${variable == true ? 'is-active' : ''}`} />
		</div>
	)
}