import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useVaultContext } from '../../context/VaultContext';
import { PasswordInput } from '../../components/ui/password-input';
import {
    Box, Container, VStack, Heading, Text, Input, Tabs, HStack,
    Spinner, Flex
} from '@chakra-ui/react';
import { AuthButton } from '../../components/ui/AuthButton';
import { OTPInput } from '../../components/ui/pin-input';
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
    setupMasterAPI
} from '../../api/auth';
import { retrievePasswordAPI, storePasswordAPI } from '../../api/vault';
import {
    combineShares, deriveMasterPasswordHash, wrapMasterSeed,
    deriveMekFromSeed, generateSalt, hashRecoveryKey, generateRecoveryKey,
    decryptWithKey, encryptWithKey, exportKeyRaw, importKeyRaw
} from '../../utils/crypto';
import { LuShieldAlert, LuUsers, LuMail } from 'react-icons/lu';
import { BackButton } from '../../components/ui/BackButton';
import { logger } from '../../utils/logger';

const Recovery = () => {
    const navigate = useNavigate();
    const { setMek, setVaultKey, setSalt } = useVaultContext();
    const [loading, setLoading] = useState(false);

    // Recovery Key State
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

            // --- KEY ROTATION LOGIC ---

            // 1. Derive OLD MEK (to decrypt existing Vault Key)
            const oldMek = await deriveMekFromSeed(masterSeed, vaultSalt);

            // 2. Retrieve & Decrypt existing Vault Key
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

            // 3. Derive NEW MEK (KEK) from the NEW Recovery Key
            const newMek = await deriveMekFromSeed(newRecoveryKey, vaultSalt);

            // 4. Re-Encrypt the Vault Key with the NEW MEK
            const rawEk = await exportKeyRaw(vaultKey);
            const rawEkStr = btoa(String.fromCharCode(...new Uint8Array(rawEk)));
            const { encryptedData: newEkEnc, iv: newEkIv } = await encryptWithKey(rawEkStr, newMek);

            // 5. Wrap the NEW Recovery Key (New Seed) with the New Password
            const { wrappedSeed, iv: wrappedSeedIv } = await wrapMasterSeed(newRecoveryKey, newPassword, masterPasswordSalt);
            const rKeyHashHex = await hashRecoveryKey(newRecoveryKey);
            const mph = await deriveMasterPasswordHash(newPassword, masterPasswordSalt);

            // 6. Update Auth on Server
            await setupMasterAPI({
                masterPasswordHash: mph,
                recoveryKeyHash: rKeyHashHex,
                vaultSalt,
                masterPasswordSalt,
                wrappedMasterSeed: wrappedSeed,
                wrappedMasterSeedIv: wrappedSeedIv
            });

            // 7. Update Vault Key on Server
            await storePasswordAPI("__VAULT_KEY__", newEkEnc, newEkIv);

            // 8. Update Local Session
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

    // --- Tab 1: Recovery Key Flow ---
    const handleRequestOTP = async () => {
        if (!recoveryKey || recoveryKey.length < 10) {
            toaster.create({ title: "Invalid Recovery Key format", type: "error" });
            return;
        }

        setLoading(true);
        try {
            // Hash the input key to send to server for lookup
            const rKeyHash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(recoveryKey));
            const rKeyHashHex = Array.from(new Uint8Array(rKeyHash)).map(b => b.toString(16).padStart(2, '0')).join('');

            await requestRecoveryOTPAPI(rKeyHashHex);
            setOtpSent(true);
            toaster.create({ title: "OTP sent to your email", type: "success" });
        } catch (error) {
            logger.error(error);
            toaster.create({ title: "Failed to request OTP. Key may be incorrect.", type: "error" });
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async () => {
        setLoading(true);
        try {
            const rKeyHash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(recoveryKey));
            const rKeyHashHex = Array.from(new Uint8Array(rKeyHash)).map(b => b.toString(16).padStart(2, '0')).join('');

            // Verify OTP - in this flow, the user HAS the recovery key, which IS the master seed hex
            const response = await verifyRecoveryOTPAPI(rKeyHashHex, otp);

            // In our redesign, the recovery key IS the master seed.
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
            // Start Polling will happen in useEffect
        } catch (error) {
            logger.error(error);
            toaster.create({ title: "Failed to initiate recovery", type: "error" });
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
        <>
            <Box minH="100vh" py={20}>
                <Container maxW="3xl">
                    <VStack spaceY={8} align="stretch">
                        <Box>
                            <BackButton to='/dashboard' label="Back to Dashboard" />
                        </Box>
                        <Heading color="fg.primary" size="2xl" textAlign="center">Account Recovery</Heading>

                        <Tabs.Root defaultValue="key" variant="outline" fitted>
                            <Tabs.List bg="bg.muted" rounded="xl" p={1}>
                                <Tabs.Trigger value="key" _selected={{ bg: "bg.subtle", color: "fg.primary" }}>
                                    <HStack><LuShieldAlert /> <Text>Recovery Key</Text></HStack>
                                </Tabs.Trigger>
                                <Tabs.Trigger value="trusted" _selected={{ bg: "bg.subtle", color: "fg.primary" }}>
                                    <HStack><LuUsers /> <Text>Trusted Contacts</Text></HStack>
                                </Tabs.Trigger>
                            </Tabs.List>

                            <Tabs.Content value="key" mt={8}>
                                <VStack align="stretch" spaceY={6} bg="bg.surface" p={8} rounded="2xl" border="1px solid" borderColor="border.subtle">
                                    <Heading size="md" color="fg.primary">Use your Backup Master Seed</Heading>
                                    <Text color="fg.muted">Enter the 256-bit Master Seed (hex) you saved during setup.</Text>

                                    <Input
                                        placeholder="Enter Master Seed (64 hex chars)"
                                        value={recoveryKey}
                                        onChange={e => setRecoveryKey(e.target.value)}
                                        color="fg.primary"
                                        bg="bg.muted"
                                        borderColor="border.subtle"
                                        fontFamily="mono"
                                    />

                                    {otpSent && (
                                        <HStack justify="center" width="full">
                                            <OTPInput
                                                length={6}
                                                value={otp}
                                                onChange={setOtp}
                                                onComplete={() => handleVerifyOTP()}
                                            />
                                        </HStack>
                                    )}

                                    {!otpSent ? (
                                        <AuthButton
                                            isLoading={loading}
                                            onClick={handleRequestOTP}
                                            loadingText="Requesting OTP..."
                                        >
                                            Verify Seed & Request OTP
                                        </AuthButton>
                                    ) : (
                                        <AuthButton
                                            isLoading={loading}
                                            onClick={handleVerifyOTP}
                                            loadingText="Reconstructing..."
                                        >
                                            Reconstruct Master Seed
                                        </AuthButton>
                                    )}
                                </VStack>
                            </Tabs.Content>

                            <Tabs.Content value="trusted" mt={8}>
                                <VStack align="stretch" spaceY={6} bg="bg.surface" p={8} rounded="2xl" border="1px solid" borderColor="border.subtle">
                                    <Heading size="md" color="fg.primary">Trusted Contact Recovery</Heading>
                                    <Text color="fg.muted">
                                        Send magic links to your 3 trusted contacts. Once 2 of them approve, your Master Seed will be reconstructed.
                                    </Text>

                                    {recoveryStatus === 'idle' && (
                                        <AuthButton
                                            isLoading={loading}
                                            onClick={handleUnleashRecovery}
                                            loadingText="Sending Requests..."
                                        >
                                            <LuMail /> Send Requests to Contacts
                                        </AuthButton>
                                    )}

                                    {recoveryStatus === 'pending' && (
                                        <VStack py={8}>
                                            <Flex direction="column" align="center" justify="center" position="relative">
                                                <Spinner size="xl" color="brand.400" />
                                                <Text position="absolute" fontSize="xs" fontWeight="bold" color="fg.primary">{approvedCount}/3</Text>
                                            </Flex>
                                            <Text color="brand.200" fontWeight="bold" mt={4}>Waiting for approvals...</Text>
                                            <Text color="fg.muted" fontSize="sm">Please contact your friends to check their email.</Text>
                                        </VStack>
                                    )}

                                    {/* Success Modal for Reconstruction */}
                                    <DialogRoot open={recoveryStatus === 'complete'} onOpenChange={(e) => { if (!e.open && recoveryStatus !== 'complete') setRecoveryStatus('idle') }}>
                                        <DialogContent bg="bg.elevated" border="1px solid" borderColor="border.subtle">
                                            <DialogHeader>
                                                <DialogTitle color="brand.400">Recovery Successful!</DialogTitle>
                                            </DialogHeader>
                                            <DialogBody>
                                                <VStack align="stretch" spaceY={4}>
                                                    <Text color="gray.300">Your Master Seed has been reconstructed. Please save your NEW Master Seed and set a new password to secure it.</Text>

                                                    <Box p={3} bg="black" rounded="md" border="1px solid" borderColor="red.900">
                                                        <Text fontSize="xs" color="gray.500" mb={1}>NEW MASTER SEED (SAVE THIS!):</Text>
                                                        <Text color="red.200" fontFamily="mono" wordBreak="break-all">{newRecoveryKey}</Text>
                                                    </Box>

                                                    <PasswordInput
                                                        placeholder="New Master Password"
                                                        value={newPassword}
                                                        onChange={(e) => setNewPassword(e.target.value)}
                                                    />
                                                </VStack>
                                            </DialogBody>
                                            <DialogFooter>
                                                <AuthButton
                                                    isLoading={loading}
                                                    onClick={handlePasswordReset}
                                                    loadingText="Saving & Unlocking..."
                                                >
                                                    Save & Unlock Vault
                                                </AuthButton>
                                            </DialogFooter>
                                        </DialogContent>
                                    </DialogRoot>
                                </VStack>
                            </Tabs.Content>
                        </Tabs.Root>
                    </VStack>
                </Container>
            </Box>
        </>
    );
};

export default Recovery;
