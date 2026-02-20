"use client"

import {
  Box,
  Toaster as ChakraToaster,
  Flex,
  Portal,
  Spinner,
  Stack,
  Toast,
  createToaster,
} from "@chakra-ui/react"

export const toaster = createToaster({
  placement: "top",
  pauseOnPageIdle: true,
})

export const Toaster = () => {
  return (
    <Portal>
      <ChakraToaster toaster={toaster} zIndex={10000}>
        {(toast) => (
          <Toast.Root
            width={{ base: "calc(100vw - 32px)", md: "sm" }}
            bg="bg.surface"
            backdropFilter="blur(16px)"
            border="1px solid"
            borderColor="border.subtle"
            borderTop="4px solid"
            borderTopColor={toast.type === "success" ? "green.400" : toast.type === "error" ? "red.400" : "blue.400"}
            color="fg.primary"
            borderRadius="xl"
            shadow="lg"
            px={5}
            py={4}
            transition="all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)"
          >
            <Flex align="center" gap="4" w="full">
              {toast.type === "loading" ? (
                <Spinner size="sm" color="green.400" />
              ) : (
                <Box color={toast.type === "success" ? "green.400" : toast.type === "error" ? "red.400" : "blue.400"} fontSize="xl">
                  <Toast.Indicator />
                </Box>
              )}
              <Stack gap="0" flex="1" maxWidth="100%">
                {toast.title && <Toast.Title fontWeight="bold" fontSize="sm">{toast.title}</Toast.Title>}
                {toast.description && (
                  <Toast.Description fontSize="xs" color="fg.muted">{toast.description}</Toast.Description>
                )}
              </Stack>
              {toast.action && (
                <Toast.ActionTrigger
                  bg="green.500"
                  _hover={{ bg: "green.600" }}
                  color="white"
                  px={3}
                  h="24px"
                  rounded="full"
                  fontWeight="bold"
                  fontSize="2xs"
                  textTransform="uppercase"
                  cursor="pointer"
                >
                  {toast.action.label}
                </Toast.ActionTrigger>
              )}
              {toast.meta?.closable && <Toast.CloseTrigger color="fg.subtle" />}
            </Flex>
          </Toast.Root>
        )}
      </ChakraToaster>
    </Portal>
  )
}
