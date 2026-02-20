import { Dialog as ChakraDialog, Portal } from "@chakra-ui/react"
import * as React from "react"

interface DialogRootProps extends ChakraDialog.RootProps {
  usePortal?: boolean
  portalRef?: React.RefObject<HTMLElement>
}

export type DialogOpenChangeDetails = { open: boolean }

export const DialogRoot = (props: DialogRootProps) => {
  const { usePortal = true, portalRef, ...rest } = props
  return (
    <ChakraDialog.Root {...rest}>
      {usePortal ? (
        <Portal container={portalRef}>{props.children}</Portal>
      ) : (
        props.children
      )}
    </ChakraDialog.Root>
  )
}

export const DialogContent = React.forwardRef<
  HTMLDivElement,
  ChakraDialog.ContentProps
>(function DialogContent(props, ref) {
  const { children, ...rest } = props
  return (
    <ChakraDialog.Positioner>
      <ChakraDialog.Backdrop />
      <ChakraDialog.Content ref={ref} {...rest}>
        {children}
        <DialogCloseTrigger />
      </ChakraDialog.Content>
    </ChakraDialog.Positioner>
  )
})

export const DialogBody = ChakraDialog.Body
export const DialogHeader = ChakraDialog.Header
export const DialogTitle = ChakraDialog.Title
export const DialogFooter = ChakraDialog.Footer
export const DialogBackdrop = ChakraDialog.Backdrop
export const DialogCloseTrigger = ChakraDialog.CloseTrigger
export const DialogActionTrigger = ChakraDialog.ActionTrigger
