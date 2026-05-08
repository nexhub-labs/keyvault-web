import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { useVaultContext } from '../../context/VaultContext';
import { PasswordInput } from '../../components/ui/password-input';
import {
    Box, Container, VStack, Heading, Text, Input, Tabs, HStack,
    Spinner, Flex, Image, Separator
} from '@chakra-ui/react';
import { AuthButton } from '../../components/ui/AuthButton';
import { PinInput } from '../../components/ui/pin-input';
import {
    DialogBody,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogRoot,
    DialogTitle,
} from "../../components/ui/dialog";
import { toaster } from '../../components/ui/toaster';
import {
    requestRecoveryOTPAPI, verifyRecoveryOTPAPI,
    initiateTrustedRecoveryAPI, checkRecoveryStatusAPI,
    setupMasterAPI, initiate2FAResetOTPAPI, reset2FAWithRecoveryKeyAPI,
    getAuthSaltAPI
} from '../../api/auth';
import { supabase } from '../../utils/supabase';
import { retrievePasswordAPI, storePasswordAPI } from '../../api/vault';
import {
    combineShares, deriveMasterPasswordHash, wrapMasterSeed,
    deriveMekFromSeed, generateSalt, hashRecoveryKey, generateRecoveryKey,
    decryptWithKey, encryptWithKey, exportKeyRaw, importKeyRaw
} from '../../utils/crypto';
import { LuShieldAlert, LuUsers, LuMail, LuShieldX, LuKey } from 'react-icons/lu';
import { BackButton } from '../../components/ui/BackButton';
import { logger } from '../../utils/logger';
import SpotlightCard from '../../components/SpotlightCard/SpotlightCard';
import GradientText from '../../components/GradientText/GradientText';

