import { ReactNode } from "react"
import { clickorkey } from "~/lib/utils/clickorkey"

interface CustomButtonProps {
  contentItems?: ReactNode[]
  customClasses?: string
  colorClass?: string
  callback?: (event: React.KeyboardEvent<HTMLDivElement> | React.MouseEvent<HTMLDivElement>) => void
  tooltip?: string
  active?: boolean
  show?: boolean
  height?: number
  square?: boolean
}
export function CustomButton({
  contentItems,
  customClasses,
  colorClass,
  callback,
  tooltip,
  active
}: CustomButtonProps) {
  const callbackItems = callback ? clickorkey((e) => (active != false ? callback(e) : {})) : {}
  return (
    <div
      title={tooltip}
      className={`customButton fade-on-mouse-out is-unselectable ${customClasses ? customClasses : ""} ${
        active == false
          ? "fade-text has-background-primary-level"
          : (colorClass || "has-background-primary-level") + (callback ? " is-clickable" : "")
      }`}
      {...callbackItems}
    >
      {contentItems?.map((item, nb) => (
        <div className="is-flex" key={nb}>
          {item}
        </div>
      ))}
    </div>
  )
}
export function SquareButton({
  customClasses,
  colorClass,
  callback,
  tooltip,
  active,
  show,
  height,
  contentItems
}: CustomButtonProps) {
  const callbackItems = callback ? clickorkey((e) => (active != false ? callback(e) : {})) : {}
  return (
    <div
      title={tooltip}
      className={`customButtonSquare fade-on-mouse-out is-unselectable ${customClasses ? customClasses : ""} ${
        active == false ? "fade-text" : (colorClass || "") + (callback ? " is-clickable" : "")
      } ${show == false ? "" : "is-shown"}`}
      {...callbackItems}
      style={height ? { height: height + "px", width: height + "px" } : {}}
    >
      {contentItems && contentItems[0]}
    </div>
  )
}
export function MicroButton({
  customClasses,
  colorClass,
  callback,
  tooltip,
  active,
  show,
  contentItems
}: CustomButtonProps) {
  const callbackItems = callback ? clickorkey((e) => (active != false ? callback(e) : {})) : {}
  return (
    <div
      title={tooltip}
      className={`customButtonMicro fade-on-mouse-out is-unselectable ${customClasses ? customClasses : ""} ${
        active == false ? "fade-text" : (colorClass || "") + (callback ? " is-clickable" : "")
      } ${show == false ? "" : "is-shown"}`}
      {...callbackItems}
    >
      {contentItems && contentItems[0]}
    </div>
  )
}
