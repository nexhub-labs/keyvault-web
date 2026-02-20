import { useState, useEffect } from 'react';
import {
    Box,
    VStack,
    HStack,
    Text,
    Button,
    Input,
    Image,
    Heading,
    Spinner,
    Flex,
    Badge,
    Separator
} from '@chakra-ui/react';
import { LuShieldCheck, LuCopy, LuTriangle, LuArrowRight, LuUndo, LuDownload } from 'react-icons/lu';
import { toaster } from '../../components/ui/toaster';
import { setup2FAAPI, activate2FAAPI, deactivate2FAAPI, get2FAStatusAPI, TwoFASetupResponse, getPricingLimitsAPI, PricingLimitsResponse } from '../../api/auth';
import { useNavigate } from 'react-router';
import {
    DialogTitle,
    DialogCloseTrigger,
    DialogRoot,
    DialogContent,
    DialogHeader,
    DialogBody,
    DialogFooter
} from '../../components/ui/dialog';
import { PinInput } from '../../components/ui/pin-input';

const TwoFactorSetup = () => {
    const [isEnabled, setIsEnabled] = useState<boolean>(false);
    const [loading, setLoading] = useState(true);
    const [setupStep, setSetupStep] = useState<'status' | 'setup' | 'backup'>('status');
    const [setupData, setSetupData] = useState<TwoFASetupResponse | null>(null);
    const [token, setToken] = useState('');
    const [backupCodes, setBackupCodes] = useState<string[]>([]);
    const [actionLoading, setActionLoading] = useState(false);
    const [limits, setLimits] = useState<PricingLimitsResponse | null>(null);
    const navigate = useNavigate();

    // Deactivation Flow State
    const [deactivateStep, setDeactivateStep] = useState<'none' | 'confirm' | 'verify'>('none');

    useEffect(() => {
        load2FAStatus();
        getPricingLimitsAPI().then(setLimits).catch(console.error);
    }, []);

    const load2FAStatus = async () => {
        setLoading(true);
        try {
            const data = await get2FAStatusAPI();
            setIsEnabled(data.enabled);
        } catch (error) {
            console.error('Failed to load 2FA status:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStartSetup = async () => {
        if (limits?.tier === 'free') {
            toaster.create({
                title: "2FA Security",
                description: "Two-factor authentication is available on Individual plans and above.",
                type: "info",
                action: { label: "Upgrade", onClick: () => navigate('/pricing') }
            });
            return;
        }
        setActionLoading(true);
        try {
            const data = await setup2FAAPI();
            setSetupData(data);
            setSetupStep('setup');
        } catch (error) {
            const err = error as { response?: { data?: { message?: string } } };
            toaster.create({
                title: err.response?.data?.message || 'Failed to start 2FA setup',
                type: 'error'
            });
        } finally {
            setActionLoading(false);
        }
    };

    const handleActivate = async () => {
        if (!setupData || token.length !== 6) return;

        setActionLoading(true);
        try {
            const data = await activate2FAAPI(setupData.totpSetupKey, token);
            setBackupCodes(data.backupCodes);
            setIsEnabled(true);
            setSetupStep('backup');
            toaster.create({ title: '2FA activated successfully', type: 'success' });
        } catch (error) {
            const err = error as { response?: { data?: { message?: string } } };
            toaster.create({
                title: err.response?.data?.message || 'Verification failed',
                type: 'error'
            });
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeactivate = async () => {
        if (!token) {
            toaster.create({ title: 'Enter a token to deactivate 2FA', type: 'warning' });
            return;
        }

        setActionLoading(true);
        try {
            await deactivate2FAAPI(token);
            setIsEnabled(false);
            setToken('');
            setDeactivateStep('none'); // Close dialogs
            toaster.create({ title: '2FA deactivated successfully', type: 'success' });
        } catch (error) {
            const err = error as { response?: { data?: { message?: string } } };
            toaster.create({
                title: err.response?.data?.message || 'Deactivation failed',
                type: 'error'
            });
        } finally {
            setActionLoading(false);
        }
    };

    const handleCopySecret = () => {
        if (setupData?.totpSetupKey) {
            navigator.clipboard.writeText(setupData.totpSetupKey);
            toaster.create({ title: 'Secret key copied', type: 'success' });
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

    if (loading) {
        return (
            <Flex justify="center" py={10}>
                <Spinner color="brand.400" />
            </Flex>
        );
    }

    // --- Status View & Dialogs ---
    if (setupStep === 'status') {
        return (
            <VStack align="stretch" spaceY={6}>
                <HStack justify="space-between" align="center">
                    <VStack align="start" spaceY={1}>
                        <HStack spaceY={2}>
                            <Badge colorPalette={isEnabled ? 'green' : 'gray'} variant="solid" rounded="full">
                                {isEnabled ? <LuShieldCheck /> : <LuTriangle />}
                            </Badge>
                            <Text fontWeight="bold" fontSize="lg" color="fg.primary">Two-Factor Authentication</Text>
                        </HStack>
                        <Text fontSize="sm" color="fg.muted">
                            {isEnabled
                                ? 'Your account is protected with an additional layer of security.'
                                : 'Protect your vault with a 6-digit code from an authenticator app.'}
                        </Text>
                    </VStack>
                    <Button
                        colorPalette={isEnabled ? 'red' : 'brand'}
                        variant={isEnabled ? 'subtle' : 'solid'}
                        onClick={isEnabled ? () => setDeactivateStep('confirm') : handleStartSetup}
                        size="sm"
                        rounded="xl"
                        disabled={actionLoading}
                    >
                        {actionLoading ? <Spinner size="sm" /> : (isEnabled ? 'Disable' : 'Enable 2FA')}
                    </Button>
                </HStack>

                {/* Dialog 1: Confirmation */}
                <DialogRoot open={deactivateStep === 'confirm'} onOpenChange={() => setDeactivateStep('none')}>
                    <DialogContent bg="bg.elevated" border="1px solid" borderColor="border.subtle">
                        <DialogHeader>
                            <DialogTitle color="fg.primary">Disable Two-Factor Authentication?</DialogTitle>
                            <DialogCloseTrigger color="fg.muted" />
                        </DialogHeader>
                        <DialogBody>
                            <Text color="fg.muted" fontSize="sm">
                                This will remove the extra layer of security from your account. Are you sure you want to proceed?
                            </Text>
                        </DialogBody>
                        <DialogFooter>
                            <Button variant="subtle" onClick={() => setDeactivateStep('none')}>
                                Cancel
                            </Button>
                            <Button
                                colorPalette="red"
                                onClick={() => {
                                    setDeactivateStep('verify');
                                    setToken(''); // Reset token for the next step
                                }}
                            >
                                Yes, Disable
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </DialogRoot>

                {/* Dialog 2: Verification Input */}
                <DialogRoot open={deactivateStep === 'verify'} onOpenChange={() => { if (!actionLoading) setDeactivateStep('none'); }}>
                    <DialogContent bg="bg.elevated" border="1px solid" borderColor="border.subtle">
                        <DialogHeader>
                            <DialogTitle color="fg.primary">Confirm Deactivation</DialogTitle>
                            <DialogCloseTrigger color="fg.muted" />
                        </DialogHeader>
                        <DialogBody>
                            <VStack align="stretch" spaceY={4}>
                                <Text color="fg.muted" fontSize="sm">
                                    Please enter the 6-digit code from your authenticator app to confirm.
                                </Text>
                                <Input
                                    placeholder="000000"
                                    value={token}
                                    onChange={(e) => setToken(e.target.value)}
                                    maxLength={6}
                                    bg="bg.subtle"
                                    textAlign="center"
                                    fontSize="xl"
                                    letterSpacing="widest"
                                    rounded="xl"
                                    autoFocus
                                />
                            </VStack>
                        </DialogBody>
                        <DialogFooter>
                            <Button variant="subtle" onClick={() => setDeactivateStep('confirm')} disabled={actionLoading}>
                                Back
                            </Button>
                            <Button
                                colorPalette="red"
                                onClick={handleDeactivate}
                                disabled={token.length !== 6 || actionLoading}
                            >
                                {actionLoading ? <Spinner size="sm" /> : 'Confirm & Disable'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </DialogRoot>
            </VStack>
        );
    }

    // --- Setup View ---
    if (setupStep === 'setup') {
        return (
            <VStack align="stretch" spaceY={6}>
                <HStack align="center" gap={4}>
                    <Button variant="ghost" size="xs" onClick={() => setSetupStep('status')}>
                        <LuUndo /> Back
                    </Button>
                    <Heading size="md">Setup Authenticator</Heading>
                </HStack>

                <VStack align="center" spaceY={6} py={4}>
                    <Box p={4} bg="white" rounded="3xl" shadow="xl">
                        {setupData?.qrCodeUrl && <Image src={setupData.qrCodeUrl} alt="2FA QR Code" boxSize="200px" />}
                    </Box>

                    <VStack spaceY={2} w="full">
                        <Text fontSize="sm" textAlign="center" color="fg.muted">
                            Scan this QR code in your authenticator app (Google Authenticator, Authy, etc.)
                        </Text>
                        <HStack bg="bg.subtle" p={3} rounded="xl" w="full" justify="space-between" border="1px solid" borderColor="border.subtle">
                            <VStack align="start" spaceY={0}>
                                <Text fontSize="2xs" fontWeight="bold" color="fg.muted">CAN'T SCAN? USE SECRET KEY</Text>
                                <Text fontSize="md" fontFamily="mono" fontWeight="bold" color="fg.primary">{setupData?.totpSetupKey}</Text>
                            </VStack>
                            <Button size="xs" variant="ghost" onClick={handleCopySecret} color="fg.muted" _hover={{ color: "fg.primary", bg: "bg.muted" }}>
                                <LuCopy />
                            </Button>
                        </HStack>
                    </VStack>

                    <Separator borderColor="border.subtle" />

                    <VStack align="stretch" spaceY={4} w="full">
                        <Box>
                            <Text fontSize="xs" fontWeight="black" color="fg.muted" textTransform="uppercase" letterSpacing="widest" mb={4} textAlign="center">Enter 6-Digit Code</Text>
                            <Flex justify="center">
                                <PinInput
                                    length={6}
                                    value={token}
                                    onChange={setToken}
                                    onComplete={() => { }}
                                    autoFocus
                                />
                            </Flex>
                        </Box>
                        <Button
                            colorPalette="brand"
                            size="lg"
                            w="full"
                            rounded="2xl"
                            onClick={handleActivate}
                            disabled={token.length !== 6 || actionLoading}
                        >
                            {actionLoading ? <Spinner size="sm" /> : <Flex align="center" gap={2}>Verify & Activate <LuArrowRight /></Flex>}
                        </Button>
                    </VStack>
                </VStack>
            </VStack>
        );
    }

    // --- Backup Codes View ---
    if (setupStep === 'backup') {
        return (
            <VStack align="stretch" spaceY={6}>
                <VStack align="start" spaceY={1}>
                    <Heading size="md" color="brand.400">Security Activated!</Heading>
                    <Text fontSize="sm" color="fg.muted">
                        Save these backup codes in a secure location. They are the only way to access your vault if you lose your authenticator device.
                    </Text>
                </VStack>

                <Box p={6} bg="bg.subtle" rounded="3xl" border="1px solid" borderColor="green.500/30">
                    <Flex wrap="wrap" gap={4} justify="center">
                        {backupCodes.map((code, i) => (
                            <Box key={i} p={2} bg="bg.surface" rounded="lg" border="1px solid" borderColor="border.subtle" w="120px" textAlign="center">
                                <Text fontFamily="mono" fontWeight="bold" fontSize="sm">{code}</Text>
                            </Box>
                        ))}
                    </Flex>
                </Box>

                <HStack spaceX={4}>
                    <Button variant="outline" flex={1} rounded="xl" onClick={handleDownloadBackupCodes}>
                        <LuDownload /> Download .txt
                    </Button>
                    <Button colorPalette="brand" flex={1} rounded="xl" onClick={() => setSetupStep('status')}>
                        I've Saved the Codes
                    </Button>
                </HStack>
            </VStack>
        );
    }

    return null;
};

export default TwoFactorSetup;
