import { ReactNode } from "react"
import { MoreSVG } from "../data/svg-container"
import { clickorkey } from "~/lib/utils/clickorkey"

interface CustomButtonProps {
    contentItems?: ReactNode[]
    customClasses?: string
    colorClass?: string
    callback: (event: React.KeyboardEvent<HTMLDivElement> | React.MouseEvent<HTMLDivElement>) => void
    tooltip?: string
    active?: boolean
    show?: boolean
    height?: number
}
export function CustomButton({ contentItems, customClasses, colorClass, callback, tooltip, active }: CustomButtonProps) {
    return (
        <div title={tooltip} className={`customButton fade-on-mouse-out is-unselectable ${customClasses ? customClasses : ''} ${active == false ? 'fade-text has-background-primary-level' : (colorClass || "has-background-primary-level") + ' is-clickable'}`} {...clickorkey((e) => (active != false) ? callback(e) : {})}>
            {contentItems?.map((item, nb) => <div className="is-flex" key={nb}>{item}</div>)}
        </div>
    )
}
export function ButtonMore({ customClasses, colorClass, callback, tooltip, active, show, height }: CustomButtonProps) {
    return (
        <div title={tooltip} className={`customButtonMore fade-on-mouse-out is-unselectable ${customClasses ? customClasses : ''} ${active == false ? 'fade-text' : (colorClass || "") + ' is-clickable'} ${show == false ? '' : 'is-shown'}`} {...clickorkey((e) => (active != false) ? callback(e) : {})} style={height ? { height: height + 'px', width: height + 'px' } : {}}>
            <MoreSVG />
        </div>
    )
}