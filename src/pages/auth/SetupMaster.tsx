import { useState, useEffect } from 'react';

import { useVaultContext } from '../../context/VaultContext';
import { PasswordInput } from '../../components/ui/password-input';
import {
    Box,
    Container,
    VStack,
    Text,
    Code,
    Stack,
    Image,
    IconButton,
} from '@chakra-ui/react';
import { StepsRoot, StepsList, StepsItem } from '../../components/ui/steps';
import { AuthButton } from '../../components/ui/AuthButton';
import { Checkbox } from '../../components/ui/checkbox';
import { toaster } from '../../components/ui/toaster';
import { logger } from '../../utils/logger';
import { LoadSpinner } from '../../components/ui/LoadSpinner';

import {
    splitSecret, deriveMasterPasswordHash,
    hashRecoveryKey, generateSalt, generateMasterSeed,
    wrapMasterSeed, deriveMekFromSeed, generateVaultKey, exportKeyRaw, encryptWithKey
} from '../../utils/crypto';
import { setupMasterAPI, setupTrustedContactsAPI, setup2FAAPI, activate2FAAPI, TwoFASetupResponse, getAuthSaltAPI, getMasterPasswordStatusAPI } from '../../api/auth';

import { storePasswordAPI } from '../../api/vault';
import { supabase } from '../../utils/supabase';
import { useNavigate } from 'react-router';
import { LuShieldCheck, LuKey, LuCopy, LuCheck, LuDownload, LuArrowRight } from 'react-icons/lu';
import { Separator, Flex, Heading, HStack } from '@chakra-ui/react';
import { PinInput } from '../../components/ui/pin-input';
import SpotlightCard from '../../components/SpotlightCard/SpotlightCard';
import GradientText from '../../components/GradientText/GradientText';

