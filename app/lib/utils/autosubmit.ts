import { FetcherWithComponents } from "@remix-run/react"

export function autoSubmit(fetcher: FetcherWithComponents<unknown>) {
  return {
    onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      fetcher.submit(event.currentTarget.form)
    },
    onBlur: (event: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement, Element>) => {
      fetcher.submit(event.currentTarget.form)
    }
  }
}
