import { useLocation } from "@remix-run/react"
import { GithubSVG } from "../data/svg-container"

export default function Footer() {
  const location = useLocation()
  if (location.pathname.endsWith("bracket")) return null

  return (
    <footer
      style={{ position: "absolute", bottom: 0 }}
      className="is-flex justify-center align-center is-full-width fade-text gap-6 is-size-6 has-background-primary-level"
    >
      <div>Développement par Will421 et Bug38 - Design par GCQRA</div>
      <a className="fade-text" href="https://github.com/Oozturn/oozturn" target="_blank" rel="noopener noreferrer">
        <GithubSVG />
      </a>
    </footer>
  )
}
