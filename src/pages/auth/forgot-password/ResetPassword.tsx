import {
    Box,
    Stack,
    Text,
    Separator,
    Container,
    VStack,
    HStack,
} from '@chakra-ui/react';
import { AuthButton } from '../../../components/ui/AuthButton';
import { useNavigate, useLocation } from "react-router";
import { LuTriangle, LuArrowLeft, LuCircleCheck } from 'react-icons/lu';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useState, useEffect } from 'react';
import SpotlightCard from '../../../components/SpotlightCard/SpotlightCard';
import GradientText from '../../../components/GradientText/GradientText';
import { Toaster, toaster } from '../../../components/ui/toaster';
import { ResetPasswordFormData, resetPasswordSchema } from '../../../utils/validation';
import { supabase } from '../../../utils/supabase';

import { PasswordInput } from '../../../components/ui/password-input';

const ResetPasswordPage = () => {
    const router = useNavigate();
    const location = useLocation();

    const [isExpired, setIsExpired] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [token, setToken] = useState<string | null>(null);
    const [email, setEmail] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors }
    } = useForm<ResetPasswordFormData>({
        resolver: yupResolver(resetPasswordSchema),
        mode: 'onChange', // Validate on change for real-time feedback
    });

    const newPassword = watch('newPassword');
    const confirmPassword = watch('confirmPassword');
    const isMatching = newPassword && confirmPassword && newPassword === confirmPassword;
    const hasStartedConfirming = confirmPassword && confirmPassword.length > 0;

    // Parse URL hash parameters on component mount
    useEffect(() => {
        const hash = location.hash.substring(1); // Remove the '#'
        const search = location.search.substring(1); // Remove the '?'

        // Try to find parameters in either hash or search string
        const params = new URLSearchParams(hash || search);

        const error = params.get('error');
        const errorCode = params.get('error_code');
        const errorDescription = params.get('error_description');

        if (error || errorCode || errorDescription) {
            toaster.create({
                title: "Invalid Recovery Link",
                description: errorDescription || "The recovery link is invalid or has expired.",
                type: "error",
            });
            setIsExpired(true);
            return;
        }

        // 1. Check for access_token (Implicit flow - common for recovery emails)
        const accessToken = params.get('access_token');
        if (accessToken) {
            // In this flow, Supabase has already authenticated the session
            // We can proceed directly to password update
            setIsExpired(false);
            // console.log("Authenticated via access_token");
            return;
        }

        // 2. Check for token_hash (PKCE/OTP flow)
        const tokenHash = params.get('token_hash');
        const type = params.get('type');
        const userEmail = params.get('email');

        if (tokenHash && type === 'recovery') {
            setToken(tokenHash);
            setEmail(userEmail);
            setIsExpired(false);
            // console.log("Detected token_hash for verification");
        } else {
            // Check if we are already authenticated (maybe user clicked back or refreshed)
            const checkSession = async () => {
                const { data } = await supabase.auth.getSession();
                if (data.session) {
                    setIsExpired(false);
                } else {
                    setIsExpired(true);
                }
            };
            checkSession();
        }
    }, [location]);

    const handleGoToLogin = (): void => {
        router('/login');
    };

    const handleResetPassword = async (data: ResetPasswordFormData): Promise<void> => {
        setIsLoading(true);

        try {
            // Check if we already have a session (from access_token)
            const { data: sessionData } = await supabase.auth.getSession();

            if (!sessionData.session && token) {
                // Step 1: Verify the OTP token if no session exists but we have a token_hash
                const { error: verifyError } = await supabase.auth.verifyOtp({
                    token_hash: token,
                    type: 'recovery',
                });

                if (verifyError) {
                    if (verifyError.code === 'otp_expired') {
                        setIsExpired(true);
                        toaster.create({
                            title: "Recovery Link Expired",
                            description: "This recovery link has expired. Please request a new one.",
                            type: "error",
                        });
                        return;
                    }
                    throw verifyError;
                }
            } else if (!sessionData.session && !token) {
                throw new Error("No active session or valid recovery token found. Please try the recovery link again.");
            }

            // Step 2: Update password
            const { error: updateError } = await supabase.auth.updateUser({
                password: data.newPassword
            });

            if (updateError) {
                throw updateError;
            }

            toaster.create({
                title: "Password Reset Successful",
                description: "Your password has been reset successfully. You can now log in with your new password.",
                type: "success",
            });

            // Redirect to login after success
            setTimeout(() => {
                router('/login');
            }, 2000);

        } catch (error) {
            const err = error as { message?: string };
            toaster.create({
                title: "Reset Failed",
                description: err.message || "Unable to reset password. Please try again.",
                type: "error",
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Show expired link UI
    if (isExpired) {
        return (
            <Box minH="100vh" bg="transparent" display="flex" alignItems="center" justifyContent="center" p={4} position="relative" overflow="hidden">
                {/* Ambient Background Glow */}
                <Box position="absolute" top="0" left="0" w="full" h="full" bg="bg.canvas" opacity={0.8} zIndex={0} />
                <Box position="absolute" top="-20%" right="-10%" w="500px" h="500px" bg="red.900" filter="blur(150px)" opacity={0.4} borderRadius="full" />
                <Box position="absolute" bottom="-20%" left="-10%" w="500px" h="500px" bg="orange.900" filter="blur(150px)" opacity={0.3} borderRadius="full" />

                <Container maxW="md" position="relative" zIndex={1}>
                    <SpotlightCard className="w-full rounded-3xl border border-border-subtle shadow-2xl bg-bg-surface backdrop-blur-xl" spotlightColor="rgba(255, 255, 255, 0.05)">
                        <Stack spaceY={8} p={8}>

                            {/* Header */}
                            <VStack spaceY={4} align="center">
                                <Box p={4} bg="red.500/20" borderRadius="full" border="1px solid" borderColor="red.500/30">
                                    <LuTriangle size={40} color="var(--chakra-colors-red-400)" />
                                </Box>
                                <GradientText
                                    colors={["#fff", "#ccc", "#fff"]}
                                    animationSpeed={8}
                                    showBorder={false}
                                    className="text-3xl font-bold tracking-tight text-center"
                                >
                                    Link Expired
                                </GradientText>
                                <Text color="fg.muted" fontSize="sm" textAlign="center">
                                    This password recovery link has expired for security reasons.
                                </Text>
                            </VStack>

                            <Separator borderColor="border.subtle" />

                            <Text fontSize="sm" color="fg.muted" textAlign="center">
                                The recovery link has expired. Please request a new recovery link.
                            </Text>

                            <Stack spaceY={3}>
                                <AuthButton
                                    onClick={handleGoToLogin}
                                    variant="secondary"
                                >
                                    <LuArrowLeft size={18} style={{ marginRight: '8px' }} />
                                    Back to Login
                                </AuthButton>
                            </Stack>

                            <Separator borderColor="border.subtle" />

                            <Text fontSize="xs" color="fg.muted" textAlign="center" opacity={0.6}>
                                Check your spam folder if you don't see the recovery email.
                            </Text>
                        </Stack>
                    </SpotlightCard>
                </Container>
                <Toaster />
            </Box>
        );
    }

    // Show reset password form
    return (
        <Box minH="100vh" bg="transparent" display="flex" alignItems="center" justifyContent="center" p={4} position="relative" overflow="hidden">
            {/* Ambient Background Glow */}
            <Box position="absolute" top="0" left="0" w="full" h="full" bg="bg.canvas" opacity={0.8} zIndex={0} />
            <Box position="absolute" top="-20%" right="-10%" w="500px" h="500px" bg="green.900" filter="blur(150px)" opacity={0.4} borderRadius="full" />
            <Box position="absolute" bottom="-20%" left="-10%" w="500px" h="500px" bg="blue.900" filter="blur(150px)" opacity={0.3} borderRadius="full" />

            <Container maxW="md" position="relative" zIndex={1}>
                <SpotlightCard className="w-full rounded-3xl border border-border-subtle shadow-2xl bg-bg-surface backdrop-blur-xl" spotlightColor="rgba(255, 255, 255, 0.05)">
                    <Stack spaceY={8} p={8}>

                        {/* Header */}
                        <VStack spaceY={4} align="center">
                            <Box p={4} bg="green.500/20" borderRadius="full" border="1px solid" borderColor="green.500/30">
                                <LuCircleCheck size={40} color="var(--chakra-colors-green-400)" />
                            </Box>
                            <GradientText
                                colors={["#fff", "#ccc", "#fff"]}
                                animationSpeed={8}
                                showBorder={false}
                                className="text-3xl font-bold tracking-tight text-center"
                            >
                                Reset Password
                            </GradientText>
                            <Text color="fg.muted" fontSize="sm" textAlign="center">
                                {email ? `Enter your new password for ${email}.` : "Enter your new password below."}
                            </Text>
                        </VStack>

                        <Separator borderColor="border.subtle" />

                        <form onSubmit={handleSubmit(handleResetPassword)} style={{ width: '100%' }}>
                            <Stack spaceY={4}>
                                <Box position="relative">
                                    <PasswordInput
                                        placeholder="New password"
                                        {...register("newPassword")}
                                        bg="bg.muted"
                                        border="1px solid"
                                        borderColor="border.subtle"
                                        color="fg.primary"
                                        _placeholder={{ color: "fg.muted", opacity: 0.5 }}
                                        _focus={{ borderColor: "brand.400", bg: "bg.muted" }}
                                        rounded="xl"
                                        size="lg"
                                        showStrength
                                    />
                                    {errors.newPassword && (
                                        <Text color="red.400" fontSize="xs" mt={1}>
                                            {errors.newPassword.message}
                                        </Text>
                                    )}
                                </Box>

                                <Box position="relative">
                                    <PasswordInput
                                        placeholder="Confirm password"
                                        {...register("confirmPassword")}
                                        bg="bg.muted"
                                        border="1px solid"
                                        borderColor="border.subtle"
                                        color="fg.primary"
                                        _placeholder={{ color: "fg.muted", opacity: 0.5 }}
                                        _focus={{ borderColor: "brand.400", bg: "bg.muted" }}
                                        rounded="xl"
                                        size="lg"
                                    />
                                    {errors.confirmPassword && (
                                        <Text color="red.400" fontSize="xs" mt={1}>
                                            {errors.confirmPassword.message}
                                        </Text>
                                    )}
                                    {!errors.confirmPassword && hasStartedConfirming && (
                                        <HStack justify="space-between" mt={1} fontSize="xs">
                                            <Text color={isMatching ? "brand.400" : "red.400"} fontWeight="600">
                                                {isMatching ? "Passwords match" : "Passwords do not match"}
                                            </Text>
                                            {isMatching && <LuCircleCheck size={14} color="var(--chakra-colors-brand-400)" />}
                                        </HStack>
                                    )}
                                </Box>

                                <AuthButton
                                    type="submit"
                                    isLoading={isLoading}
                                    loadingText="Resetting..."
                                >
                                    Reset Password
                                </AuthButton>
                            </Stack>
                        </form>

                        <Separator borderColor="border.subtle" />

                        <VStack spaceY={2} align="stretch">
                            <AuthButton
                                variant="secondary"
                                onClick={handleGoToLogin}
                                size="sm"
                            >
                                <LuArrowLeft size={16} style={{ marginRight: '8px' }} />
                                Back to Login
                            </AuthButton>

                            <Text fontSize="xs" color="fg.muted" textAlign="center" opacity={0.6}>
                                You'll be redirected to login after resetting your password.
                            </Text>
                        </VStack>
                    </Stack>
                </SpotlightCard>
            </Container>
            <Toaster />
        </Box>
    );
};

export default ResetPasswordPage;