import { MetaFunction } from "react-router"
import { getLan } from "~/lib/persistence/lan.server"

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  return [
    { title: data?.lanName + " - Page not found" }
  ]
}

export async function loader(): Promise<{
  lanName: string
}> {
  return { lanName: getLan().name }
}

export default function NotFound() {
  return (
    <div className="is-full-height is-flex-col align-center justify-center has-background-primary-level" style={{ backgroundImage: "url('/page_not_found.webp')", backgroundSize: "5%" }}>
          <div className="is-title big ">404 - PAGE NOT FOUND</div>
          <div style={{ color: "var(--background-secondary-level)" }}>Arrête de fouiller tu trouveras rien</div>
    </div>
  )
}
