import * as yup from 'yup';

// Profile form schema
export const profileSchema = yup.object({
  fullName: yup
    .string()
    .min(1, 'Name cannot be empty')
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name cannot exceed 50 characters')
    .matches(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes'),
});

// Password change form schema
export const passwordChangeSchema = yup.object({
  newPassword: yup
    .string()
    .min(6, 'Password must be at least 6 characters')
    .max(128, 'Password cannot exceed 128 characters'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('newPassword')], 'Passwords do not match'),
});

// Validation schema for reset password form
export const resetPasswordSchema = yup.object({
  newPassword: yup
    .string()
    .required('New password is required')
    .min(6, 'Password must be at least 6 characters')
    .max(128, 'Password cannot exceed 128 characters'),
  confirmPassword: yup
    .string()
    .required('Please confirm your password')
    .oneOf([yup.ref('newPassword')], 'Passwords do not match'),
});

// Trusted contacts form schema
export const trustedContactsSchema = yup.object({
  contacts: yup
    .array()
    .of(yup.string().email('Please enter a valid email address').required('Email is required'))
    .min(3, 'Exactly 3 trusted contacts are required')
    .max(3, 'Exactly 3 trusted contacts are required')
    .test(
      'unique-emails',
      'Trusted contacts must have unique email addresses',
      function (contacts) {
        if (!contacts) return true;
        // Check for unique emails (case insensitive)
        const uniqueEmails = new Set(contacts.map(email => email.toLowerCase()));
        return uniqueEmails.size === contacts.length;
      }
    )
    .test(
      'no-empty-strings',
      'All contact fields must be filled',
      function (contacts) {
        if (!contacts) return true;
        // Ensure no empty strings in the array
        return contacts.every(email => email.trim() !== '');
      }
    ),
});

// Recovery key form schema
export const recoveryKeySchema = yup.object({
  recoveryKey: yup
    .string()
    .length(32, 'Recovery key must be exactly 32 characters')
    .matches(/^[0-9a-fA-F]+$/, 'Recovery key must contain only hexadecimal characters'),
});

// OTP verification schema
export const otpSchema = yup.object({
  otp: yup
    .string()
    .length(6, 'OTP must be exactly 6 digits')
    .matches(/^\d+$/, 'OTP must contain only numbers'),
});

// Forgot Password form schema
export const forgotPasswordSchema = yup.object({
  email: yup
    .string()
    .email('Please enter a valid email address')
    .required('Email is required'),
});

// Export types for form inference
export type ProfileFormValues = yup.InferType<typeof profileSchema>;
export type PasswordChangeFormValues = yup.InferType<typeof passwordChangeSchema>;
export type TrustedContactsFormValues = yup.InferType<typeof trustedContactsSchema>;
export type RecoveryKeyFormValues = yup.InferType<typeof recoveryKeySchema>;
export type OtpFormValues = yup.InferType<typeof otpSchema>;
export type ForgotPasswordFormValues = yup.InferType<typeof forgotPasswordSchema>;
export type ResetPasswordFormData = yup.InferType<typeof resetPasswordSchema>;
