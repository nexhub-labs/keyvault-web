
import { useState, useEffect } from 'react';
import {
    VStack,
    HStack,
    Text,
    Button,
    Spinner,
    Badge,
    Input,
} from '@chakra-ui/react';
import { LuFingerprint, LuPlus } from 'react-icons/lu';
import { toaster } from '../../components/ui/toaster';
import { registerPasskey, deriveMasterPasswordHash, unwrapMasterSeed } from '../../utils/crypto';
import { useVaultContext } from '../../context/VaultContext';
import {
    getMasterPasswordStatusAPI,
    verifyMasterPasswordAPI
} from '../../api/auth';
import {
    DialogRoot,
    DialogContent,
    DialogHeader,
    DialogBody,
    DialogFooter,
    DialogTitle,
    DialogCloseTrigger
} from '../../components/ui/dialog';

const PasskeySettings = () => {
    const { isUnlocked } = useVaultContext();
    const [registering, setRegistering] = useState(false);

    // Dialog state for Master Password verification
    const [isVerifyOpen, setIsVerifyOpen] = useState(false);
    const [password, setPassword] = useState('');
    const [verifyLoading, setVerifyLoading] = useState(false);
    const [masterPasswordSalt, setMasterPasswordSalt] = useState<string | null>(null);

    // Load salt on mount or when dialog opens
    useEffect(() => {
        loadSalt();
    }, []);

    const loadSalt = async () => {
        try {
            const status = await getMasterPasswordStatusAPI();
            if (status.masterPasswordSalt) {
                setMasterPasswordSalt(status.masterPasswordSalt);
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
    };

    const handleVerifyAndRegister = async () => {
        if (!password) return;
        if (!masterPasswordSalt) {
            toaster.create({ title: "Configuration error: Missing salt", type: "error" });
            return;
        }

        setVerifyLoading(true);

        try {
            // 1. Derive MPH
            const mph = await deriveMasterPasswordHash(password, masterPasswordSalt);

            // 2. Verify and get wrapped seed (using API to verify password correctness too)
            const response = await verifyMasterPasswordAPI(mph);

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

            // 4. Register Passkey with the unwrapped seed
            setRegistering(true);
            const verification = await registerPasskey(masterSeed, true); // true = usePrf

            if (verification.verified) {
                toaster.create({ title: "Passkey registered successfully", type: "success" });
                setIsVerifyOpen(false);
                setPassword('');
            }
        } catch (error) {
            const err = error as { message?: string, response?: { data?: { error?: string } } };
            console.error(err);
            let msg = err.message || "Failed to register passkey";
            if (err.response?.data?.error === 'TwoFactorRequired') {
                msg = "Two-Factor Authentication required (Not yet supported in this flow)";
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
                    disabled={registering}
                >
                    <LuPlus /> Add Passkey
                </Button>
            </HStack>

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
                            <Input
                                type="password"
                                placeholder="Master Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                bg="bg.subtle"
                                rounded="xl"
                                autoFocus
                            />
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
