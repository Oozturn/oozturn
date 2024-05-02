import { Outlet } from "@remix-run/react"

export default function Login() {
  return <main className="main is-clipped is-relative is-flex is-flex-direction-column is-justify-content-center is-align-items-center">
    <Outlet />
  </main>
}
