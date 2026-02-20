import { useState } from 'react';
import { useVaultContext } from '../../context/VaultContext';
import { PasswordInput } from '../../components/ui/password-input';
import {
    Box,
    Container,
    VStack,
    Text,
    Steps,
    Code,
    Input,
    Stack,
    Image,
    IconButton,
} from '@chakra-ui/react';
import { AuthButton } from '../../components/ui/AuthButton';
import { Checkbox } from '../../components/ui/checkbox';
import { toaster } from '../../components/ui/toaster';
import { logger } from '../../utils/logger';
import {
    splitSecret, deriveMasterPasswordHash,
    hashRecoveryKey, generateSalt, generateMasterSeed,
    wrapMasterSeed, deriveMekFromSeed, generateVaultKey, exportKeyRaw, encryptWithKey
} from '../../utils/crypto';
import { setupMasterAPI, setupTrustedContactsAPI } from '../../api/auth';
import { storePasswordAPI } from '../../api/vault';
import { useNavigate } from 'react-router';
import { LuShieldCheck, LuUsers, LuKey, LuCopy, LuCheck } from 'react-icons/lu';
import SpotlightCard from '../../components/SpotlightCard/SpotlightCard';
import GradientText from '../../components/GradientText/GradientText';

const SetupMaster = () => {
    const navigate = useNavigate();
    // Use the new context values
    const { setMek, setVaultKey, setSalt: setContextSalt } = useVaultContext();
    const [step, setStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const [seedConfirmed, setSeedConfirmed] = useState(false);

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

    const handleStep1Submit = async () => {
        if (!masterPassword || masterPassword.length < 8) {
            toaster.create({ title: "Master password must be at least 8 characters", type: "error" });
            return;
        }
        setLoading(true);
        try {
            // 1. Generate Master Seed (The root of everything)
            const ms = generateMasterSeed();
            setMasterSeed(ms);

            // 2. Recovery Key IS the Master Seed in this architecture
            const rKey = ms;
            setRecoveryKey(rKey);

            // 3. Hash RK for server-side verification (RKH)
            const rKeyHashHex = await hashRecoveryKey(rKey);

            // 4. Generate separate salts for vault encryption and master password derivation
            const vaultSalt = generateSalt(16);
            const masterPasswordSalt = generateSalt(16);

            // 5. Derive MPH (Server Auth) from Master Password
            const mph = await deriveMasterPasswordHash(masterPassword, masterPasswordSalt);

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
        if (contacts.some(c => !c.includes('@'))) {
            toaster.create({ title: "Please enter valid email addresses", type: "error" });
            return;
        }

        setLoading(true);
        try {
            // Prepare payload using the shards generated in Step 1
            const contactPayload = contacts.map((email, idx) => ({
                email, // Use standardized 'email' field
                keyShard: seedShards[idx],
                shardIndex: idx + 1
            }));

            await setupTrustedContactsAPI(contactPayload);

            toaster.create({ title: "Trusted Contacts Setup Complete", type: "success" });
            navigate('/dashboard');
        } catch (error) {
            logger.error(error);
            toaster.create({ title: "Failed to setup contacts", type: "error" });
        } finally {
            setLoading(false);
        }
    };

    const handleCopySeed = () => {
        if (recoveryKey) {
            navigator.clipboard.writeText(recoveryKey);
            setCopied(true);
            toaster.create({
                title: "Seed copied to clipboard",
                type: "success",
            });
            setTimeout(() => setCopied(false), 2000);
        }
    };

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

                    <Steps.Root count={3} step={step} colorPalette="brand">
                        <Steps.List bg="bg.muted" p={2} rounded="2xl" border="1px solid" borderColor="border.subtle">
                            <Steps.Item index={0} title="Security" />
                            <Steps.Item index={1} title="Backup" />
                            <Steps.Item index={2} title="Recovery" />
                        </Steps.List>
                    </Steps.Root>

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
                            <SpotlightCard className="w-full rounded-3xl border border-border-subtle shadow-2xl bg-bg-surface backdrop-blur-xl" spotlightColor="rgba(34, 197, 94, 0.05)">
                                <Stack spaceY={6} p={8}>
                                    <VStack align="center" textAlign="center" spaceY={2}>
                                        <Text fontSize="xl" fontWeight="bold" color="fg.primary">Decentralized Recovery</Text>
                                        <Text fontSize="sm" color="fg.muted">
                                            Nominate 3 trusted contacts. Any 2 can help you recover your vault if you lose your master password and seed.
                                        </Text>
                                    </VStack>

                                    <VStack align="stretch" spaceY={4}>
                                        {contacts.map((email, i) => (
                                            <Box key={i} spaceY={1.5}>
                                                <Text
                                                    fontSize="xs"
                                                    fontWeight="bold"
                                                    color="fg.muted"
                                                    textTransform="uppercase"
                                                    ml={1}
                                                >
                                                    Guardian {i + 1}
                                                </Text>
                                                <Input
                                                    placeholder={`guardian-${i + 1}@example.com`}
                                                    value={email}
                                                    onChange={(e) => {
                                                        const newContacts = [...contacts];
                                                        newContacts[i] = e.target.value;
                                                        setContacts(newContacts);
                                                    }}
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
                                        ))}

                                        <AuthButton
                                            isLoading={loading}
                                            onClick={handleStep3Submit}
                                            loadingText="Activating..."
                                        >
                                            <LuUsers /> Activate Recovery System
                                        </AuthButton>
                                    </VStack>
                                </Stack>
                            </SpotlightCard>
                        )}
                    </Box>
                </VStack>
            </Container>
        </Box>
    );
};

export default SetupMaster;
