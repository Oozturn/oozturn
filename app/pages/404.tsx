import { useLan } from "~/lib/components/contexts/LanContext"

export default function NotFound() {
  const lan = useLan()
  return (
    <>
    <title>{`${lan.name} - Page not found`}</title>
    <div className="is-full-height is-flex-col align-center justify-center has-background-primary-level" style={{ backgroundImage: "url('/page_not_found.webp')", backgroundSize: "5%" }}>
          <div className="is-title big ">404 - PAGE NOT FOUND</div>
          <div style={{ color: "var(--background-secondary-level)" }}>Arrête de fouiller tu trouveras rien</div>
    </div>
    </>
  )
}
