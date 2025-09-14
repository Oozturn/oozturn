import { ReactNode, useEffect, useState } from "react"
import { clickorkey } from "~/lib/utils/clickorkey"

export interface DropdownInterface {
  trigger: ReactNode
  id: string
  items: { content: ReactNode[]; callback: CallableFunction }[]
  direction?: "top" | "bottom"
  align?: "left" | "right"
}

export default function Dropdown({ trigger, items, direction, align, id }: DropdownInterface) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    document.addEventListener("click", function () {
      setShow(false)
    })
    const dropdown = document.getElementById(id)
    if (!dropdown) return
    dropdown.addEventListener("click", function (event) {
      event.stopPropagation()
      setShow(!show)
    })
  })

  return (
    <div className="is-relative is-clickable">
      <div id={id}>{trigger}</div>
      <div
        className="is-flex-direction-row has-background-primary-level gap-1 p-1"
        style={{
          display: show ? "flex" : "none",
          position: "absolute",
          minWidth: "100%",
          zIndex: 20,
          ...(align == "left" ? { left: 0 }
          : align == "right" ? { right: 0 }
          : { right: "50%" }),
          ...(direction == "top" ? { bottom: `100%`, marginBottom: ".25rem" } : { top: `100%`, marginTop: ".25rem" })
        }}
      >
        <div className="has-background-secondary-accent pl-1"></div>
        <div className="is-flex-col align-flex-end grow">
          {items.map((item, index) => (
            <div
              key={index}
              className="is-flex-row gap-2 align-center fade-on-mouse-out is-clickable px-3 py-1 has-background-primary-level"
              {...clickorkey(() => item.callback())}
            >
              {...item.content}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
