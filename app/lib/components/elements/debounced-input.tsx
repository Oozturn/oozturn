import { useRef, useState } from "react"

export function DebouncedInputNumber({
  name,
  defaultValue,
  setter,
  className,
  debounceTimeout,
  error
}: {
  name: string
  defaultValue: number | undefined
  setter: (value: number | undefined) => void
  className: string
  debounceTimeout: number
  error: boolean
}) {
  const [value, setValue] = useState(defaultValue)
  const timeoutRef = useRef<NodeJS.Timeout>()

  const valueChanged = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setValue(e.target.value ? Number(e.target.value) : undefined)
    timeoutRef.current = setTimeout(() => {
      applyNow()
    }, debounceTimeout)
  }
  const applyNow = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setter(value)
  }

  return (
    <input
      type="number"
      name={name}
      className={className + ` ${error ? "error" : ""}`}
      defaultValue={value}
      onChange={valueChanged}
      onBlur={applyNow}
      onKeyDown={(e) => {
        if (e.key === "Enter") applyNow()
      }}
    />
  )
}
