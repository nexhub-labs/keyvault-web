import { useState, useEffect } from 'react';
import {
    Box,
    VStack,
    Text,
    Button,
    Spinner,
    Container,
    Image,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router';
import { PasswordInput } from './ui/password-input';
import { OTPInput } from './ui/pin-input';
import { toaster } from './ui/toaster';
import {
    deriveMasterPasswordHash,
    unwrapMasterSeed,
    deriveMekFromSeed,
    decryptWithKey,
    importKeyRaw,
    authenticateWithPasskey,
    generateVaultKey,
    exportKeyRaw,
    encryptWithKey
} from '../utils/crypto';
import { logger } from '../utils/logger';
import { verifyMasterPasswordAPI, getMasterPasswordStatusAPI } from '../api/auth';
import { retrievePasswordAPI, storePasswordAPI } from '../api/vault';
import { useVaultContext } from '../context/VaultContext';
import SpotlightCard from './SpotlightCard/SpotlightCard';
import GradientText from './GradientText/GradientText';
import { LuLock, LuShieldCheck, LuFingerprint } from 'react-icons/lu';
import { BackButton } from './ui/BackButton';

/**
 * VaultUnlock Component
 * This component implements the "Two-Factor Context" unlock flow:
 * 1. User is already authenticated via Supabase (JWT)
 * 2. User enters their master password
 * 3. Frontend derives MPH and verifies against server
 * 4. Frontend derives MEK and stores it locally for decryption
 */
const VaultUnlock = () => {
    const navigate = useNavigate();
    const { setMek, setVaultKey, setSalt, setIsUnlocked } = useVaultContext();
    const [masterPassword, setMasterPassword] = useState('');
    const [totpToken, setTotpToken] = useState('');
    const [requires2FA, setRequires2FA] = useState(false);
    const [loading, setLoading] = useState(false);
    const [masterPasswordSalt, setMasterPasswordSalt] = useState<string | null>(null);
    const [hasPasskeys, setHasPasskeys] = useState(false);

    // Fetch salt on component mount
    useEffect(() => {
        const fetchSalt = async () => {
            try {
                const status = await getMasterPasswordStatusAPI();
                if (status.hasMasterSetup && status.masterPasswordSalt) {
                    setMasterPasswordSalt(status.masterPasswordSalt);
                    setHasPasskeys(!!status.hasPasskeys);
                } else {
                    // No master setup, redirect to setup
                    navigate('/setup-master');
                }
            } catch (error) {
                logger.error('Failed to fetch salt:', error);
                toaster.create({
                    title: "Failed to load vault",
                    description: "Could not retrieve vault configuration",
                    type: "error",
                });
            }
        };
        fetchSalt();
    }, [navigate]);

    const handleUnlock = async (directTotpToken?: string) => {
        // Use directly passed token (from onComplete) or fall back to state
        const tokenToUse = directTotpToken ?? totpToken;
        if (!masterPassword) {
            toaster.create({ title: "Please enter your master password", type: "error" });
            return;
        }

        if (!masterPasswordSalt) {
            toaster.create({
                title: "Vault configuration missing",
                description: "Master password salt not loaded. Please refresh the page.",
                type: "error"
            });
            logger.error('Unlock attempted without salt');
            return;
        }

        setLoading(true);
        try {
            // 1. Try Argon2 hash first (new method)
            const mph = await deriveMasterPasswordHash(masterPassword, masterPasswordSalt);

            // logger.info(`[DEBUG] Argon2 MPH sent: ${mph.slice(0, 16)}...`);
            const response = await verifyMasterPasswordAPI(mph, tokenToUse);

            if (!response.valid) {
                throw new Error("Invalid master password");
            }


            // 3. Unwrap (decrypt) the Master Seed locally
            const masterSeed = await unwrapMasterSeed(
                response.wrappedMasterSeed,
                response.wrappedMasterSeedIv,
                masterPassword,
                masterPasswordSalt
            );

            // 4. Derive MEK from the unwrapped Master Seed
            const mek = await deriveMekFromSeed(masterSeed, response.vaultSalt);

            // Store in context
            setMek(mek);
            setSalt(response.vaultSalt);

            // --- KEY INDIRECTION: Unwrap or create the persistent Vault Key ---
            let vaultKey: CryptoKey;
            try {
                // Try to retrieve the encrypted Vault Key (EK)
                const { encryptedData: ekEnc, iv: ekIv } = await retrievePasswordAPI("__VAULT_KEY__");

                // Decrypt EK using MEK (KEK)
                const ekRawStr = await decryptWithKey(ekEnc, ekIv, mek);

                // Convert Base64 string back to ArrayBuffer
                const ekRaw = Uint8Array.from(atob(ekRawStr), c => c.charCodeAt(0));

                // Import as CryptoKey
                vaultKey = await importKeyRaw(ekRaw.buffer);
            } catch (error) {
                const err = error as { response?: { status?: number } };
                // Vault Key missing - create a new one
                if (err?.response?.status === 404) {
                    logger.info("Vault Key not found, creating new one...");

                    // Generate new Vault Key
                    vaultKey = await generateVaultKey();

                    // Encrypt and store it
                    const rawKey = await exportKeyRaw(vaultKey);
                    const rawKeyStr = btoa(String.fromCharCode(...new Uint8Array(rawKey)));
                    const { encryptedData, iv } = await encryptWithKey(rawKeyStr, mek);
                    await storePasswordAPI("__VAULT_KEY__", encryptedData, iv);

                    toaster.create({
                        title: "Vault initialized",
                        description: "A new encryption key was created for your vault.",
                        type: "info",
                    });
                } else {
                    throw err;
                }
            }
            setVaultKey(vaultKey);

            setIsUnlocked(true);

            toaster.create({
                title: "Vault unlocked",
                description: "Welcome back!",
                type: "success",
            });

            // Navigate to dashboard
            navigate('/dashboard');
        } catch (error) {
            handleUnlockError(error as Error | { response?: { status?: number, data?: { error?: string } }, message?: string });
        } finally {
            setLoading(false);
        }
    };

    const handleHardwareUnlock = async () => {
        setLoading(true);
        try {
            // 1. Trigger Passkey authentication with PRF
            const { verification, prfKey } = await authenticateWithPasskey(true);

            if (!verification.verified || !prfKey) {
                throw new Error("Hardware authentication failed or PRF secret unavailable");
            }

            // 2. Decrypt Master Seed using the hardware-bound PRF key
            // Note: verification.hardwareWrappedMasterSeed comes from the backend verify-auth response
            const masterSeedRaw = await decryptWithKey(
                verification.hardwareWrappedMasterSeed,
                verification.hardwareWrappedMasterSeedIv,
                prfKey
            );

            // 3. Derive MEK from the unwrapped Master Seed
            const mek = await deriveMekFromSeed(masterSeedRaw, verification.vaultSalt);

            // Store in context
            setMek(mek);
            setSalt(verification.vaultSalt);

            // 4. Unwrap or create Vault Key (Shared logic with handleUnlock)
            await finalizeUnlock(mek);

            setIsUnlocked(true);
            toaster.create({ title: "Vault unlocked via Hardware", type: "success" });
            navigate('/dashboard');
        } catch (error) {
            handleUnlockError(error as Error | { response?: { status?: number, data?: { error?: string } }, message?: string });
        } finally {
            setLoading(false);
        }
    };

    const finalizeUnlock = async (mek: CryptoKey) => {
        let vaultKey: CryptoKey;
        try {
            const { encryptedData: ekEnc, iv: ekIv } = await retrievePasswordAPI("__VAULT_KEY__");
            const ekRawStr = await decryptWithKey(ekEnc, ekIv, mek);
            const ekRaw = Uint8Array.from(atob(ekRawStr), c => c.charCodeAt(0));
            vaultKey = await importKeyRaw(ekRaw.buffer);
        } catch (error) {
            const err = error as { response?: { status?: number } };
            if (err?.response?.status === 404) {
                vaultKey = await generateVaultKey();
                const rawKey = await exportKeyRaw(vaultKey);
                const rawKeyStr = btoa(String.fromCharCode(...new Uint8Array(rawKey)));
                const { encryptedData, iv } = await encryptWithKey(rawKeyStr, mek);
                await storePasswordAPI("__VAULT_KEY__", encryptedData, iv);
            } else {
                throw err;
            }
        }
        setVaultKey(vaultKey);
    };

    const handleUnlockError = (error: Error | { response?: { status?: number, data?: { error?: string } }, message?: string }) => {
        if ('response' in error && error.response?.status === 403 && error.response?.data?.error === 'TwoFactorRequired') {
            setRequires2FA(true);
            setLoading(false);
            toaster.create({ title: "2FA Required", description: "Enter your 2FA token to proceed", type: "info" });
            return;
        }
        logger.error('Unlock failed:', error);
        toaster.create({
            title: "Unlock failed",
            description: error.message || "Could not unlock vault",
            type: "error",
        });
    };

    return (
        <Box minH="100vh" bg="transparent" display="flex" alignItems="center" justifyContent="center" p={4} position="relative" overflow="hidden">

            {/* Ambient Background Glow */}
            <Box position="absolute" top="0" left="0" w="full" h="full" bg="bg.canvas" opacity={0.8} zIndex={0} />
            <Box position="absolute" top="-10%" right="-5%" w="500px" h="500px" bg="brand.900" filter="blur(140px)" opacity={0.4} borderRadius="full" zIndex={0} />
            <Box position="absolute" bottom="-10%" left="-5%" w="500px" h="500px" bg="green.900" filter="blur(140px)" opacity={0.3} borderRadius="full" zIndex={0} />

            <Container maxW="xl" position="relative" zIndex={1}>
                <Box mb={6}>
                    <BackButton onClick={() => navigate(-1)} label="Go Back" />
                </Box>

                <SpotlightCard className="w-full rounded-3xl border border-border-subtle shadow-2xl bg-bg-surface backdrop-blur-xl" spotlightColor="rgba(255, 255, 255, 0.05)">
                    <VStack spaceY={8} p={8}>
                        {/* Header */}
                        <VStack spaceY={2} align="center" textAlign="center">
                            <Box p={3} bg="bg.muted" borderRadius="xl" border="1px solid" borderColor="border.subtle" mb={1} overflow="hidden">
                                <Image src="/kv_outline.svg" alt="KeyVault Logo" boxSize={8} objectFit="contain" />
                            </Box>
                            <GradientText
                                colors={["#fff", "#ccc", "#fff"]}
                                animationSpeed={8}
                                showBorder={false}
                                className="text-2xl font-bold tracking-tight"
                            >
                                Unlock Your Vault
                            </GradientText>
                            <Text color="fg.muted" fontSize="sm">
                                Enter your master password to access your secure keys.
                            </Text>
                        </VStack>

                        <VStack align="stretch" spaceY={4} w="full">
                            <PasswordInput
                                placeholder="Master Password"
                                value={masterPassword}
                                onChange={(e) => setMasterPassword(e.target.value)}
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                        handleUnlock();
                                    }
                                }}
                                bg="bg.muted"
                                border="1px solid"
                                borderColor="border.subtle"
                                color="fg.primary"
                                _placeholder={{ color: "fg.muted", opacity: 0.5 }}
                                _focus={{ borderColor: "brand.400", bg: "bg.muted", outline: "none" }}
                                rounded="xl"
                                size="lg"
                                disabled={requires2FA} // Once entered, focus on TOTP
                            />

                            {requires2FA && (
                                <Box pt={2} animation="fade-in 0.5s">
                                    <Text fontSize="xs" fontWeight="black" color="brand.400" textTransform="uppercase" letterSpacing="widest" mb={3} textAlign="center">
                                        Enter 2FA Code
                                    </Text>
                                    <Box display="flex" justifyContent="center">
                                        <OTPInput
                                            length={6}
                                            value={totpToken}
                                            onChange={setTotpToken}
                                            onComplete={(value) => handleUnlock(value)}
                                        />
                                    </Box>
                                </Box>
                            )}

                            <Button
                                disabled={loading || !masterPassword || (requires2FA && !totpToken)}
                                onClick={() => handleUnlock()}
                                size="lg"
                                width="full"
                                variant="solid"
                                colorPalette="brand"
                                fontWeight="bold"
                                rounded="xl"
                                _hover={{ transform: 'translateY(-2px)', shadow: 'xl' }}
                            >
                                {loading ? <Spinner size="sm" color="fg.inverted" /> : <>{requires2FA ? <LuShieldCheck /> : <LuLock />} {requires2FA ? "Verify & Unlock" : "Unlock Vault"}</>}
                            </Button>

                            {hasPasskeys && !requires2FA && (
                                <Button
                                    disabled={loading}
                                    onClick={handleHardwareUnlock}
                                    size="lg"
                                    width="full"
                                    variant="outline"
                                    colorPalette="green"
                                    fontWeight="bold"
                                    rounded="xl"
                                    _hover={{ transform: 'translateY(-2px)', shadow: 'xl', bg: 'green.50/5' }}
                                >
                                    {loading ? <Spinner size="sm" /> : <><LuFingerprint /> Unlock with Passkey</>}
                                </Button>
                            )}
                            <Text fontSize="xs" color="fg.muted" textAlign="center">
                                Your master password never leaves this device. All decryption happens locally.
                            </Text>
                        </VStack>
                    </VStack>
                </SpotlightCard>
            </Container>
        </Box>
    );
};

export default VaultUnlock;
