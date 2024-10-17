import { useRef, useState } from "react"


export function DebouncedInputNumber({name, defaultValue, setter, className, debounceTimeout}: {name: string, defaultValue: number | undefined, setter: (value: number) => void, className: string, debounceTimeout: number}) {
	const [value, setValue] = useState(defaultValue)
	const timeoutRef = useRef<NodeJS.Timeout>()

	const valueChanged = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (timeoutRef.current) {
			clearTimeout(timeoutRef.current)
		}
		setValue(Number(e.target.value))
		timeoutRef.current = setTimeout(() => {
			setter(Number(e.target.value))
		}, debounceTimeout)
	}
	const applyNow = (e: React.FocusEvent<HTMLInputElement>) => {
		if (timeoutRef.current) {
			clearTimeout(timeoutRef.current)
		}
		setter(Number(e.target.value))
	}
	
	return <input type="number" name={name}
                                className={className}
                                defaultValue={value}
                                onChange={valueChanged}
								onBlur={applyNow}
                            />
}