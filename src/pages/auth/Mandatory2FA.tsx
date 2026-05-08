import { useState, useEffect } from 'react';
import {
    Box,
    VStack,
    Text,
    Image,
    Container,
    Heading,
    Flex,
    Separator,
    HStack,
    IconButton,
    Stack
} from '@chakra-ui/react';
import { LuShieldCheck, LuCopy, LuDownload, LuArrowRight } from 'react-icons/lu';
import { useNavigate } from 'react-router';
import { setup2FAAPI, activate2FAAPI, TwoFASetupResponse, getMasterPasswordStatusAPI } from '../../api/auth';
import { useVaultContext } from '../../context/VaultContext';
import { toaster } from '../../components/ui/toaster';
import { PinInput } from '../../components/ui/pin-input';
import { AuthButton } from '../../components/ui/AuthButton';
import SpotlightCard from '../../components/SpotlightCard/SpotlightCard';
import GradientText from '../../components/GradientText/GradientText';
import { LoadSpinner } from '../../components/ui/LoadSpinner';


const Mandatory2FA = () => {
    const navigate = useNavigate();
    const { copyToClipboard, isUnlocked } = useVaultContext();
    const [setupStep, setSetupStep] = useState<'setup' | 'backup'>('setup');
    const [setupData, setSetupData] = useState<TwoFASetupResponse | null>(null);
    const [token, setToken] = useState('');
    const [backupCodes, setBackupCodes] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);

    useEffect(() => {
        const startSetup = async () => {
            try {
                // Guard 1: Master password MUST be set up before 2FA
                const status = await getMasterPasswordStatusAPI();
                if (!status.hasMasterSetup) {
                    navigate('/setup-master');
                    return;
                }

                // Guard 2: Vault must be unlocked (proof of master password verification).
                // Without this, a session hijacker could navigate directly to /setup-2fa
                // and register their own 2FA on the victim's account.
                if (!isUnlocked) {
                    navigate('/unlock-vault');
                    return;
                }

                const data = await setup2FAAPI();
                setSetupData(data);
            } catch (error) {
                console.error('Failed to start 2FA setup:', error);
                toaster.create({ title: "Failed to initialize security setup", type: "error" });
            } finally {
                setFetching(false);
            }
        };
        startSetup();
    }, [isUnlocked, navigate]);

    const handleActivate = async () => {
        if (!setupData || token.length !== 6) return;

        setLoading(true);
        try {
            const data = await activate2FAAPI(setupData.totpSetupKey, token);
            setBackupCodes(data.backupCodes);
            setSetupStep('backup');
            toaster.create({ title: '2FA activated successfully', type: 'success' });
        } catch (error) {
            const err = error as { response?: { data?: { message?: string } } };
            toaster.create({
                title: err.response?.data?.message || 'Verification failed',
                type: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadBackupCodes = () => {
        const text = `Keyvault Backup Codes\n\nGenerated on: ${new Date().toLocaleString()}\n\n${backupCodes.join('\n')}\n\nKeep these codes in a secure, physical location.`;
        const element = document.createElement('a');
        const file = new Blob([text], { type: 'text/plain' });
        element.href = URL.createObjectURL(file);
        element.download = 'keyvault-backup-codes.txt';
        document.body.appendChild(element);
        element.click();
    };

    if (fetching) {
        return <LoadSpinner message="Securing your account..." />;
    }


    return (
        <Box minH="100vh" bg="transparent" position="relative" overflow="hidden">
            <Box position="absolute" top="0" left="0" w="full" h="full" bg="bg.canvas" opacity={0.8} zIndex={0} />
            <Box position="absolute" top="10%" right="-5%" w="600px" h="600px" bg="brand.900" filter="blur(160px)" opacity={0.4} borderRadius="full" zIndex={0} />

            <Container maxW="xl" py={20} position="relative" zIndex={1}>
                <VStack spaceY={10} align="stretch">
                    <VStack spaceY={2} align="center" textAlign="center">
                        <Box p={3} bg="bg.muted" borderRadius="xl" border="1px solid" borderColor="border.subtle" mb={2}>
                            <Image src="/kv_outline.svg" alt="KeyVault Logo" boxSize={8} />
                        </Box>
                        <GradientText colors={["#fff", "#ccc", "#fff"]} animationSpeed={8} showBorder={false} className="text-4xl font-black tracking-tight">
                            Security Requirement
                        </GradientText>
                        <Text color="fg.muted" fontSize="md">
                            Keyvault requires Two-Factor Authentication for all accounts.
                        </Text>
                    </VStack>

                    <SpotlightCard className="w-full rounded-3xl border border-border-subtle shadow-2xl bg-bg-surface backdrop-blur-xl" spotlightColor="rgba(59, 130, 246, 0.05)">
                        {setupStep === 'setup' ? (
                            <Stack spaceY={6} p={8}>
                                <VStack align="center" textAlign="center" spaceY={2}>
                                    <Heading size="md" color="fg.primary">Approve Your Identity</Heading>
                                    <Text fontSize="sm" color="fg.muted">
                                        Scan the QR code below and enter the 6-digit code to complete your security setup.
                                    </Text>
                                </VStack>

                                <VStack align="center" spaceY={6} py={4}>
                                    <Box p={4} bg="white" rounded="3xl" shadow="xl">
                                        {setupData?.qrCodeUrl && <Image src={setupData.qrCodeUrl} alt="2FA QR Code" boxSize="200px" />}
                                    </Box>

                                    <VStack spaceY={2} w="full">
                                        <HStack bg="bg.muted" p={3} rounded="xl" w="full" justify="space-between" border="1px solid" borderColor="border.subtle">
                                            <VStack align="start" spaceY={0}>
                                                <Text fontSize="2xs" fontWeight="bold" color="fg.muted">SECRET KEY</Text>
                                                <Text fontSize="sm" fontFamily="mono" fontWeight="bold" color="fg.primary">{setupData?.totpSetupKey}</Text>
                                            </VStack>
                                            <IconButton size="xs" variant="ghost" onClick={() => copyToClipboard(setupData?.totpSetupKey || '', "2FA Secret Key")} color="fg.muted">
                                                <LuCopy />
                                            </IconButton>
                                        </HStack>
                                    </VStack>

                                    <Separator borderColor="border.subtle" />

                                    <VStack align="stretch" spaceY={4} w="full">
                                        <Box>
                                            <Text fontSize="xs" fontWeight="black" color="fg.muted" textTransform="uppercase" letterSpacing="widest" mb={4} textAlign="center">Enter 6-Digit Code</Text>
                                            <Flex justify="center">
                                                <PinInput length={6} value={token} onChange={setToken} />
                                            </Flex>
                                        </Box>
                                        <AuthButton isLoading={loading} onClick={handleActivate} disabled={token.length !== 6}>
                                            <Flex align="center" gap={2}>Verify & Secure Account <LuShieldCheck /></Flex>
                                        </AuthButton>
                                        <Text fontSize="xs" color="fg.muted" textAlign="center" cursor="pointer" onClick={() => navigate('/recovery?mode=2fa')}>
                                            Lost your device? <Box as="span" color="brand.400" fontWeight="bold">Reset via Recovery Key</Box>
                                        </Text>
                                    </VStack>
                                </VStack>
                            </Stack>
                        ) : (
                            <Stack spaceY={6} p={8}>
                                <VStack align="center" textAlign="center" spaceY={2}>
                                    <Heading size="md" color="green.400">Identity Verified!</Heading>
                                    <Text fontSize="sm" color="fg.muted">
                                        Your account is now fully protected. Save these backup codes securely.
                                    </Text>
                                </VStack>

                                <Box p={6} bg="bg.muted" rounded="3xl" border="1px solid" borderColor="green.500/30">
                                    <Flex wrap="wrap" gap={4} justify="center">
                                        {backupCodes.map((code, i) => (
                                            <Box key={i} p={2} bg="bg.surface" rounded="lg" border="1px solid" borderColor="border.subtle" w="120px" textAlign="center">
                                                <Text fontFamily="mono" fontWeight="bold" fontSize="sm">{code}</Text>
                                            </Box>
                                        ))}
                                    </Flex>
                                </Box>

                                <HStack spaceX={4} w="full">
                                    <AuthButton variant="outline" onClick={handleDownloadBackupCodes}>
                                        <LuDownload /> Download .txt
                                    </AuthButton>
                                    <AuthButton onClick={() => navigate('/dashboard')}>
                                        Enter Vault <LuArrowRight />
                                    </AuthButton>
                                </HStack>
                            </Stack>
                        )}
                    </SpotlightCard>
                </VStack>
            </Container>
        </Box>
    );
};

export default Mandatory2FA;
