import { Slider as ChakraSlider, For } from "@chakra-ui/react"
import * as React from "react"

export interface SliderProps extends ChakraSlider.RootProps {
  marks?: Array<number | { value: number; label: React.ReactNode }>
  label?: React.ReactNode
  showValue?: boolean
}

export const Slider = React.forwardRef<HTMLDivElement, SliderProps>(
  function Slider(props, ref) {
    const { marks: marksProp, label, showValue, ...rest } = props
    const value = props.defaultValue ?? props.value

    const marks = marksProp?.map((mark) => {
      if (typeof mark === "number") return { value: mark, label: undefined }
      return mark
    })

    const hasMarkLabel = !!marks?.some((mark) => mark.label)

    return (
      <ChakraSlider.Root ref={ref} thumbAlignment="center" {...rest}>
        {label && (
          <ChakraSlider.Label mb="2">{label}</ChakraSlider.Label>
        )}
        <ChakraSlider.Control mb={hasMarkLabel ? "4" : "0"}>
          <ChakraSlider.Track>
            <ChakraSlider.Range />
          </ChakraSlider.Track>
          <ChakraSlider.Thumb index={0}>
            {showValue && (
              <ChakraSlider.ValueText 
                position="absolute" 
                top="-7" 
                fontSize="xs" 
                fontWeight="bold" 
                color="green.400"
              >
                {value}
              </ChakraSlider.ValueText>
            )}
          </ChakraSlider.Thumb>
        </ChakraSlider.Control>
        {marks && (
          <ChakraSlider.MarkerGroup>
            <For each={marks}>
              {(mark) => (
                <ChakraSlider.Marker value={mark.value}>
                  {mark.label}
                </ChakraSlider.Marker>
              )}
            </For>
          </ChakraSlider.MarkerGroup>
        )}
      </ChakraSlider.Root>
    )
  },
)
