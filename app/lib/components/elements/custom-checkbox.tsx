import { useState } from "react"
import { clickorkey } from "~/lib/utils/clickorkey"

interface CustomCheckboxProps {
  variable: boolean
  setter?: CallableFunction
  customClass?: string
  inFormName?: string
}

export function CustomCheckbox({ variable, setter, customClass, inFormName }: CustomCheckboxProps) {
  const [checked, setChecked] = useState(variable)
  return (
    <div
      className={`is-flex is-clickable ${customClass}`}
      {...clickorkey(() => {
        setter && setter(variable == false)
        setChecked(!checked)
      })}
    >
      <div className={`customCheckbox ${checked == true ? "is-active" : ""}`}>
        <input type="checkbox" hidden name={inFormName} checked={checked} readOnly />
      </div>
    </div>
  )
}
