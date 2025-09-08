import { LoaderFunctionArgs } from "@remix-run/node"
import { Outlet } from "@remix-run/react"
import { useState } from "react"
import { LogoUnfolded } from "~/lib/components/data/svg-container"
import { isUserLoggedIn } from "~/lib/session.server"

export async function loader({ request }: LoaderFunctionArgs) {
  return { userAlreadyLoggedIn: isUserLoggedIn(request) }
}

export default function Login() {
  const [animateLogo, setAnimateLogo] = useState(false)
  return <div className="is-flex-col justify-center align-center is-full-height">
    <div className="loginLogo" style={{ width: "50vw" }}>
      <LogoUnfolded animate={animateLogo} />
    </div>
    <Outlet context={setAnimateLogo} />
  </div>
}
