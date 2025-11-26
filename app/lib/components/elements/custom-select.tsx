/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react"
import { DropDownArrowSVG } from "../data/svg-container"
import { clickorkey } from "~/lib/utils/clickorkey"

interface CustomSelectProps {
  variable: any
  setter: CallableFunction
  items: { label: string; value: any }[]
  customClass?: string
  itemsToShow?: number
  showOnTop?: boolean
}

export function CustomSelect({ variable, setter, items, customClass, itemsToShow, showOnTop }: CustomSelectProps) {
  const [showDropdown, setShowDropdown] = useState(false)

  const width = Math.max(...items.map((i) => i.label.length))

  return (
    <div
      className={`customSelect has-background-primary-level is-unselectable ${customClass}`}
      {...clickorkey(() => setShowDropdown(!showDropdown))}
      onMouseLeave={() => setShowDropdown(false)}
      style={{ width: width * 0.75 + 2 + "rem" }}
    >
      <div className="customSelectSelected px-2">{items.find((i) => String(i.value) == String(variable))?.label}</div>

      <div className={`customSelectArrow ${showDropdown ? "flip" : ""}`}>
        <DropDownArrowSVG />
      </div>
      <div
        className={`customSelectDropdown has-background-primary-level ${showDropdown ? "show" : "hide"} ${
          showOnTop ? "showontop" : ""
        }`}
        style={{ maxHeight: "calc(2px + " + Math.min(itemsToShow || 30, items.length) * 2 + "rem)" }}
      >
        {items.map((item) => (
          <div
            className={`customSelectDropdownItem px-2 ${
              String(item.value) == String(variable) ? "has-background-secondary-accent" : ""
            }`}
            key={item.value}
            {...clickorkey(() => {
              setter(item.value)
              setShowDropdown(false)
            })}
          >
            {item.label}
          </div>
        ))}
      </div>
    </div>
  )
}
