import {
    Box,
    Stack,
    Text,
    Input,
    Separator,
    HStack,
    Container,
    Link,
    VStack,
    Flex,
    Image,
} from '@chakra-ui/react';
import { AuthButton } from '../../components/ui/AuthButton';
import { FaGoogle } from 'react-icons/fa';
import { Link as RLink, useNavigate } from "react-router";
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { signupSchema } from '../../schemas/signupSchema';
import * as yup from 'yup';
import { useState } from 'react';
import { Center } from '@chakra-ui/react';
import { LoadSpinner } from '../../components/ui/LoadSpinner';

import { useAuth } from '../../hooks/useAuth';
import { LuSquareCheck, LuX } from 'react-icons/lu';
import { PasswordInput } from '../../components/ui/password-input';
import { motion } from 'motion/react';
import { toaster, Toaster } from '../../components/ui/toaster';
import SpotlightCard from '../../components/SpotlightCard/SpotlightCard';
import GradientText from '../../components/GradientText/GradientText';
import { logger } from '../../utils/logger';
import { supabase } from '../../utils/supabase';
import { MIN_PASSWORD_LENGTH, MAX_PASSWORD_LENGTH } from '../../constants/password';

type SignupFormData = yup.InferType<typeof signupSchema>;

const MotionStack = motion.create(Stack);

const SignupPage = () => {
    const { register, handleSubmit, formState: { errors }, setValue, trigger } = useForm<SignupFormData>({
        resolver: yupResolver(signupSchema),
    });

    const [passwordChecks, setPasswordChecks] = useState({
        length: false,
        uppercase: false,
        lowercase: false,
        symbol: false,
        number: false,
    });

    const [loadingData, setLoadingData] = useState({
        isSubmitting: false,
    });

    // Use the auth hook to check session and redirect if authenticated
    const { isLoading: isCheckingSession } = useAuth({ redirectIfAuthenticated: true });

    const setLoading = (key: string, value: boolean) => {
        setLoadingData((prevState) => ({
            ...prevState,
            [key]: value,
        }));
    };

    const router = useNavigate(); // Initialize the router

    // Show loading spinner while checking session
    if (isCheckingSession) {
        return <LoadSpinner message="Verifying session..." />;
    }


    const onSubmit = async (data: SignupFormData) => {
        setLoading('isSubmitting', true);

        try {
            const { error } = await supabase.auth.signUp({
                email: data.email,
                password: data.password,
                options: {
                    data: {
                        full_name: data.name,
                    }
                }
            });

            if (error) throw error;

            toaster.create({
                title: "Registration successful!",
                description: "Please check your email for the confirmation link.",
                type: "success",
            });

            setTimeout(() => {
                router('/login');
            }, 3000);

        } catch (error) {
            const err = error as { message?: string };
            toaster.create({
                title: "Registration failed",
                description: err.message || "Something went wrong",
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
                redirectTo: `${window.location.origin}/dashboard`,
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

        setPasswordChecks({
            length: value.length >= MIN_PASSWORD_LENGTH && value.length <= MAX_PASSWORD_LENGTH,
            number: /\d/.test(value),
            uppercase: /[A-Z]/.test(value),
            lowercase: /[a-z]/.test(value),
            symbol: /[!@#$%^&*(),.?":{}|<>]/.test(value),
        });
    };

    const Checker = ({ condition }: { condition: boolean; }) => condition ? <LuSquareCheck size={16} color='var(--chakra-colors-green-400)' /> : <LuX size={16} color='var(--chakra-colors-red-400)' />;

    return (
        <Box minH="100vh" bg="transparent" display="flex" alignItems="center" justifyContent="center" p={4} position="relative" overflow="hidden">

            {/* Ambient Background Glow */}
            <Box position="absolute" top="0" left="0" w="full" h="full" bg="bg.canvas" opacity={0.8} zIndex={0} />
            <Box position="absolute" bottom="-20%" right="-10%" w="500px" h="500px" bg="purple.900" filter="blur(150px)" opacity={0.4} borderRadius="full" />
            <Box position="absolute" top="-20%" left="-10%" w="500px" h="500px" bg="blue.900" filter="blur(150px)" opacity={0.3} borderRadius="full" />

            <Container maxW="md" position="relative" zIndex={1}>
                <SpotlightCard className="w-full rounded-3xl border border-border-subtle shadow-2xl bg-bg-surface backdrop-blur-xl" spotlightColor="rgba(255, 255, 255, 0.05)">
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
                                Create Account
                            </GradientText>
                            <Text color="fg.muted" fontSize="sm" textAlign="center">
                                Join KeyVault for secure password management
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
                                    <Text fontSize="xs" fontWeight="medium" color="fg.muted" ml={1}>Password</Text>
                                    <Box position="relative">
                                        <PasswordInput
                                            tabIndex={2}
                                            placeholder="Create a strong password"
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

                                    {/* Password Strength Indicators */}
                                    {(passwordChecks.length || passwordChecks.number || passwordChecks.uppercase || passwordChecks.lowercase || passwordChecks.symbol) && (
                                        <MotionStack
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            transition={{ duration: 0.3 }}
                                            mt={3}
                                            gap={2}
                                            fontSize={"xs"}
                                            color="fg.muted"
                                            wrap="wrap"
                                            direction="row"
                                        >
                                            <Flex align="center" gap={1.5} bg="bg.muted" px={2} py={1} rounded="md">
                                                <Checker condition={passwordChecks.length} /> <Text>{MIN_PASSWORD_LENGTH}-{MAX_PASSWORD_LENGTH} chars</Text>
                                            </Flex>
                                            <Flex align="center" gap={1.5} bg="bg.muted" px={2} py={1} rounded="md">
                                                <Checker condition={passwordChecks.number} /> <Text>Digit</Text>
                                            </Flex>
                                            <Flex align="center" gap={1.5} bg="bg.muted" px={2} py={1} rounded="md">
                                                <Checker condition={passwordChecks.uppercase} /> <Text>Upper</Text>
                                            </Flex>
                                            <Flex align="center" gap={1.5} bg="bg.muted" px={2} py={1} rounded="md">
                                                <Checker condition={passwordChecks.lowercase} /> <Text>Lower</Text>
                                            </Flex>
                                            <Flex align="center" gap={1.5} bg="bg.muted" px={2} py={1} rounded="md">
                                                <Checker condition={passwordChecks.symbol} /> <Text>Symbol</Text>
                                            </Flex>
                                        </MotionStack>
                                    )}
                                </Box>

                                <AuthButton
                                    type="submit"
                                    isLoading={loadingData.isSubmitting}
                                    loadingText="Creating Account..."
                                >
                                    Create Account
                                </AuthButton>
                            </Stack>
                        </form>

                        <HStack width="full" align="center" px={2}>
                            <Separator flex="1" borderColor="border.subtle" opacity={0.5} />
                            <Text color="fg.muted" fontSize="xs" fontWeight="bold" textTransform="uppercase" letterSpacing="widest" px={2}>
                                Or join with
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
                            Already have an account?{' '}
                            <Link asChild color="brand.400" fontWeight="semibold" _hover={{ textDecoration: 'underline' }}>
                                <RLink to="/login">
                                    Sign in
                                </RLink>
                            </Link>
                        </Text>
                    </Stack>
                </SpotlightCard>

                <Box textAlign="center" mt={8}>
                    <Text fontSize="xs" color="fg.muted" opacity={0.6}>
                        By creating an account, you agree to our Terms and Privacy Policy.
                    </Text>
                </Box>
            </Container>
            <Toaster />
        </Box>
    );
};

export default SignupPage;