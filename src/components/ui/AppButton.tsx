import { Button, ButtonProps } from "@chakra-ui/react";
import React from "react";

interface AppButtonProps extends Omit<ButtonProps, "variant"> {
    variant?: "primary" | "outline" | "ghost";
    size?: "sm" | "md" | "lg";
}

export const AppButton: React.FC<AppButtonProps> = ({
    variant = "primary",
    size = "md",
    children,
    ...props
}) => {
    const sizeMap = {
        sm: { h: "34px", px: "14px", fontSize: "0.72rem" },
        md: { h: "42px", px: "20px", fontSize: "0.8rem" },
        lg: { h: "50px", px: "26px", fontSize: "0.88rem" },
    };

    const { h, px, fontSize } = sizeMap[size];

    const base: Partial<ButtonProps> = {
        h,
        px,
        fontSize,
        fontWeight: "600",
        letterSpacing: "0.04em",
        textTransform: "uppercase",
        borderRadius: "full",
        border: "1px solid transparent",
        transition: "all 0.12s ease",
        _focusVisible: {
            outline: "2px solid #22c55e",
            outlineOffset: "3px",
        },
    };

    const primaryStyles: Partial<ButtonProps> = {
        bg: "#22c55e",
        color: "#050505",
        borderColor: "#22c55e",
        fontWeight: "700",
        _hover: {
            bg: "transparent",
            color: "#22c55e",
            borderColor: "#22c55e",
        },
        _active: {
            bg: "rgba(34,197,94,0.12)",
            color: "#22c55e",
            borderColor: "#22c55e",
        },
    };

    const outlineStyles: Partial<ButtonProps> = {
        bg: "transparent",
        color: "rgba(255,255,255,0.5)",
        borderColor: "rgba(255,255,255,0.15)",
        _hover: {
            borderColor: "#22c55e",
            color: "#22c55e",
        },
        _active: {
            bg: "rgba(34,197,94,0.06)",
            borderColor: "#22c55e",
            color: "#22c55e",
        },
    };

    const ghostStyles: Partial<ButtonProps> = {
        bg: "transparent",
        color: "rgba(255,255,255,0.4)",
        borderColor: "transparent",
        _hover: {
            color: "#ffffff",
            bg: "rgba(255,255,255,0.06)",
        },
        _active: {
            bg: "rgba(255,255,255,0.1)",
        },
    };

    const variantStyles =
        variant === "primary"
            ? primaryStyles
            : variant === "outline"
                ? outlineStyles
                : ghostStyles;

    return (
        <Button
            {...base}
            {...variantStyles}
            {...props}
        >
            {children}
        </Button>
    );
};

export default AppButton;