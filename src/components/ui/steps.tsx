import { Steps as ChakraSteps } from "@chakra-ui/react"
import * as React from "react"
import { LuCheck } from "react-icons/lu"

export interface StepsCompletedContentProps
    extends ChakraSteps.CompletedContentProps { }

export const StepsCompletedContent = React.forwardRef<
    HTMLDivElement,
    StepsCompletedContentProps
>(function StepsCompletedContent(props, ref) {
    return (
        <ChakraSteps.CompletedContent ref={ref} {...props} />
    )
})

export interface StepsItemProps extends Omit<ChakraSteps.ItemProps, "title"> {
    completedIcon?: React.ReactNode
    icon?: React.ReactNode
    title?: React.ReactNode
    description?: React.ReactNode
}

export const StepsItem = React.forwardRef<HTMLDivElement, StepsItemProps>(
    function StepsItem(props, ref) {
        const { title, description, completedIcon, icon, ...rest } = props
        return (
            <ChakraSteps.Item ref={ref} {...rest}>
                <ChakraSteps.Trigger cursor="default">
                    <ChakraSteps.Indicator
                        _active={{
                            bg: "brand.500",
                            color: "white",
                            borderColor: "brand.400",
                            shadow: "0 0 20px rgba(34, 197, 94, 0.3)"
                        }}
                        _complete={{
                            bg: "brand.600",
                            color: "white",
                            borderColor: "brand.500"
                        }}
                        _incomplete={{
                            bg: "bg.muted",
                            borderColor: "border.subtle",
                            color: "fg.muted"
                        }}
                    >
                        <ChakraSteps.Status
                            complete={completedIcon || <LuCheck />}
                            incomplete={icon || (rest.index !== undefined ? rest.index + 1 : undefined)}
                        />
                    </ChakraSteps.Indicator>
                    {(title || description) && (
                        <React.Fragment>
                            {title && <ChakraSteps.Title fontWeight="black" color="fg.primary" letterSpacing="tight">{title}</ChakraSteps.Title>}
                            {description && (
                                <ChakraSteps.Description color="fg.muted" fontSize="2xs" fontWeight="medium">{description}</ChakraSteps.Description>
                            )}
                        </React.Fragment>
                    )}
                </ChakraSteps.Trigger>
            </ChakraSteps.Item>
        )
    },
)

export interface StepsRootProps extends ChakraSteps.RootProps {
    count?: number
}

export const StepsRoot = React.forwardRef<HTMLDivElement, StepsRootProps>(
    function StepsRoot(props, ref) {
        const { count, children, ...rest } = props
        return (
            <ChakraSteps.Root ref={ref} {...rest}>
                {children}
            </ChakraSteps.Root>
        )
    },
)

export const StepsContent = ChakraSteps.Content
export const StepsIndicator = ChakraSteps.Indicator
export const StepsList = React.forwardRef<HTMLDivElement, ChakraSteps.ListProps>(
    function StepsList(props, ref) {
        return (
            <ChakraSteps.List
                ref={ref}
                {...props}
                css={{
                    "--steps-color": "colors.brand.500",
                    "& [data-part=separator]": {
                        backgroundColor: "border.subtle",
                        "&[data-complete]": {
                            backgroundColor: "brand.500"
                        }
                    }
                }}
            />
        )
    }
)
export const StepsNextTrigger = ChakraSteps.NextTrigger
export const StepsPrevTrigger = ChakraSteps.PrevTrigger
export const StepsTrigger = ChakraSteps.Trigger

export const Steps = {
    Root: StepsRoot,
    List: StepsList,
    Item: StepsItem,
    CompletedContent: StepsCompletedContent,
    Content: StepsContent,
    Indicator: StepsIndicator,
    NextTrigger: StepsNextTrigger,
    PrevTrigger: StepsPrevTrigger,
    Trigger: StepsTrigger,
}
