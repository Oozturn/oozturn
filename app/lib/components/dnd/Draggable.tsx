import React from 'react';
import { useDraggable } from '@dnd-kit/core';

interface DraggableProps {
    id: string,
    data?: any
    element?: any,
    children?: JSX.Element | JSX.Element[]
}

export function Draggable({ id, data, element, children }: DraggableProps) {
    const Element = element || 'div';
    const { attributes, listeners, setNodeRef } = useDraggable({
        id: id,
        data: data
    });

    return (
        <Element ref={setNodeRef} {...listeners} {...attributes}>
            {children}
        </Element>
    );
}