import { Button, ButtonProps, Spinner, Box } from "@chakra-ui/react";

interface AuthButtonProps extends Omit<ButtonProps, "variant"> {
    isLoading?: boolean;
    loadingText?: string;
    variant?: "primary" | "secondary" | "outline" | "ghost";
}

export const AuthButton = ({
    children,
    isLoading,
    loadingText,
    variant = "primary",
    ...props
}: AuthButtonProps) => {
    const isPrimary = variant === "primary";

    return (
        <Button
            size="lg"
            width="100%"
            rounded="xl"
            fontWeight="bold"
            transition="all 0.2s"
            disabled={isLoading || props.disabled}
            position="relative"
            bg={isPrimary ? "brand.500" : "bg.muted"}
            color={isPrimary ? "black" : "fg.primary"}
            border={isPrimary ? "none" : "1px solid"}
            borderColor={isPrimary ? "transparent" : "border.subtle"}
            _hover={{
                bg: isPrimary ? "brand.600" : "bg.subtle",
                borderColor: isPrimary ? "transparent" : "border.primary",
                boxShadow: "sm",
            }}
            _active={{
                transform: "scale(0.98)",
            }}
            {...props}
        >
            {isLoading ? (
                <Box display="flex" alignItems="center" gap={2}>
                    <Spinner size="sm" color={isPrimary ? "black" : "white"} />
                    {loadingText && <Box as="span">{loadingText}</Box>}
                </Box>
            ) : (
                children
            )}
        </Button>
    );
};
