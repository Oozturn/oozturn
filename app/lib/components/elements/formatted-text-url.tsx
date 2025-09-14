import Linkify from "linkify-react"

interface FormattedTextWithUrlsProps {
  text: string
}

export function FormattedTextWithUrls({ text }: FormattedTextWithUrlsProps) {
  return (
    <Linkify
      options={{
        target: "_blank",
        render: {
          url: ({ attributes, content }) => {
            return (
              <a {...attributes} className="is-italic">
                {content.replace(/(?:https?)?(?:ftp)?:?\/\//g, "")}
              </a>
            )
          }
        }
      }}
    >
      {text}
    </Linkify>
  )
}
