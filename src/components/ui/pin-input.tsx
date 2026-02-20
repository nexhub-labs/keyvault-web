import * as React from "react"
import { Box, HStack, Input } from "@chakra-ui/react"
import { useEffect, useRef } from "react"

export interface OTPInputProps {
    /** Number of digits (4 or 6) */
    length?: 4 | 6
    /** Current value */
    value?: string
    /** Called when value changes */
    onChange?: (value: string) => void
    /** Called when all digits are filled */
    onComplete?: (value: string) => void
    /** Auto-focus the first input on mount */
    autoFocus?: boolean
    /** Disable the input */
    disabled?: boolean
}

/**
 * World-class OTP Input Component
 * - Displays as separate visual boxes but manages a single value
 * - Auto-advances to next box on digit entry
 * - Supports backspace navigation
 * - Supports paste of full OTP code
 * - Keyboard navigation with arrow keys
 */
export const OTPInput: React.FC<OTPInputProps> = ({
    length = 6,
    value = "",
    onChange,
    onComplete,
    autoFocus = true,
    disabled = false,
}) => {
    const inputRefs = useRef<(HTMLInputElement | null)[]>([])
    const [digits, setDigits] = React.useState<string[]>(
        value.split("").slice(0, length).concat(Array(length).fill("")).slice(0, length)
    )

    // Sync external value changes
    useEffect(() => {
        const newDigits = value.split("").slice(0, length).concat(Array(length).fill("")).slice(0, length)
        setDigits(newDigits)
    }, [value, length])

    // Auto-focus first input on mount
    useEffect(() => {
        if (autoFocus && inputRefs.current[0]) {
            inputRefs.current[0].focus()
        }
    }, [autoFocus])

    const focusInput = (index: number) => {
        if (index >= 0 && index < length && inputRefs.current[index]) {
            inputRefs.current[index]?.focus()
            inputRefs.current[index]?.select()
        }
    }

    const updateValue = (newDigits: string[]) => {
        setDigits(newDigits)
        const newValue = newDigits.join("")
        onChange?.(newValue)

        // Check if complete
        if (newDigits.every(d => d !== "") && newDigits.length === length) {
            onComplete?.(newValue)
        }
    }

    const handleChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const inputValue = e.target.value

        // Only accept digits
        const digit = inputValue.replace(/\D/g, "").slice(-1)

        if (digit) {
            const newDigits = [...digits]
            newDigits[index] = digit
            updateValue(newDigits)

            // Auto-advance to next input
            if (index < length - 1) {
                focusInput(index + 1)
            }
        }
    }

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        switch (e.key) {
            case "Backspace":
                e.preventDefault()
                const newDigits = [...digits]
                if (digits[index]) {
                    // Clear current digit
                    newDigits[index] = ""
                    updateValue(newDigits)
                } else if (index > 0) {
                    // Move to previous and clear it
                    newDigits[index - 1] = ""
                    updateValue(newDigits)
                    focusInput(index - 1)
                }
                break
            case "ArrowLeft":
                e.preventDefault()
                focusInput(index - 1)
                break
            case "ArrowRight":
                e.preventDefault()
                focusInput(index + 1)
                break
            case "Delete":
                e.preventDefault()
                const delDigits = [...digits]
                delDigits[index] = ""
                updateValue(delDigits)
                break
        }
    }

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault()
        const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length)

        if (pastedData) {
            const newDigits = pastedData.split("").concat(Array(length).fill("")).slice(0, length)
            updateValue(newDigits)

            // Focus last filled input or the next empty one
            const lastFilledIndex = Math.min(pastedData.length, length) - 1
            focusInput(lastFilledIndex < length - 1 ? lastFilledIndex + 1 : lastFilledIndex)
        }
    }

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
        e.target.select()
    }

    return (
        <HStack gap="2" justify="center">
            {digits.map((digit, index) => (
                <Box key={index} position="relative">
                    <Input
                        ref={(el) => { inputRefs.current[index] = el }}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleChange(index, e)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        onPaste={handlePaste}
                        onFocus={handleFocus}
                        disabled={disabled}
                        autoComplete="one-time-code"
                        textAlign="center"
                        fontSize="2xl"
                        fontWeight="bold"
                        width="14"
                        height="14"
                        bg="bg.muted"
                        color="fg.primary"
                        border="2px solid"
                        borderColor="border.subtle"
                        borderRadius="xl"
                        _hover={{
                            borderColor: "border.emphasized"
                        }}
                        _focus={{
                            borderColor: "brand.400",
                            boxShadow: "0 0 0 3px var(--chakra-colors-brand-900)",
                            outline: "none"
                        }}
                        _disabled={{
                            opacity: 0.5,
                            cursor: "not-allowed"
                        }}
                        transition="all 0.15s ease"
                    />
                </Box>
            ))}
        </HStack>
    )
}

// Re-export for backwards compatibility with existing PinInput usage
export { OTPInput as PinInput }
