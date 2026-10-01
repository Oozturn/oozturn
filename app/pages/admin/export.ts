import { LoaderFunctionArgs } from "@remix-run/node"
import { requireUserAdmin } from "~/lib/session.server"
import { exportData } from "./admin.queries.server"

/** Resource route : downloads the whole persisted state (db json files and uploaded pictures) as a zip */
export async function loader({ request }: LoaderFunctionArgs) {
  await requireUserAdmin(request)
  const { filename, content } = await exportData(request)
  return new Response(content, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": String(content.length),
      "Cache-Control": "no-store"
    }
  })
}