const SetupMaster = () => {
    const navigate = useNavigate();
    const { setMek, setVaultKey, setSalt: setContextSalt, copyToClipboard } = useVaultContext();
    const [step, setStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const [seedConfirmed, setSeedConfirmed] = useState(false);
    const [fetchingStatus, setFetchingStatus] = useState(true);

    // Initial check: If already setup, redirect to unlock
    useEffect(() => {
        const checkStatus = async () => {
            try {
                const status = await getMasterPasswordStatusAPI();
                if (status.hasMasterSetup) {
                    navigate('/unlock-vault');
                }
            } catch (err) {
                logger.error("Failed to check setup status", err);
            } finally {
                setFetchingStatus(false);
            }
        };
        checkStatus();
    }, [navigate]);


    // Step 1: Master Password
    const [masterPassword, setMasterPassword] = useState('');
    // State to hold data for the server API call (SetupMasterPayload)
    const [authData, setAuthData] = useState<any>(null);

    // Step 2: Recovery Key
    const [recoveryKey, setRecoveryKey] = useState('');

    // Step 3: Trusted Contacts
    const [contacts, setContacts] = useState(['', '', '']);
    const [masterSeed, setMasterSeed] = useState<string | null>(null);
    const [seedShards, setSeedShards] = useState<string[]>([]);

    // Step 4: 2FA Setup
    const [twoFactorStep, setTwoFactorStep] = useState<'setup' | 'backup'>('setup');
    const [twoFactorData, setTwoFactorData] = useState<TwoFASetupResponse | null>(null);
    const [totpToken, setTotpToken] = useState('');
    const [backupCodes, setBackupCodes] = useState<string[]>([]);

    const handleStep1Submit = async () => {
        if (!masterPassword || masterPassword.length < 8) {
            toaster.create({ title: "Master password must be at least 8 characters", type: "error" });
            return;
        }
        setLoading(true);
        try {
            // 1. Generate Master Seed
            const ms = generateMasterSeed();
            setMasterSeed(ms);

            // 2. The Recovery Key IS the Master Seed (encoded as hex)
            // This guarantees that if the user recovers their vault, they recover the actual seed that derives the MEK.
            const rKey = ms;
            setRecoveryKey(rKey);

            // 3. Hash the Recovery Key for server-side auth (so the server never knows the seed)
            const rKeyHashHex = await hashRecoveryKey(rKey);

            // 4. Generate separate salts for vault encryption and master password derivation
            const vaultSalt = generateSalt(16);
            const masterPasswordSalt = generateSalt(16);

            // A. Fetch email from authenticated session
            const { data: { user } } = await supabase.auth.getUser();
            if (!user || !user.email) {
                toaster.create({ title: "Session error", description: "Please log in again.", type: "error" });
                return;
            }

            // B. Fetch Server-Issued Auth Salt
            const { authSalt } = await getAuthSaltAPI(user.email);

            // 5. Derive MPH (Server Auth) from Master Password using Server Salt
            const mph = await deriveMasterPasswordHash(masterPassword, authSalt);

            // 6. Wrap Master Seed with Master Password
            const { wrappedSeed, iv: wrappedSeedIv } = await wrapMasterSeed(ms, masterPassword, masterPasswordSalt);

            // 7. Split Master Seed into shards (not the recovery key!)
            const shards = splitSecret(ms);
            setSeedShards(shards);

            const payload = {
                masterPasswordHash: mph,
                recoveryKeyHash: rKeyHashHex,
                vaultSalt,
                masterPasswordSalt,
                wrappedMasterSeed: wrappedSeed,
                wrappedMasterSeedIv: wrappedSeedIv
            };

            setAuthData(payload);
            setStep(1); // Move to Recovery Key display
        } catch (error) {
            logger.error(error);
            toaster.create({ title: "Setup failed", type: "error" });
        } finally {
            setLoading(false);
        }
    };

    const handleStep2Submit = async () => {
        // Send Master Data to Backend
        setLoading(true);
        try {
            // logger.info("Sending to setupMasterAPI:", authData);
            await setupMasterAPI(authData);

            // Derive MEK from Master Seed for immediate session use
            if (masterSeed) {
                const mek = await deriveMekFromSeed(masterSeed, authData.vaultSalt);
                setMek(mek);
                setContextSalt(authData.vaultSalt);

                // --- KEY INDIRECTION: Initialize persistent Vault Key ---
                // 1. Generate new random persistent Vault Key (EK)
                const vaultKey = await generateVaultKey();
                setVaultKey(vaultKey);

                // 2. Export EK to raw bytes -> Base64 string
                const rawKey = await exportKeyRaw(vaultKey);
                const rawKeyStr = btoa(String.fromCharCode(...new Uint8Array(rawKey)));

                // 3. Encrypt the EK string with the MEK (KEK)
                const { encryptedData, iv } = await encryptWithKey(rawKeyStr, mek);

                // 4. Store as a special hidden vault item
                await storePasswordAPI("__VAULT_KEY__", encryptedData, iv);
            }

            setStep(2); // Move to Trusted Contacts
            toaster.create({ title: "Master Password & Recovery Key Secured", type: "success" });
        } catch (error) {
            logger.error(error);
            toaster.create({ title: "Failed to save to server", type: "error" });
        } finally {
            setLoading(false);
        }
    };

    const handleStep3Submit = async () => {
        // Filter out empty contacts and validate remaining ones
        const validContacts = contacts.filter(c => c.trim() && c.includes('@'));
        
        if (validContacts.length !== 3) {
            toaster.create({ title: "Please enter exactly 3 valid email addresses", type: "error" });
            return;
        }

        setLoading(true);
        try {
            // Prepare payload using the shards generated in Step 1
            const contactPayload = validContacts.map((email, idx) => ({
                email, // Use standardized 'email' field
                keyShard: seedShards[idx],
                shardIndex: idx + 1
            }));

            await setupTrustedContactsAPI(contactPayload);

            toaster.create({ title: "Trusted Contacts Setup Complete", type: "success" });

            // Start 2FA Setup instead of navigating to dashboard
            const data = await setup2FAAPI();
            setTwoFactorData(data);
            setStep(3); // Move to 2FA Step
        } catch (error) {
            logger.error(error);
            toaster.create({ title: "Failed to setup contacts", type: "error" });
        } finally {
            setLoading(false);
        }
    };

    const handleActivate2FA = async () => {
        if (!twoFactorData || totpToken.length !== 6) return;

        setLoading(true);
        try {
            const data = await activate2FAAPI(twoFactorData.totpSetupKey, totpToken);
            setBackupCodes(data.backupCodes);
            setTwoFactorStep('backup');
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

    const handleCopySeed = () => {
        if (recoveryKey) {
            copyToClipboard(recoveryKey, "Master Seed");
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    if (fetchingStatus) {
        return <LoadSpinner message="Starting secure setup..." />;
    }

    return (
        <Box minH="100vh" bg="transparent" position="relative" overflow="hidden">


            {/* Ambient Background Glow */}
            <Box position="absolute" top="0" left="0" w="full" h="full" bg="bg.canvas" opacity={0.8} zIndex={0} />
            <Box position="absolute" top="10%" right="-5%" w="600px" h="600px" bg="brand.900" filter="blur(160px)" opacity={0.4} borderRadius="full" zIndex={0} />
            <Box position="absolute" bottom="10%" left="-5%" w="600px" h="600px" bg="green.900" filter="blur(160px)" opacity={0.3} borderRadius="full" zIndex={0} />

            <Container maxW="xl" py={20} position="relative" zIndex={1}>
                <VStack spaceY={10} align="stretch">
                    <VStack spaceY={2} align="center" textAlign="center">
                        <Box p={3} bg="bg.muted" borderRadius="xl" border="1px solid" borderColor="border.subtle" mb={2} overflow="hidden">
                            <Image src="/kv_outline.svg" alt="KeyVault Logo" boxSize={8} objectFit="contain" />
                        </Box>
                        <GradientText
                            colors={["#fff", "#ccc", "#fff"]}
                            animationSpeed={8}
                            showBorder={false}
                            className="text-4xl font-black tracking-tight"
                        >
                            Master Access Setup
                        </GradientText>
                        <Text color="fg.muted" fontSize="md">
                            Secure your digital life with Zero-Knowledge encryption
                        </Text>
                    </VStack>

                    <StepsRoot count={4} step={step} colorPalette="brand">
                        <StepsList bg="bg.muted" p={2} rounded="2xl" border="1px solid" borderColor="border.subtle">
                            <StepsItem index={0} title="Security" />
                            <StepsItem index={1} title="Backup" />
                            <StepsItem index={2} title="Recovery" />
                            <StepsItem index={3} title="Identity" />
                        </StepsList>
                    </StepsRoot>

                    <Box>
                        {step === 0 && (
                            <SpotlightCard className="w-full rounded-3xl border border-border-subtle shadow-2xl bg-bg-surface backdrop-blur-xl" spotlightColor="rgba(255, 255, 255, 0.05)">
                                <Stack spaceY={6} p={8}>
                                    <VStack align="center" textAlign="center" spaceY={2}>
                                        <Text fontSize="xl" fontWeight="bold" color="fg.primary">Create Master Password</Text>
                                        <Text fontSize="sm" color="fg.muted">
                                            This password is the only way to decrypt your vault. KeyVault never stores or sees this password.
                                        </Text>
                                    </VStack>

                                    <VStack align="stretch" spaceY={4}>
                                        <PasswordInput
                                            placeholder="Enter strong master password"
                                            value={masterPassword}
                                            onChange={(e) => setMasterPassword(e.target.value)}
                                            showStrength
                                            bg="bg.muted"
                                            border="1px solid"
                                            borderColor="border.subtle"
                                            color="fg.primary"
                                            _placeholder={{ color: "fg.muted", opacity: 0.5 }}
                                            _focus={{ borderColor: "brand.400", bg: "bg.muted", outline: "none" }}
                                            rounded="xl"
                                            size="lg"
                                        />
                                        <AuthButton
                                            disabled={!masterPassword || masterPassword.length < 8}
                                            isLoading={loading}
                                            onClick={handleStep1Submit}
                                            loadingText="Securing..."
                                        >
                                            <LuKey /> Secure & Continue
                                        </AuthButton>
                                    </VStack>
                                </Stack>
                            </SpotlightCard>
                        )}

                        {step === 1 && (
                            <SpotlightCard className="w-full rounded-3xl border border-border-subtle shadow-2xl bg-bg-surface backdrop-blur-xl" spotlightColor="rgba(251, 191, 36, 0.05)">
                                <Stack spaceY={6} p={8}>
                                    <VStack align="center" textAlign="center" spaceY={2}>
                                        <Text fontSize="xl" fontWeight="bold" color="amber.400">⚠️ Backup Your Master Seed</Text>
                                        <Text fontSize="sm" color="fg.muted">
                                            Your Master Seed is the absolute root of your encryption. Store it offline and never share it.
                                            <Box as="span" display="block" mt={2} color="amber.200" fontWeight="semibold">
                                                Important: This is the ONLY time this seed will be shown. Store it securely now.
                                            </Box>
                                        </Text>
                                    </VStack>

                                    <VStack align="stretch" spaceY={6}>
                                        <Box
                                            p={10}
                                            rounded="2xl"
                                            bg="bg.muted"
                                            border="1px dashed"
                                            borderColor="border.subtle"
                                            position="relative"
                                            overflow="hidden"
                                            display="flex"
                                            alignItems="center"
                                            justifyContent="center"
                                            minH="140px"
                                        >
                                            <Code
                                                fontSize={{ base: "md", md: "lg" }}
                                                wordBreak="break-all"
                                                bg="transparent"
                                                color="fg.primary"
                                                textAlign="center"
                                                fontFamily="mono"
                                                letterSpacing="wider"
                                                display="block"
                                                maxW="80%"
                                            >
                                                {recoveryKey}
                                            </Code>
                                            <IconButton
                                                aria-label="Copy Seed"
                                                size="sm"
                                                variant="ghost"
                                                color="fg.muted"
                                                position="absolute"
                                                top={2}
                                                right={2}
                                                onClick={handleCopySeed}
                                                _hover={{ bg: "bg.subtle", color: "fg.primary" }}
                                            >
                                                {copied ? <LuCheck /> : <LuCopy />}
                                            </IconButton>
                                        </Box>

                                        <Box bg="amber.500/10" p={4} rounded="xl" border="1px solid" borderColor="amber.500/20">
                                            <Checkbox
                                                checked={seedConfirmed}
                                                onCheckedChange={(e) => setSeedConfirmed(!!e.checked)}
                                                colorPalette="amber"
                                                size="md"
                                            >
                                                <Text fontSize="sm" color="fg.primary" fontWeight="medium">
                                                    I have securely backed up my Master Seed
                                                </Text>
                                            </Checkbox>
                                        </Box>

                                        <AuthButton
                                            disabled={!seedConfirmed}
                                            isLoading={loading}
                                            onClick={handleStep2Submit}
                                            loadingText="Securing Seed..."
                                        >
                                            <LuShieldCheck /> I've Secured My Master Seed
                                        </AuthButton>
                                    </VStack>
                                </Stack>
                            </SpotlightCard>
                        )}
                        {step === 2 && (
                            <SpotlightCard className="w-full rounded-3xl border border-border-subtle shadow-2xl bg-bg-surface backdrop-blur-xl" spotlightColor="rgba(59, 130, 246, 0.05)">
                                <Stack spaceY={6} p={8}>
                                    <VStack align="center" textAlign="center" spaceY={2}>
                                        <Text fontSize="xl" fontWeight="bold" color="fg.primary">Zero-Trust Recovery</Text>
                                        <Text fontSize="sm" color="fg.muted">
                                            Select 3 trusted family members or friends. They will hold encrypted shards of your seed to help you recover your vault.
                                        </Text>
                                    </VStack>

                                    <VStack align="stretch" spaceY={4}>
                                        {contacts.map((email, idx) => (
                                            <VStack key={idx} align="stretch" spaceY={1}>
                                                <Text fontSize="xs" fontWeight="bold" color="fg.muted">CONTACT {idx + 1}</Text>
                                                <input
                                                    placeholder="email@example.com"
                                                    value={email}
                                                    onChange={(e) => {
                                                        const newContacts = [...contacts];
                                                        newContacts[idx] = e.target.value;
                                                        setContacts(newContacts);
                                                    }}
                                                    className="p-3 bg-bg-muted border border-border-subtle rounded-xl text-fg-primary focus:outline-none focus:border-brand-400"
                                                />
                                            </VStack>
                                        ))}
                                        <AuthButton
                                            isLoading={loading}
                                            onClick={handleStep3Submit}
                                        >
                                            Next Step <LuArrowRight />
                                        </AuthButton>
                                    </VStack>
                                </Stack>
                            </SpotlightCard>
                        )}

                        {step === 3 && (
                            <SpotlightCard className="w-full rounded-3xl border border-border-subtle shadow-2xl bg-bg-surface backdrop-blur-xl" spotlightColor="rgba(59, 130, 246, 0.05)">
                                {twoFactorStep === 'setup' ? (
                                    <Stack spaceY={6} p={8}>
                                        <VStack align="center" textAlign="center" spaceY={2}>
                                            <Heading size="md" color="fg.primary">Enforce Two-Factor Authentication</Heading>
                                            <Text fontSize="sm" color="fg.muted">
                                                Protect your vault with an additional layer of security using an authenticator app.
                                            </Text>
                                        </VStack>

                                        <VStack align="center" spaceY={6} py={4}>
                                            <Box p={4} bg="white" rounded="3xl" shadow="xl">
                                                {twoFactorData?.qrCodeUrl && <Image src={twoFactorData.qrCodeUrl} alt="2FA QR Code" boxSize="200px" />}
                                            </Box>

                                            <VStack spaceY={2} w="full">
                                                <Text fontSize="sm" textAlign="center" color="fg.muted">
                                                    Scan this QR code in your authenticator app
                                                </Text>
                                                <HStack bg="bg.muted" p={3} rounded="xl" w="full" justify="space-between" border="1px solid" borderColor="border.subtle">
                                                    <VStack align="start" spaceY={0}>
                                                        <Text fontSize="2xs" fontWeight="bold" color="fg.muted">SECRET KEY</Text>
                                                        <Text fontSize="sm" fontFamily="mono" fontWeight="bold" color="fg.primary">{twoFactorData?.totpSetupKey}</Text>
                                                    </VStack>
                                                    <IconButton size="xs" variant="ghost" onClick={() => copyToClipboard(twoFactorData?.totpSetupKey || '', "2FA Secret Key")} color="fg.muted">
                                                        <LuCopy />
                                                    </IconButton>
                                                </HStack>
                                            </VStack>

                                            <Separator borderColor="border.subtle" />

                                            <VStack align="stretch" spaceY={4} w="full">
                                                <Box>
                                                    <Text fontSize="xs" fontWeight="black" color="fg.muted" textTransform="uppercase" letterSpacing="widest" mb={4} textAlign="center">Enter 6-Digit Code</Text>
                                                    <Flex justify="center">
                                                        <PinInput
                                                            length={6}
                                                            value={totpToken}
                                                            onChange={setTotpToken}
                                                        />
                                                    </Flex>
                                                </Box>
                                                <AuthButton
                                                    isLoading={loading}
                                                    onClick={handleActivate2FA}
                                                    disabled={totpToken.length !== 6}
                                                >
                                                    <Flex align="center" gap={2}>Verify & Activate <LuShieldCheck /></Flex>
                                                </AuthButton>
                                            </VStack>
                                        </VStack>
                                    </Stack>
                                ) : (
                                    <Stack spaceY={6} p={8}>
                                        <VStack align="center" textAlign="center" spaceY={2}>
                                            <Heading size="md" color="green.400">Security Activated!</Heading>
                                            <Text fontSize="sm" color="fg.muted">
                                                Save these backup codes in a secure location. They are the only way to access your vault if you lose your authenticator device.
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
                                                Go to Dashboard <LuArrowRight />
                                            </AuthButton>
                                        </HStack>
                                    </Stack>
                                )}
                            </SpotlightCard>
                        )}
                    </Box>
                </VStack>
            </Container>
        </Box>
    );
};

export default SetupMaster;
