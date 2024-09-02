import { PointerSensor } from '@dnd-kit/core'
import { PointerEvent } from 'react'

export class SmartDndPointerSensor extends PointerSensor {
	static activators = [
		{
			eventName: "onPointerDown" as never,
			handler: ({ nativeEvent: event }: PointerEvent) => {
				if (!event.isPrimary || event.button !== 0 || (event.target as Element).closest('.modal')) {
					return false
				}
				return true
			},
		},
	]
}