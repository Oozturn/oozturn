import { Data } from '@dnd-kit/core'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ElementType } from 'react'

interface SortableProps {
    id: string
    data?: Data
    element?: ElementType
    children?: JSX.Element | JSX.Element[]
}

export function Sortable({ id, data, element, children }: SortableProps) {
    const Element = element || 'div'
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
        id: id,
        data: data
    })

    const style = {
        transform: CSS.Transform.toString(transform ? { x: transform.x, y: transform.y, scaleX: 1, scaleY: 1 } : null),
        transition
    }

    return (
        <Element ref={setNodeRef} style={style} {...listeners} {...attributes}>
            {children}
        </Element>
    )
}