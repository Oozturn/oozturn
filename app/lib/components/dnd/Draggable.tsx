import { Data, useDraggable } from "@dnd-kit/core"
import { ElementType } from "react"

interface DraggableProps {
  id: string
  data?: Data
  element?: ElementType
  children?: JSX.Element | JSX.Element[]
}

export function Draggable({ id, data, element, children }: DraggableProps) {
  const Element = element || "div"
  const { attributes, listeners, setNodeRef } = useDraggable({
    id: id,
    data: data
  })

  return (
    <Element ref={setNodeRef} {...listeners} {...attributes}>
      {children}
    </Element>
  )
}
