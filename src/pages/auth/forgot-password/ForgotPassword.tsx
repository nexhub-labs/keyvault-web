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
    Image,
} from '@chakra-ui/react';
import { Link as RLink } from "react-router";
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useState } from 'react';
import { initiateSupabasePasswordRecoveryAPI } from '../../../api/auth';
import SpotlightCard from '../../../components/SpotlightCard/SpotlightCard';
import GradientText from '../../../components/GradientText/GradientText';
import { Toaster, toaster } from '../../../components/ui/toaster';
import { LuArrowLeft, LuMail } from 'react-icons/lu';
import { forgotPasswordSchema } from '../../../utils/validation';
import { AuthButton } from '../../../components/ui/AuthButton';

type ForgotPasswordFormData = {
    email: string;
};

interface LoadingStates {
    isSubmitting: boolean;
}

const ForgotPasswordPage = () => {
    const { register, handleSubmit, formState: { errors }, setValue, trigger } = useForm<ForgotPasswordFormData>({
        resolver: yupResolver(forgotPasswordSchema),
    });

    const [loadingData, setLoadingData] = useState<LoadingStates>({
        isSubmitting: false,
    });

    const [emailSent, setEmailSent] = useState(false);
    const [submittedEmail, setSubmittedEmail] = useState('');

    const setLoading = (key: keyof LoadingStates, value: boolean): void => {
        setLoadingData((prevState) => ({
            ...prevState,
            [key]: value,
        }));
    };

    const onSubmit = async (data: ForgotPasswordFormData): Promise<void> => {
        setLoading('isSubmitting', true);

        try {
            const response = await initiateSupabasePasswordRecoveryAPI(data.email);

            setSubmittedEmail(data.email);
            setEmailSent(true);

            toaster.create({
                title: "Password recovery email sent",
                description: response.message,
                type: "success"
            });

        } catch (error) {
            const err = error as { message?: string };
            toaster.create({
                title: "Recovery failed",
                description: err.message || "Unable to send recovery email. Please try again.",
                type: "error"
            });
        } finally {
            setLoading('isSubmitting', false);
        }
    };

    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        const value = e.target.value;
        setValue('email', value);
        trigger('email');
    };

    const handleTryAgain = (): void => {
        setEmailSent(false);
        setSubmittedEmail('');
        setValue('email', '');
    };

    return (
        <Box minH="100vh" bg="transparent" display="flex" alignItems="center" justifyContent="center" p={4} position="relative" overflow="hidden">

            {/* Ambient Background Glow */}
            <Box position="absolute" top="0" left="0" w="full" h="full" bg="bg.canvas" opacity={0.8} zIndex={0} />
            <Box position="absolute" top="-20%" right="-10%" w="500px" h="500px" bg="blue.900" filter="blur(150px)" opacity={0.4} borderRadius="full" />
            <Box position="absolute" bottom="-20%" left="-10%" w="500px" h="500px" bg="green.900" filter="blur(150px)" opacity={0.3} borderRadius="full" />

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
                                Reset Password
                            </GradientText>
                            <Text color="fg.muted" fontSize="sm" textAlign="center">
                                Enter your email to receive password reset instructions
                            </Text>
                        </VStack>

                        {/* Back to Login Link */}
                        <HStack justify="flex-start">
                            <Link asChild color="brand.400" fontSize="sm" _hover={{ textDecoration: 'underline' }}>
                                <RLink to="/login">
                                    <Box as="span" mr={2}>
                                        <LuArrowLeft />
                                    </Box>
                                    Back to Login
                                </RLink>
                            </Link>
                        </HStack>

                        {emailSent ? (
                            // Success message after email sent
                            <VStack spaceY={6} align="stretch" textAlign="center">
                                <Box p={6} bg="green.500/10" border="1px solid" borderColor="green.500/30" borderRadius="xl">
                                    <Box as="span" display="inline-flex" alignItems="center" justifyContent="center" w={12} h={12} bg="brand.400/20" borderRadius="full" mb={4}>
                                        <LuMail size={24} color="var(--chakra-colors-brand-400)" />
                                    </Box>
                                    <Text fontSize="lg" fontWeight="semibold" color="fg.primary" mb={2}>
                                        Check Your Email
                                    </Text>
                                    <Text color="fg.muted" lineHeight="1.6">
                                        We've sent password reset instructions to <strong>{submittedEmail}</strong>.
                                        Please check your inbox and follow the link to reset your password.
                                    </Text>
                                </Box>

                                <AuthButton
                                    onClick={handleTryAgain}
                                    variant="secondary"
                                >
                                    Try Different Email
                                </AuthButton>
                            </VStack>
                        ) : (
                            // Original form
                            <form onSubmit={handleSubmit(onSubmit)} style={{ width: '100%' }}>
                                <Stack spaceY={5}>
                                    <Box spaceY={1.5}>
                                        <Text fontSize="xs" fontWeight="medium" color="fg.muted" ml={1}>Email Address</Text>
                                        <Input
                                            tabIndex={1}
                                            type='email'
                                            placeholder="name@example.com"
                                            {...register("email")}
                                            onChange={handleEmailChange}
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

                                    <AuthButton
                                        type="submit"
                                        isLoading={loadingData.isSubmitting}
                                        loadingText="Sending..."
                                    >
                                        Send Recovery Email
                                    </AuthButton>
                                </Stack>
                            </form>
                        )}

                        <Separator borderColor="border.subtle" />

                        <VStack spaceY={3} align="stretch">
                            <Text fontSize="sm" color="fg.muted" textAlign="center">
                                Don't have an account?{' '}
                                <Link asChild color="brand.400" fontWeight="semibold" _hover={{ textDecoration: 'underline' }}>
                                    <RLink to="/signup">
                                        Sign up
                                    </RLink>
                                </Link>
                            </Text>

                            <Text fontSize="xs" color="fg.muted" textAlign="center" lineHeight="1.5" opacity={0.6}>
                                After resetting your password, you'll need to set up your vault again.<br />
                                Make sure to save your recovery key in a secure location.
                            </Text>
                        </VStack>
                    </Stack>
                </SpotlightCard>

                <Box textAlign="center" mt={8}>
                    <Text fontSize="xs" color="fg.muted" opacity={0.4}>
                        @{new Date().getFullYear()} KeyVault. Secure. Reliable. Fast.
                    </Text>
                </Box>
            </Container>
            <Toaster />
        </Box>
    );
};

export default ForgotPasswordPage;