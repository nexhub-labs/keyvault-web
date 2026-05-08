
import { useState, useEffect } from 'react';
import {
    Box,
    VStack,
    HStack,
    Text,
    Button,
    Spinner,
    Badge,
    Input,
} from '@chakra-ui/react';
import { LuFingerprint, LuPlus, LuTrash2, LuShieldCheck, LuZap } from 'react-icons/lu';
import { useNavigate } from 'react-router';
import axiosInstance from '../../utils/axiosInstance';
import { toaster } from '../../components/ui/toaster';
import { registerPasskey, deriveMasterPasswordHash, unwrapMasterSeed, authenticateWithPasskey } from '../../utils/crypto';
import { useVaultContext } from '../../context/VaultContext';
import {
    getMasterPasswordStatusAPI,
    verifyMasterPasswordAPI,
    getAuthSaltAPI
} from '../../api/auth';
import { supabase } from '../../utils/supabase';
import {
    DialogRoot,
    DialogContent,
    DialogHeader,
    DialogBody,
    DialogFooter,
    DialogTitle,
    DialogCloseTrigger
} from '../../components/ui/dialog';
import { PinInput } from '../../components/ui/pin-input';

const PasskeySettings = () => {
    const { isUnlocked } = useVaultContext();
    const navigate = useNavigate();
    const [registering, setRegistering] = useState(false);

    // Dialog state for Master Password verification
    const [isVerifyOpen, setIsVerifyOpen] = useState(false);
    const [password, setPassword] = useState('');
    const [verifyLoading, setVerifyLoading] = useState(false);
    const [masterPasswordSalt, setMasterPasswordSalt] = useState<string | null>(null);
    const [is2FAEnabled, setIs2FAEnabled] = useState<boolean>(true);

    const [passkeys, setPasskeys] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [testing, setTesting] = useState(false);
    const [nickname, setNickname] = useState('');

    // 2FA state for registration
    const [requires2FA, setRequires2FA] = useState(false);
    const [totpToken, setTotpToken] = useState('');

    // Load passkeys on mount
    useEffect(() => {
        loadSalt();
        fetchPasskeys();
    }, []);

    const fetchPasskeys = async () => {
        try {
            const { data } = await axiosInstance.get('/auth/passkeys/list');
            setPasskeys(data);
        } catch (error) {
            console.error('Failed to fetch passkeys', error);
        } finally {
            setLoading(false);
        }
    };

    const loadSalt = async () => {
        try {
            const status = await getMasterPasswordStatusAPI();
            if (status.masterPasswordSalt) {
                setMasterPasswordSalt(status.masterPasswordSalt);
            }
            if (status.twoFactorEnabled !== undefined) {
                setIs2FAEnabled(status.twoFactorEnabled);
            }
        } catch (error) {
            console.error('Failed to load master password salt', error);
        }
    };

    const handleStartRegistration = () => {
        if (!isUnlocked) {
            toaster.create({ title: "Unlock vault first", type: "error" });
            return;
        }
        setIsVerifyOpen(true);
        setRequires2FA(false);
        setTotpToken('');
    };

    const handleVerifyAndRegister = async () => {
        if (!password) return;
        if (!masterPasswordSalt) {
            toaster.create({ title: "Configuration error: Missing salt", type: "error" });
            return;
        }

        setVerifyLoading(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user || !user.email) {
                throw new Error("Session expired or invalid. Please re-login.");
            }

            const { authSalt } = await getAuthSaltAPI(user.email);

            // 1. Derive MPH (uses server-issued auth salt)
            const mph = await deriveMasterPasswordHash(password, authSalt);

            // 2. Verify and get wrapped seed (using API to verify password correctness too)
            const response = await verifyMasterPasswordAPI(mph, requires2FA ? totpToken : undefined);

            if (!response.valid) {
                throw new Error("Invalid password");
            }

            // 3. Unwrap Master Seed
            const masterSeed = await unwrapMasterSeed(
                response.wrappedMasterSeed,
                response.wrappedMasterSeedIv,
                password,
                masterPasswordSalt
            );

            // 4. Register Passkey with the unwrapped seed and nickname
            setRegistering(true);
            const verification = await registerPasskey(masterSeed, true, nickname); // true = usePrf

            if (verification.verified) {
                toaster.create({ title: "Passkey registered successfully", type: "success" });
                setIsVerifyOpen(false);
                setPassword('');
                setNickname('');
                fetchPasskeys(); // Refresh list
            }
        } catch (error) {
            const err = error as { message?: string, response?: { data?: { error?: string } } };
            console.error(err);
            let msg = err.message || "Failed to register passkey";
            if (err.response?.data?.error === 'TwoFactorRequired') {
                setRequires2FA(true);
                return; // Stop here and wait for the user to input TOTP
            }
            toaster.create({
                title: "Registration failed",
                description: msg,
                type: "error"
            });
        } finally {
            setVerifyLoading(false);
            setRegistering(false);
        }
    };
    const handleTestPasskey = async () => {
        setTesting(true);
        try {
            const { verification } = await authenticateWithPasskey();
            if (verification.verified) {
                toaster.create({ title: "Hardware Verification Successful", description: "Your hardware key is bound and responsive.", type: "success" });
            } else {
                throw new Error("Verification failed on hardware level");
            }
        } catch (error: any) {
            console.error(error);
            toaster.create({ title: "Hardware Test Failed", description: error.message || "Failed to verify key", type: "error" });
        } finally {
            setTesting(false);
        }
    };

    const handleDeletePasskey = async (credentialID: string) => {
        if (!confirm("Are you sure you want to revoke this hardware key? You will no longer be able to use it to unlock your vault.")) return;

        try {
            await axiosInstance.post('/auth/passkeys/delete', { credentialID });
            toaster.create({ title: "Passkey revoked", type: "success" });
            fetchPasskeys();
        } catch (error) {
            console.error('Failed to delete passkey', error);
            toaster.create({ title: "Revocation failed", type: "error" });
        }
    };

    return (
        <VStack align="stretch" spaceY={6}>
            <HStack justify="space-between" align="center">
                <VStack align="start" spaceY={1}>
                    <HStack spaceY={2}>
                        <Badge colorPalette="blue" variant="solid" rounded="full">
                            <LuFingerprint />
                        </Badge>
                        <Text fontWeight="bold" fontSize="lg" color="fg.primary">Hardware Keys / Passkeys</Text>
                    </HStack>
                    <Text fontSize="sm" color="fg.muted">
                        Unlock your vault using FaceID, TouchID, or a YubiKey.
                    </Text>
                </VStack>

                <Button
                    size="sm"
                    rounded="xl"
                    variant="surface"
                    colorPalette="blue"
                    onClick={handleStartRegistration}
                    disabled={registering || !is2FAEnabled}
                >
                    <LuPlus /> Add Passkey
                </Button>
            </HStack>

            {!is2FAEnabled && (
                <VStack p={4} bg="orange.500/10" border="1px solid" borderColor="orange.500/30" rounded="xl" align="start" spaceY={2}>
                    <HStack color="orange.400">
                        <LuShieldCheck />
                        <Text fontWeight="bold" fontSize="sm">2FA Setup Required</Text>
                    </HStack>
                    <Text fontSize="xs" color="fg.muted">
                        Hardware keys offer elite-level security. To enroll a passkey, you must first enable standard Two-Factor Authentication (Authenticator App) as a fallback recovery method.
                    </Text>
                    <Button size="xs" colorPalette="orange" variant="outline" onClick={() => navigate('/setup-2fa')}>
                        Setup 2FA Now
                    </Button>
                </VStack>
            )}

            {loading ? (
                <HStack p={8} justify="center" w="full">
                    <Spinner size="xl" color="brand.500" />
                    <Text color="fg.muted" fontWeight="bold">Scanning Hardware Interfaces...</Text>
                </HStack>
            ) : passkeys.length === 0 ? (
                <VStack p={10} bg="bg.subtle" rounded="2xl" border="1px dashed" borderColor="border.subtle" spaceY={4}>
                    <LuShieldCheck size={40} color="var(--chakra-colors-fg-muted)" />
                    <VStack spaceY={1}>
                        <Text fontWeight="black" textAlign="center">No Hardware Keys Bound</Text>
                        <Text fontSize="xs" color="fg.muted" textAlign="center">
                            Register a physical security key or biometric device for elite protection.
                        </Text>
                    </VStack>
                </VStack>
            ) : (
                <VStack align="stretch" spaceY={3}>
                    {passkeys.map((pk, i) => (
                        <HStack
                            key={pk.id}
                            p={4}
                            bg="bg.surface"
                            rounded="xl"
                            border="1px solid"
                            borderColor="border.subtle"
                            justify="space-between"
                        >
                            <HStack spaceX={3}>
                                <Box p={2} bg="blue.500/10" color="blue.500" rounded="lg">
                                    <LuFingerprint size={20} />
                                </Box>
                                <VStack align="start" spaceY={0}>
                                    <Text fontWeight="black" fontSize="sm">{pk.nickname || `Security Key #${i + 1}`}</Text>
                                    <Text fontSize="10px" color="fg.muted" fontFamily="mono">ID: {pk.id.slice(0, 16)}...</Text>
                                </VStack>
                            </HStack>
                            <HStack spaceX={2}>
                                <VStack align="end" spaceY={1}>
                                    <HStack>
                                        <Badge colorPalette="green" size="xs" variant="subtle">{pk.isSeedbound ? 'Seedbound' : 'Verified'}</Badge>
                                        <Badge colorPalette="gray" size="xs" variant="subtle">Counter: {pk.counter}</Badge>
                                    </HStack>
                                </VStack>
                                <Button
                                    size="xs"
                                    variant="ghost"
                                    colorPalette="red"
                                    onClick={() => handleDeletePasskey(pk.id)}
                                    rounded="lg"
                                >
                                    <LuTrash2 />
                                </Button>
                            </HStack>
                        </HStack>
                    ))}

                    <Button
                        mt={2}
                        size="md"
                        rounded="xl"
                        variant="ghost"
                        colorPalette="blue"
                        onClick={handleTestPasskey}
                        disabled={testing}
                        w="full"
                        borderWidth="1px"
                        borderColor="blue.500/30"
                    >
                        {testing ? <Spinner size="sm" /> : <><LuZap /> Run Hardware Diagnostic</>}
                    </Button>
                </VStack>
            )}

            <DialogRoot open={isVerifyOpen} onOpenChange={() => setIsVerifyOpen(false)}>
                <DialogContent bg="bg.elevated" border="1px solid" borderColor="border.subtle">
                    <DialogHeader>
                        <DialogTitle color="fg.primary">Verify Master Password</DialogTitle>
                        <DialogCloseTrigger color="fg.muted" />
                    </DialogHeader>
                    <DialogBody>
                        <VStack align="stretch" spaceY={4}>
                            <Text color="fg.muted" fontSize="sm">
                                Please enter your Master Password to authorize this new passkey.
                                We will encrypt your vault key with this passkey.
                            </Text>
                            <VStack align="stretch" spaceY={2}>
                                <Text fontSize="xs" fontWeight="bold" color="fg.muted">Device Nickname</Text>
                                <Input
                                    placeholder="e.g. MacBook Pro, YubiKey 5C"
                                    value={nickname}
                                    onChange={(e) => setNickname(e.target.value)}
                                    bg="bg.subtle"
                                    rounded="xl"
                                />
                            </VStack>
                            <VStack align="stretch" spaceY={2}>
                                <Text fontSize="xs" fontWeight="bold" color="fg.muted">Master Password</Text>
                                <Input
                                    type="password"
                                    placeholder="Confirm Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    bg="bg.subtle"
                                    rounded="xl"
                                    disabled={requires2FA}
                                />
                            </VStack>
                            {requires2FA && (
                                <VStack align="stretch" spaceY={2}>
                                    <Text fontSize="xs" fontWeight="bold" color="fg.muted">Two-Factor Authentication Token</Text>
                                    <PinInput
                                        length={6}
                                        value={totpToken}
                                        onChange={setTotpToken}
                                        autoFocus
                                    />
                                </VStack>
                            )}
                        </VStack>
                    </DialogBody>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsVerifyOpen(false)}>Cancel</Button>
                        <Button
                            colorPalette="blue"
                            onClick={handleVerifyAndRegister}
                            disabled={!password || verifyLoading}
                        >
                            {verifyLoading ? <Spinner size="sm" /> : "Verify & Register"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </DialogRoot>
        </VStack>
    );
};

export default PasskeySettings;