const Recovery = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const mode = searchParams.get('mode');

    const { setMek, setVaultKey, setSalt } = useVaultContext();
    const [loading, setLoading] = useState(false);

    // Common State
    const [email, setEmail] = useState('');
    const [recoveryKey, setRecoveryKey] = useState('');
    const [otp, setOtp] = useState('');
    const [otpSent, setOtpSent] = useState(false);

    // Trusted Contacts State
    const [recoveryStatus, setRecoveryStatus] = useState<'idle' | 'pending' | 'complete' | 'expired'>('idle');
    const [approvedCount, setApprovedCount] = useState(0);

    // Reset State
    const [masterSeed, setMasterSeed] = useState<string | null>(null);
    const [existingVaultSalt, setExistingVaultSalt] = useState<string | null>(null);
    const [newPassword, setNewPassword] = useState('');
    const [newRecoveryKey, setNewRecoveryKey] = useState('');

    // --- Tab Selection Logic ---
    const [activeTab, setActiveTab] = useState(mode === '2fa' ? '2fa' : 'key');

    // --- Shared Reconstruction Logic ---
    const handleSuccessfulReconstruction = async (seed: string, vaultSalt: string) => {
        setMasterSeed(seed);
        setExistingVaultSalt(vaultSalt);
        setRecoveryStatus('complete');

        // Generate a fresh recovery key for the new setup
        setNewRecoveryKey(generateRecoveryKey());

        toaster.create({
            title: "Access Reconstructed",
            description: "Please set a new master password to secure your vault.",
            type: "success",
            duration: 5000
        });
    };

    const handlePasswordReset = async () => {
        if (!newPassword || newPassword.length < 8 || !masterSeed || !newRecoveryKey) {
            toaster.create({ title: "Invalid password or state", type: "error" });
            return;
        }

        setLoading(true);
        try {
            const masterPasswordSalt = generateSalt(16);
            const vaultSalt = existingVaultSalt || generateSalt(16);

            const oldMek = await deriveMekFromSeed(masterSeed, vaultSalt);

            let vaultKey: CryptoKey;
            try {
                const { encryptedData: oldEkEnc, iv: oldEkIv } = await retrievePasswordAPI("__VAULT_KEY__");
                const ekStr = await decryptWithKey(oldEkEnc, oldEkIv, oldMek);
                vaultKey = await importKeyRaw(Uint8Array.from(atob(ekStr), c => c.charCodeAt(0)).buffer);
            } catch (error) {
                const err = error as { response?: { status?: number } };
                if (err?.response?.status === 404) {
                    toaster.create({
                        title: "No Vault Found",
                        description: "Your vault is empty. Please use Master Setup to create a new vault.",
                        type: "warning",
                        duration: 8000
                    });
                    navigate('/setup-master');
                    return;
                }
                throw err;
            }

            const newMek = await deriveMekFromSeed(newRecoveryKey, vaultSalt);
            const rawEk = await exportKeyRaw(vaultKey);
            const rawEkStr = btoa(String.fromCharCode(...new Uint8Array(rawEk)));
            const { encryptedData: newEkEnc, iv: newEkIv } = await encryptWithKey(rawEkStr, newMek);

            const { wrappedSeed, iv: wrappedSeedIv } = await wrapMasterSeed(newRecoveryKey, newPassword, masterPasswordSalt);
            const rKeyHashHex = await hashRecoveryKey(newRecoveryKey);

            // A. Fetch email from authenticated session
            const { data: { user } } = await supabase.auth.getUser();
            if (!user || !user.email) {
                toaster.create({ title: "Session error", description: "Please log in again.", type: "error" });
                return;
            }

            // B. Fetch Server-Issued Auth Salt
            const { authSalt } = await getAuthSaltAPI(user.email);

            // C. Derive MPH (Server Auth) from new Master Password using Server Salt
            const mph = await deriveMasterPasswordHash(newPassword, authSalt);

            await setupMasterAPI({
                masterPasswordHash: mph,
                recoveryKeyHash: rKeyHashHex,
                vaultSalt,
                masterPasswordSalt,
                wrappedMasterSeed: wrappedSeed,
                wrappedMasterSeedIv: wrappedSeedIv
            });

            await storePasswordAPI("__VAULT_KEY__", newEkEnc, newEkIv);

            setMek(newMek);
            setVaultKey(vaultKey);
            setSalt(vaultSalt);

            toaster.create({ title: "Password Reset Successful", type: "success" });
            navigate('/dashboard');
        } catch (error) {
            logger.error(error);
            toaster.create({ title: "Failed to reset password", type: "error" });
        } finally {
            setLoading(false);
        }
    };

    // --- Tab 1: Recovery Key Flow (Master Password) ---
    const handleRequestOTP = async () => {
        if (!email || !email.includes('@')) {
            toaster.create({ title: "Please enter a valid email", type: "error" });
            return;
        }
        if (!recoveryKey || recoveryKey.length < 10) {
            toaster.create({ title: "Invalid Recovery Key format", type: "error" });
            return;
        }

        setLoading(true);
        try {
            const rKeyHashHex = await hashRecoveryKey(recoveryKey);
            await requestRecoveryOTPAPI(email, rKeyHashHex);
            setOtpSent(true);
            toaster.create({ title: "OTP sent to your email", type: "success" });
        } catch (error) {
            logger.error(error);
            toaster.create({ title: "Failed to request OTP. Details may be incorrect.", type: "error" });
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async () => {
        setLoading(true);
        try {
            const rKeyHashHex = await hashRecoveryKey(recoveryKey);
            const response = await verifyRecoveryOTPAPI(email, rKeyHashHex, otp);
            await handleSuccessfulReconstruction(recoveryKey, response.vaultSalt);
        } catch (error) {
            logger.error(error);
            toaster.create({ title: "Invalid OTP or Recovery Failed", type: "error" });
        } finally {
            setLoading(false);
        }
    };

    // --- Tab 2: Trusted Contacts Flow ---
    const handleUnleashRecovery = async () => {
        setLoading(true);
        try {
            await initiateTrustedRecoveryAPI();
            setRecoveryStatus('pending');
            toaster.create({ title: "Recovery requests sent to contacts!", type: "info" });
        } catch (error) {
            logger.error(error);
            toaster.create({ title: "Failed to initiate recovery", type: "error" });
        } finally {
            setLoading(false);
        }
    };

    // --- Tab 3: 2FA Reset Flow ---
    const handleInitiate2FAReset = async () => {
        if (recoveryKey.length < 10) {
            toaster.create({ title: "Please enter your valid Recovery Key", type: "warning" });
            return;
        }

        setLoading(true);
        try {
            await initiate2FAResetOTPAPI();
            setOtpSent(true);
            toaster.create({ title: "Reset code sent to your email", type: "success" });
        } catch (error) {
            logger.error(error);
            toaster.create({ title: "Failed to send reset code.", type: "error" });
        } finally {
            setLoading(false);
        }
    };

    const handleReset2FA = async () => {
        if (otp.length !== 6) return;

        setLoading(true);
        try {
            const recoveryKeyHash = await hashRecoveryKey(recoveryKey);
            await reset2FAWithRecoveryKeyAPI(recoveryKeyHash, otp);

            toaster.create({
                title: "2FA Reset Successful",
                description: "You must now re-enroll in 2FA.",
                type: "success"
            });

            navigate('/setup-2fa');
        } catch (error) {
            logger.error(error);
            toaster.create({ title: "2FA reset failed. Check your Recovery Key and OTP.", type: "error" });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (recoveryStatus === 'pending') {
            interval = setInterval(async () => {
                try {
                    const data = await checkRecoveryStatusAPI();

                    if (data && data.status === 'pending') {
                        setApprovedCount(data.approvedCount || 0);
                    }

                    if (data && data.status === 'complete' && data.shards && data.vaultSalt) {
                        clearInterval(interval);
                        const seed = combineShares(data.shards);
                        await handleSuccessfulReconstruction(seed, data.vaultSalt);
                    }
                } catch (e) {
                    logger.error("Polling error", e);
                }
            }, 3000);
        }
        return () => clearInterval(interval);
    }, [recoveryStatus]);

    return (
        <Box minH="100vh" bg="bg.canvas" position="relative" overflow="hidden">
            {/* Background elements from Recovery2FA */}
            <Box position="absolute" top="10%" right="-5%" w="600px" h="600px" bg="red.900" filter="blur(160px)" opacity={0.15} borderRadius="full" zIndex={0} />
            <Box position="absolute" bottom="10%" left="-5%" w="400px" h="400px" bg="brand.900" filter="blur(160px)" opacity={0.1} borderRadius="full" zIndex={0} />

            <Container maxW="3xl" py={20} position="relative" zIndex={1}>
                <VStack spaceY={10} align="stretch">
                    <Box>
                        <BackButton to='/login' label="Back to Login" />
                    </Box>

                    <VStack spaceY={2} align="center" textAlign="center">
                        <Box p={3} bg="bg.muted" borderRadius="xl" border="1px solid" borderColor="border.subtle" mb={2}>
                            <Image src="/kv_outline.svg" alt="KeyVault Logo" boxSize={8} />
                        </Box>
                        <GradientText colors={["#fff", "#f87171", "#fff"]} animationSpeed={8} showBorder={false} className="text-4xl font-black tracking-tight">
                            Account Recovery
                        </GradientText>
                        <Text color="fg.muted" fontSize="md">
                            Restore access or reset security factors using your emergency credentials.
                        </Text>
                    </VStack>

                    <SpotlightCard className="w-full rounded-3xl border border-white/5 shadow-2xl bg-bg-surface backdrop-blur-xl" spotlightColor="rgba(248, 113, 113, 0.03)">
                        <Tabs.Root value={activeTab} onValueChange={(e) => { setActiveTab(e.value); setOtpSent(false); setOtp(''); }} variant="plain" fitted>
                            <Tabs.List bg="bg.muted" rounded="2xl" p={1.5} border="1px solid" borderColor="border.subtle">
                                <Tabs.Trigger value="key" flex="1" rounded="xl" py={3} _selected={{ bg: "bg.subtle", shadow: "sm", color: "fg.primary" }}>
                                    <HStack gap={2}><LuKey size={18} /> <Text fontSize="sm" fontWeight="bold">Recovery Key</Text></HStack>
                                </Tabs.Trigger>
                                <Tabs.Trigger value="2fa" flex="1" rounded="xl" py={3} _selected={{ bg: "bg.subtle", shadow: "sm", color: "fg.primary" }}>
                                    <HStack gap={2}><LuShieldX size={18} /> <Text fontSize="sm" fontWeight="bold">2FA Reset</Text></HStack>
                                </Tabs.Trigger>
                                <Tabs.Trigger value="trusted" flex="1" rounded="xl" py={3} _selected={{ bg: "bg.subtle", shadow: "sm", color: "fg.primary" }}>
                                    <HStack gap={2}><LuUsers size={18} /> <Text fontSize="sm" fontWeight="bold">Contacts</Text></HStack>
                                </Tabs.Trigger>
                            </Tabs.List>

                            {/* --- Recovery Key Tab (Master Password) --- */}
                            <Tabs.Content value="key" mt={8}>
                                <VStack align="stretch" spaceY={6} p={4}>
                                    <VStack align="center" textAlign="center" spaceY={1}>
                                        <Heading size="md" color="fg.primary">Master Seed Recovery</Heading>
                                        <Text fontSize="sm" color="fg.muted">Enter your email and 64-character Master Seed (hex) to recover your vault.</Text>
                                    </VStack>

                                    <Input
                                        placeholder="Email Address"
                                        type="email"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        bg="bg.muted"
                                        border="1px solid"
                                        borderColor="border.subtle"
                                        rounded="xl"
                                        h="60px"
                                        textAlign="center"
                                        fontSize="md"
                                    />
                                    <Input
                                        placeholder="Enter Master Seed (Hex)"
                                        value={recoveryKey}
                                        onChange={e => setRecoveryKey(e.target.value)}
                                        bg="bg.muted"
                                        border="1px solid"
                                        borderColor="border.subtle"
                                        rounded="xl"
                                        h="60px"
                                        textAlign="center"
                                        fontFamily="mono"
                                        fontSize="md"
                                    />

                                    {otpSent && (
                                        <VStack spaceY={4}>
                                            <Separator borderColor="border.subtle" />
                                            <Text fontSize="xs" color="fg.muted" textAlign="center">Enter the code sent to your email:</Text>
                                            <Flex justify="center">
                                                <PinInput length={6} value={otp} onChange={setOtp} onComplete={() => handleVerifyOTP()} />
                                            </Flex>
                                        </VStack>
                                    )}

                                    <AuthButton
                                        isLoading={loading}
                                        onClick={otpSent ? handleVerifyOTP : handleRequestOTP}
                                        loadingText={otpSent ? "Verifying..." : "Requesting OTP..."}
                                    >
                                        <Flex align="center" gap={2}>
                                            {otpSent ? "Verify & Reconstruct" : "Verify Key & Request OTP"}
                                            {otpSent ? <LuShieldAlert /> : <LuMail />}
                                        </Flex>
                                    </AuthButton>
                                </VStack>
                            </Tabs.Content>

                            {/* --- 2FA Reset Tab --- */}
                            <Tabs.Content value="2fa" mt={8}>
                                <VStack align="stretch" spaceY={6} p={4}>
                                    <VStack align="center" textAlign="center" spaceY={1}>
                                        <Heading size="md" color="fg.primary">Emergency 2FA Reset</Heading>
                                        <Text fontSize="sm" color="fg.muted">Lost your device? Use your Recovery Key to disable 2FA.</Text>
                                    </VStack>

                                    <Input
                                        placeholder="Enter Master Seed / Recovery Key"
                                        value={recoveryKey}
                                        onChange={e => setRecoveryKey(e.target.value)}
                                        bg="bg.muted"
                                        border="1px solid"
                                        borderColor="border.subtle"
                                        rounded="xl"
                                        h="60px"
                                        textAlign="center"
                                        fontFamily="mono"
                                        fontSize="md"
                                    />

                                    {otpSent && (
                                        <VStack spaceY={4}>
                                            <Separator borderColor="border.subtle" />
                                            <Text fontSize="xs" color="fg.muted" textAlign="center">Enter the code sent to your email:</Text>
                                            <Flex justify="center">
                                                <PinInput length={6} value={otp} onChange={setOtp} onComplete={() => handleReset2FA()} />
                                            </Flex>
                                        </VStack>
                                    )}

                                    <AuthButton
                                        isLoading={loading}
                                        onClick={otpSent ? handleReset2FA : handleInitiate2FAReset}
                                        loadingText={otpSent ? "Resetting..." : "Sending Code..."}
                                    >
                                        <Flex align="center" gap={2}>
                                            {otpSent ? "Confirm & Reset 2FA" : "Verify Key & Send Reset Code"}
                                            {otpSent ? <LuShieldX /> : <LuMail />}
                                        </Flex>
                                    </AuthButton>
                                </VStack>
                            </Tabs.Content>

                            {/* --- Trusted Contacts Tab --- */}
                            <Tabs.Content value="trusted" mt={8}>
                                <VStack align="stretch" spaceY={6} p={4}>
                                    <VStack align="center" textAlign="center" spaceY={1}>
                                        <Heading size="md" color="fg.primary">Social Recovery</Heading>
                                        <Text fontSize="sm" color="fg.muted">Reconstruct your keys through your trusted contact circle.</Text>
                                    </VStack>

                                    {recoveryStatus === 'idle' ? (
                                        <AuthButton
                                            isLoading={loading}
                                            onClick={handleUnleashRecovery}
                                            loadingText="Initiating..."
                                        >
                                            <Flex align="center" gap={2}>Send Magic Links to Contacts <LuUsers /></Flex>
                                        </AuthButton>
                                    ) : (
                                        <VStack py={4} spaceY={4}>
                                            <Flex direction="column" align="center" justify="center" position="relative">
                                                <Spinner size="xl" color="red.500" />
                                                <Text position="absolute" fontSize="sm" fontWeight="black" color="fg.primary">{approvedCount}/3</Text>
                                            </Flex>
                                            <VStack gap={0}>
                                                <Text color="brand.400" fontWeight="bold">Waiting for approvals</Text>
                                                <Text color="fg.muted" fontSize="xs">2 of 3 contacts must click their magic links.</Text>
                                            </VStack>
                                        </VStack>
                                    )}
                                </VStack>
                            </Tabs.Content>
                        </Tabs.Root>
                    </SpotlightCard>

                    {/* Success Modal for Reconstruction */}
                    <DialogRoot open={recoveryStatus === 'complete'} onOpenChange={(e) => { if (!e.open && recoveryStatus !== 'complete') setRecoveryStatus('idle') }}>
                        <DialogContent bg="bg.elevated" border="1px solid" borderColor="white/10" shadow="2xl" rounded="3xl">
                            <DialogHeader>
                                <DialogTitle color="red.400" fontWeight="black" fontSize="2xl">Access Restored!</DialogTitle>
                            </DialogHeader>
                            <DialogBody>
                                <VStack align="stretch" spaceY={6}>
                                    <Text color="fg.muted" fontSize="sm">Your Master Seed has been reconstructed. Please save your **NEW Master Seed** and set a new password to secure your vault.</Text>

                                    <Box p={5} bg="black" rounded="2xl" border="1px solid" borderColor="red.900/50" shadow="inner">
                                        <Text fontSize="2xs" color="gray.600" mb={2} fontWeight="bold" letterSpacing="widest">NEW MASTER SEED (CRITICAL):</Text>
                                        <Text color="red.300" fontFamily="mono" fontSize="sm" wordBreak="break-all" fontWeight="bold">{newRecoveryKey}</Text>
                                    </Box>

                                    <VStack align="stretch" spaceY={2}>
                                        <Text fontSize="xs" color="fg.muted" fontWeight="bold">SET NEW MASTER PASSWORD:</Text>
                                        <PasswordInput
                                            placeholder="Enter new strong password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            bg="bg.muted"
                                            rounded="xl"
                                        />
                                    </VStack>
                                </VStack>
                            </DialogBody>
                            <DialogFooter p={6}>
                                <AuthButton
                                    isLoading={loading}
                                    onClick={handlePasswordReset}
                                    loadingText="Securing..."
                                >
                                    Update Password & Unlock Vault
                                </AuthButton>
                            </DialogFooter>
                        </DialogContent>
                    </DialogRoot>

                    <Text textAlign="center" fontSize="xs" color="fg.muted" cursor="pointer" onClick={() => navigate('/login')} _hover={{ color: "fg.primary" }}>
                        Cancel and return to login
                    </Text>
                </VStack>
            </Container>
        </Box>
    );
};

export default Recovery;
