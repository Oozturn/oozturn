import Navbar from "./navbar";
import { useMe } from "../../lib/hooks";
import LoginForm from "../user/login-form";
import Footer from "./footer";
import { ToastContainer, cssTransition, toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';

interface LayoutProps {
  children: JSX.Element | JSX.Element[]
}

export default function Layout({ children }: LayoutProps) {

  const { data: meResult, error: meError } = useMe()
  const user = meResult?.me

  const notificationAnimation = cssTransition({
    enter: "toast-enter-animation",
    exit: "toast-exit-animation"
  });

  return (
    <>
      {user ?
        <>
          <Navbar />
          <main className="main is-clipped">{children}</main>
          <Footer />
        </>
        :
        <main className="main is-clipped is-relative is-flex is-flex-direction-column is-justify-content-center is-align-items-center">
          <LoginForm />
        </main>
      }
      <ToastContainer
        limit={1}
        position={toast.POSITION.TOP_CENTER}
        transition={notificationAnimation}
      />
    </>
  )
}