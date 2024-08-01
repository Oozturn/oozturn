import { ReactNode } from "react"
import { CloseCrossSVG } from "../data/svg-container"
import { CustomButton } from "./custom-button"
import { clickorkey } from "~/lib/utils/clickorkey"

export function ModalLayout({ show, contentSlot, buttonsSlot, onHide }:
  { show: boolean, contentSlot: ReactNode, buttonsSlot: ReactNode, onHide: () => void }) {

  if (!show) {
    return null
  }

  return (
    <div className="modal is-active">
      <div className="modal-background" {...clickorkey(onHide)}></div>
      <div className="modal-content">
        <div className="customModal">
          <div className="close is-clickable fade-on-mouse-out" {...clickorkey(onHide)}>
            <CloseCrossSVG />
          </div>
          {contentSlot}
          <div className="is-flex is-justify-content-flex-end mt-4" style={{ gap: ".5rem" }}>
            <div className="is-flex-grow-2"></div>
            {buttonsSlot}
          </div>
        </div>
      </div>
    </div>
  )
}

interface BaseModalProps {
  show: boolean
  onHide: () => void
  content: ReactNode
}

interface ModalButtonsProps {
  Content: ReactNode[]
  Callback: (() => void)
  Classes?: string
  ColorClass?: string
  Condition?: (() => boolean)
  cantConfirmTooltip?: string
}

interface CustomModalProps extends BaseModalProps {
  modalButtons: ModalButtonsProps[]
}

export function CustomModal({ show, onHide, content, modalButtons }: CustomModalProps) {

  if (!show) {
    return null
  }

  return (
    <div className="modal is-active">
      <div className="modal-background" {...clickorkey(onHide)}></div>
      <div className="modal-content">
        <div className="customModal">
          <div className="close is-clickable fade-on-mouse-out" {...clickorkey(onHide)}>
            <CloseCrossSVG />
          </div>
          {content}
          <div className="is-flex is-justify-content-flex-end mt-4" style={{ gap: ".5rem" }}>
            <div className="is-flex-grow-2"></div>
            {modalButtons.map((buttonProps, index) =>
              <CustomButton
                key={index}
                callback={() => { buttonProps.Callback(); onHide(); }}
                contentItems={buttonProps.Content}
                customClasses={buttonProps.Classes}
                colorClass={buttonProps.ColorClass}
                active={buttonProps.Condition ? buttonProps.Condition() : undefined}
                tooltip={buttonProps.Condition && !buttonProps.Condition() ? buttonProps.cantConfirmTooltip : undefined}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

interface CustomModalBinaryProps extends BaseModalProps {
  cancelButton?: boolean
  onConfirm: () => void
  confirmCondition?: () => boolean
  cantConfirmTooltip?: string
}

export function CustomModalBinary({ show, onHide, content, cancelButton, onConfirm, confirmCondition, cantConfirmTooltip }: CustomModalBinaryProps) {

  const buttons: ModalButtonsProps[] = []
  cancelButton && buttons.push({ Callback: onHide, Content: ["Annuler"], Classes: "has-background-primary-level" })
  buttons.push({ Callback: onConfirm, Content: ["Confirmer"], ColorClass: "has-background-primary-accent", Condition: confirmCondition, cantConfirmTooltip: cantConfirmTooltip })

  return <CustomModal
    show={show}
    onHide={onHide}
    content={content}
    modalButtons={buttons}
  />
}

interface CustomModalSimpleAckProps extends BaseModalProps {
  buttonContent: ReactNode[]
}

export function CustomModalSimpleAck({ show, onHide, content, buttonContent }: CustomModalSimpleAckProps) {

  return <CustomModal
    show={show}
    onHide={onHide}
    content={content}
    modalButtons={[{ Callback: onHide, Content: buttonContent, ColorClass: "has-background-primary-accent" }]}
  />
}