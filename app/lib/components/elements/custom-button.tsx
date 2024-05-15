import { ReactNode, useEffect, useState } from "react"
import { MoreSVG } from "../data/svg-container"

interface CustomButtonProps {
    contentItems: ReactNode[]
    customClasses?: string
    colorClass?:string
    callback: Function
    tooltip?: string
    active?: boolean
}
export function CustomButton({ contentItems, customClasses, colorClass, callback, tooltip, active }: CustomButtonProps) {
    return (
        <div title={tooltip} className={`customButton fade-on-mouse-out is-unselectable ${customClasses ? customClasses :''} ${active == false ? 'fade-text has-background-primary-level' : (colorClass || "has-background-primary-level") + ' is-clickable' }`} onClick={() => (active != false) ? callback() : {}}>
            {contentItems.map(item => item)}
        </div>
    )
}
export function ButtonMore({ customClasses, colorClass, callback, tooltip, active }: CustomButtonProps) {
    return (
        <div title={tooltip} className={`customButtonMore fade-on-mouse-out is-unselectable ${customClasses ? customClasses :''} ${active == false ? 'fade-text has-background-primary-level' : (colorClass || "has-background-primary-level") + ' is-clickable' }`} onClick={() => (active != false) ? callback() : {}}>
            <MoreSVG />
        </div>
    )
}