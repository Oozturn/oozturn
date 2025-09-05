import { GithubSVG } from "../data/svg-container";
import { useTranslation } from "react-i18next"

export default function Footer() {
    const { t } = useTranslation();
    return (
        <div style={{ position: "absolute", bottom: 0 }}
            className="is-flex justify-center align-center is-full-width fade-text gap-6 is-size-6 has-background-primary-level">
            <div>{t("developpement_par")}</div>
            <a className="fade-text" href='https://github.com/Oozturn/oozturn' target="_blank" rel="noopener noreferrer">
                <GithubSVG />
            </a>
        </div>
    )
}