import {
    Box,
    Stack,
    Text,
    Input,
    Separator,
    HStack,
    Container,
    Link,
    Flex,
    VStack,
    Image,
} from '@chakra-ui/react';
import { AuthButton } from '../..//components/ui/AuthButton';
import { FaGoogle } from 'react-icons/fa';
import { Link as RLink, useNavigate } from "react-router";
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { loginSchema } from '../../schemas/loginSchema';
import * as yup from 'yup';
import { useState } from 'react';
import { supabase } from '../../utils/supabase';
import { LoadSpinner } from '../../components/ui/LoadSpinner';

import { PasswordInput } from '../../components/ui/password-input';
import SpotlightCard from '../../components/SpotlightCard/SpotlightCard';
import GradientText from '../../components/GradientText/GradientText';
import { Toaster, toaster } from '../../components/ui/toaster';
import { logger } from '../../utils/logger';
import { useAuth } from '../../hooks/useAuth';
import { useColorModeValue } from '../../components/ui/color-mode';

type LoginFormData = yup.InferType<typeof loginSchema>;

const LoginPage = () => {
    const { register, handleSubmit, formState: { errors }, setValue, trigger } = useForm<LoginFormData>({
        resolver: yupResolver(loginSchema),
    });

    const [loadingData, setLoadingData] = useState({
        isSubmitting: false,
    });

    // Use the auth hook to check session and redirect if authenticated
    const { isLoading: isCheckingSession } = useAuth({ redirectIfAuthenticated: true });

    // All hooks MUST be called before any early returns (Rules of Hooks)
    const borderColor = useColorModeValue("gray.200", "border.subtle");
    const shadowSize = useColorModeValue("xl", "2xl");
    const bgColor = useColorModeValue("white", "bg.surface");
    const spotlightColor = useColorModeValue("rgba(0, 0, 0, 0.05)", "rgba(255, 255, 255, 0.05)");

    const setLoading = (key: string, value: boolean) => {
        setLoadingData((prevState) => ({
            ...prevState,
            [key]: value,
        }));
    };

    const router = useNavigate();

    // Show loading spinner while checking session
    if (isCheckingSession) {
        return <LoadSpinner message="Verifying session..." />;
    }


    const onSubmit = async (data: LoginFormData) => {
        setLoading('isSubmitting', true);

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email: data.email,
                password: data.password,
            });

            if (error) throw error;

            toaster.create({
                title: "Authentication successful",
                description: "Please unlock your vault...",
                type: "success",
            });

            // Redirect to vault unlock page (two-factor unlock flow)
            setTimeout(() => {
                router('/unlock-vault');
            }, 1500);

        } catch (error) {
            const err = error as { message?: string };
            toaster.create({
                title: "Login failed",
                description: err.message || "Invalid email or password",
                type: "error",
            });
        } finally {
            setLoading('isSubmitting', false);
        }
    };

    const handleGoogleLogin = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/dashboard`, // Redirect back to your app after login
            },
        });

        if (error) {
            logger.error('Error logging in with Google:', error.message);
        }
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;

        setValue('password', value);
        trigger('password');
    };

    return (
        <Box minH="100vh" bg="transparent" display="flex" alignItems="center" justifyContent="center" p={4} position="relative" overflow="hidden">

            {/* Ambient Background Glow */}
            <Box position="absolute" top="0" left="0" w="full" h="full" bg="bg.canvas" opacity={0.8} zIndex={0} />
            <Box position="absolute" top="-20%" right="-10%" w="500px" h="500px" bg="blue.900" filter="blur(150px)" opacity={0.4} borderRadius="full" />
            <Box position="absolute" bottom="-20%" left="-10%" w="500px" h="500px" bg="green.900" filter="blur(150px)" opacity={0.3} borderRadius="full" />

            <Container maxW="md" position="relative" zIndex={1}>
                <SpotlightCard
                    w="full"
                    rounded="3xl"
                    border="1px solid"
                    borderColor={borderColor}
                    shadow={shadowSize}
                    bg={bgColor}
                    backdropFilter="blur(xl)"
                    spotlightColor={spotlightColor}
                >
                    <Stack spaceY={8} p={8}>

                        {/* Header */}
                        <VStack spaceY={2} align="center">
                            <Box p={3} bg="bg.muted" borderRadius="xl" border="1px solid" borderColor="border.subtle" mb={2} overflow="hidden">
                                <Image src="/kv_outline.svg" alt="KeyVault Logo" boxSize={8} objectFit="contain" />
                            </Box>
                            <GradientText
                                colors={["#fff", "#ccc", "#fff"]}
                                animationSpeed={8}
                                showBorder={false}
                                className="text-3xl font-bold tracking-tight text-center"
                            >
                                Welcome Back
                            </GradientText>
                            <Text color="fg.muted" fontSize="sm" textAlign="center">
                                Enter your credentials to access your vault
                            </Text>
                        </VStack>

                        <form onSubmit={handleSubmit(onSubmit)} style={{ width: '100%' }}>
                            <Stack spaceY={5}>
                                <Box spaceY={1.5}>
                                    <Text fontSize="xs" fontWeight="medium" color="fg.muted" ml={1}>Email</Text>
                                    <Input
                                        tabIndex={1}
                                        type='email'
                                        placeholder="name@example.com"
                                        {...register("email")}
                                        bg="bg.muted"
                                        border="1px solid"
                                        borderColor="border.subtle"
                                        color="fg.primary"
                                        _placeholder={{ color: "fg.muted", opacity: 0.5 }}
                                        _focus={{ borderColor: "brand.400", bg: "bg.muted", outline: "none" }}
                                        rounded="xl"
                                        size="lg"
                                    />
                                    {errors.email && (
                                        <Text color="red.400" fontSize="xs" ml={1}>
                                            {errors.email.message}
                                        </Text>
                                    )}
                                </Box>
                                <Box spaceY={1.5}>
                                    <Flex justify="space-between" align="center">
                                        <Text fontSize="xs" fontWeight="medium" color="fg.muted" ml={1}>Password</Text>
                                        <Link asChild color="brand.400" fontSize="xs" _hover={{ textDecoration: 'underline' }}>
                                            <RLink to="/forgot-password">
                                                Forgot Password?
                                            </RLink>
                                        </Link>
                                    </Flex>
                                    <Box position="relative">
                                        <PasswordInput
                                            tabIndex={2}
                                            placeholder="••••••••"
                                            {...register("password")}
                                            onChange={handlePasswordChange}
                                            bg="bg.muted"
                                            border="1px solid"
                                            borderColor="border.subtle"
                                            color="fg.primary"
                                            _placeholder={{ color: "fg.muted", opacity: 0.5 }}
                                            _focus={{ borderColor: "brand.400", bg: "bg.muted", outline: "none" }}
                                            rounded="xl"
                                            size="lg"
                                        />
                                    </Box>
                                    {errors.password && (
                                        <Text color="red.400" fontSize="xs" ml={1}>
                                            {errors.password.message}
                                        </Text>
                                    )}
                                </Box>

                                <AuthButton
                                    type="submit"
                                    isLoading={loadingData.isSubmitting}
                                    loadingText="Signing In..."
                                >
                                    Sign In
                                </AuthButton>
                            </Stack>
                        </form>

                        <HStack width="full" align="center" px={2}>
                            <Separator flex="1" borderColor="border.subtle" opacity={0.5} />
                            <Text color="fg.muted" fontSize="xs" fontWeight="bold" textTransform="uppercase" letterSpacing="widest" px={2}>
                                Or continue with
                            </Text>
                            <Separator flex="1" borderColor="border.subtle" opacity={0.5} />
                        </HStack>

                        <AuthButton
                            variant="secondary"
                            onClick={handleGoogleLogin}
                        >
                            <FaGoogle size={18} /> <Text ml={2}>Google</Text>
                        </AuthButton>

                        <Text fontSize="sm" color="fg.muted" textAlign="center">
                            Don't have an account?{' '}
                            <Link asChild color="brand.400" fontWeight="semibold" _hover={{ textDecoration: 'underline' }}>
                                <RLink to="/signup">
                                    Sign up
                                </RLink>
                            </Link>
                        </Text>
                    </Stack>
                </SpotlightCard>

                <Box textAlign="center" mt={8}>
                    <Text fontSize="xs" color="fg.muted" opacity={0.6}>
                        @{new Date().getFullYear()} KeyVault. Secure. Reliable. Fast.
                    </Text>
                </Box>
            </Container>
            <Toaster />
        </Box>
    );
};

export default LoginPage;
