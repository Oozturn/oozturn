import { Outlet } from "@remix-run/react"

export default function Login() {
  return <div className="is-flex-col justify-center align-center is-full-height">
    <Outlet />
  </div>
}
