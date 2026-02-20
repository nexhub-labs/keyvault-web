// src/schemas/signupSchema.ts
import * as yup from 'yup';

export const signupSchema = yup.object({
    name: yup
        .string()
        .optional() // Make the field optional
        .transform((value) => value ? value.toLowerCase() : value) // Ensure the value is lowercase if provided
        .matches(/^[a-z0-9@]+$/, {
            message: "Username should contain only lowercase letters, numbers, and the @ symbol"
        }),

    email: yup
        .string()
        .required("Email is required")
        .email("Invalid email address")
        .lowercase()
        .trim(),

    password: yup
        .string()
        .required("Password is required")
        .min(8, "Password must be at least 8 characters long")
        .max(32, "Password must be at most 32 characters long")
        .matches(/[a-z]/, "Password must contain at least one lowercase letter")
        .matches(/[A-Z]/, "Password must contain at least one uppercase letter")
        .matches(/\d/, "Password must contain at least one digit")
        .matches(/[\W_]/, "Password must contain at least one special symbol"),
});