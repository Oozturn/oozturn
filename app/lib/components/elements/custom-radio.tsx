interface CustomRadioProps {
	variable: any
	setter: Function
	items: { label: string, value: any }[]
}

export function CustomRadio({ variable, setter, items }: CustomRadioProps) {
	return (
		<div className='is-flex'>
			{items.map(item =>
				<div key={item.value} className={`customRadio is-flex is-align-items-center mx-3 is-clickable ${variable == item.value ? 'is-active' : ''}`} onClick={() => setter(item.value)}>
					<div className='customRadioPoint'></div>
					<div className="ml-1">{item.label}</div>
				</div>
			)}
		</div>
	)
}