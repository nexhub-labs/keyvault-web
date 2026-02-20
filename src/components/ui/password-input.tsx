import { forwardRef, useState } from 'react';
import {
  Input,
  Box,
  Text,
  HStack,
  InputProps as ChakraInputProps,
} from '@chakra-ui/react';
import { LuEye, LuEyeOff } from 'react-icons/lu';

export interface PasswordInputProps extends Omit<ChakraInputProps, 'type'> {
  showStrength?: boolean;
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ showStrength, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const [internalValue, setInternalValue] = useState('');

    // Use external value if provided (controlled), otherwise use internal state
    const passwordValue = props.value !== undefined ? (props.value as string) : internalValue;

    const getPasswordStrength = (password: string) => {
      if (!password) return { score: 0, label: 'Empty', color: 'text.muted' };

      let score = 0;
      if (password.length >= 8) score++;
      if (password.length >= 12) score++;
      if (/[a-z]/.test(password)) score++;
      if (/[A-Z]/.test(password)) score++;
      if (/[0-9]/.test(password)) score++;
      if (/[^a-zA-Z0-9]/.test(password)) score++;

      const strength = score <= 2 ? { label: 'Weak', color: 'red.400' } :
        score <= 4 ? { label: 'Medium', color: 'yellow.400' } :
          { label: 'Strong', color: 'green.400' };

      return { ...strength, score };
    };

    const strengthInfo = getPasswordStrength(passwordValue);

    return (
      <Box width="full" position="relative">
        <Input
          {...props}
          ref={ref}
          type={showPassword ? 'text' : 'password'}
          onChange={(e) => {
            setInternalValue(e.target.value);
            props.onChange?.(e);
          }}
          pr={showStrength ? '4.5rem' : '3rem'}
          size={{ base: 'md', md: 'lg' }}
        />

        <HStack position="absolute" right="3" top={showStrength && passwordValue ? "30%" : "50%"} transform="translateY(-50%)" zIndex={2}>
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            style={{
              padding: '8px',
              borderRadius: '6px',
              cursor: 'pointer',
              background: 'transparent',
              transition: 'all 0.2s ease',
              border: 'none',
              outline: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {showPassword ? (
              <LuEyeOff size={16} color="text.secondary" />
            ) : (
              <LuEye size={16} color="text.secondary" />
            )}
          </button>
        </HStack>

        {showStrength && passwordValue && (
          <Box mt={2}>
            <HStack justify="space-between" fontSize="xs">
              <Text color="gray.500">Password Strength:</Text>
              <Text color={strengthInfo.color} fontWeight="600">
                {strengthInfo.label}
              </Text>
            </HStack>
            <Box
              h="2px"
              bg="white/10"
              borderRadius="full"
              overflow="hidden"
              mt={1}
            >
              <Box
                h="full"
                w={`${(strengthInfo.score / 6) * 100}%`}
                bg={strengthInfo.color}
                transition="all 0.3s ease"
              />
            </Box>
          </Box>
        )}
      </Box>
    );
  }
);

PasswordInput.displayName = 'PasswordInput';
