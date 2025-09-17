import { EnFlag, FrFlag, World } from "~/locales/flags"
import { GithubSVG } from "../data/svg-container"
import { useTranslation } from "react-i18next"
import i18next from "i18next"
import { useState } from "react"

export default function Footer() {
    const { t } = useTranslation()
    const [showFlags, setShowFlags] = useState(false)

    return (
        <div style={{ position: "absolute", bottom: 0 }}
            className="is-flex justify-center align-center is-full-width fade-text gap-6 is-size-6 has-background-primary-level">
            <div>{t("developpement_par", {dev1: "Will421", dev2: "Bug38", designer: "GCQRA"})}</div>
            <a className="fade-text" href='https://github.com/Oozturn/oozturn' target="_blank" rel="noopener noreferrer">
                <GithubSVG />
            </a>
            <div className="is-flex" style={{ position: "absolute", right: ".25rem" }} onMouseEnter={() => setShowFlags(true)} onMouseLeave={() => setShowFlags(false)}>
                <World />
                <Flags show={showFlags} />
            </div>
        </div>
    )
}

function Flags({show}: {show: boolean}) {
    if (!show) return null
    const changeLanguage = (lng: string) => {
        i18next.changeLanguage(lng)
    }
    return (
        <div className="is-flex-col" style={{ position: "absolute", bottom: "1.25rem" }}>
            <div className="is-clickable" onClick={() => changeLanguage("en")}><EnFlag /></div>
            <div className="is-clickable" onClick={() => changeLanguage("fr")}><FrFlag /></div>
            {process.env.NODE_ENV == "development" && <div className="is-clickable" onClick={() => changeLanguage("xx")}>XX</div>}
        </div>
    )
}