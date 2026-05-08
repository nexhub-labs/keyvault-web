import {
    Container,
    Button,
    Text,
    Box,
    HStack,
    IconButton,
    ClipboardIndicator,
    ClipboardTrigger,
    Input,
    Flex,
    SimpleGrid,
    Badge,
    VStack,
    Heading,
    Tabs,
    Separator,
    Grid,
    GridItem,
    Spinner,
    Progress,
    NativeSelect,
} from "@chakra-ui/react";
import { useColorModeValue } from "../../components/ui/color-mode";
import { motion, AnimatePresence } from "motion/react";
import { useState, useEffect, useMemo } from 'react';
import { LuCheck, LuRefreshCw, LuTrash2, LuSettings2, LuHistory, LuSearch, LuLock, LuSave, LuCopy, LuLockOpen, LuFolder, LuShieldCheck, LuArrowRight } from "react-icons/lu";
import { BsHeart, BsHeartFill } from "react-icons/bs";
import { ClipboardRoot } from "../../components/ui/clipboard";
import DecryptedText from "../../components/DecryptedText/DecryptedText";
import { useVault } from "../../hooks/useVault";
import { getPasswordStrength } from "../../utils/security";
import SpotlightCard from "../../components/SpotlightCard/SpotlightCard";
import {
    DialogBody,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogRoot,
    DialogTitle,
    DialogOpenChangeDetails,
} from "../../components/ui/dialog";
import { toaster } from "../../components/ui/toaster";
import { Slider } from "../../components/ui/slider";
import { generateSecurePassword } from "../../utils/password";
import { storePasswordAPI } from "../../api/vault";
import { getMasterPasswordStatusAPI, getPricingLimitsAPI, PricingLimitsResponse } from "../../api/auth";
import { encryptWithKey } from "../../utils/crypto";
import { PasswordInput } from "../../components/ui/password-input";
import { OTPInput } from "../../components/ui/pin-input";
import { useVaultUnlock } from "../../hooks/useVaultUnlock";
import { useNavigate } from 'react-router';
import { useAuth } from "../../hooks/useAuth";
import { logger } from "../../utils/logger";
import { useProjects } from "../../hooks/useProjects";
import { MIN_PASSWORD_LENGTH, MAX_PASSWORD_LENGTH } from "../../constants/password";
import { LoadSpinner } from "../../components/ui/LoadSpinner";
import GradientText from "../../components/GradientText/GradientText";

// Define a type for the keys
type LoadingKeys = 'loading';

const PWGenerator = () => {
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const { vaultItems, saveToVault, hasMasterPassword, refresh } = useVault({ autoFetch: isAuthenticated });
    const { unlock, fetchSalt, isUnlocking, masterPasswordSalt } = useVaultUnlock();

    const [password, setPassword] = useState<string>("");
    const [length, setLength] = useState<number>(12);
    const [includeUppercase, setIncludeUppercase] = useState<boolean>(true);
    const [includeLowercase, setIncludeLowercase] = useState<boolean>(true);
    const [includeDigits, setIncludeDigits] = useState<boolean>(true);
    const [includeSymbols, setIncludeSymbols] = useState<boolean>(false);

    const [storedPasswords, setStoredPasswords] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [justSaved, setJustSaved] = useState<Set<string>>(new Set());

    const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
    const [keyName, setKeyName] = useState("");
    const [passwordToSave, setPasswordToSave] = useState("");

    // Inline unlock state (only master password input needed, rest comes from hook)
    const [masterPassword, setMasterPassword] = useState("");
    const [totpToken, setTotpToken] = useState("");
    const [selectedProjectId, setSelectedProjectId] = useState<string>('');
    const [newVarTags, setNewVarTags] = useState('');
    const [newVarFolder, setNewVarFolder] = useState('Unassigned');
    const { projects } = useProjects();
    const [requires2FA, setRequires2FA] = useState(false);

    const [loadingData, setLoadingData] = useState<{ [key in LoadingKeys]: boolean }>({
        loading: false,
    });

    const [activeTab, setActiveTab] = useState("history");
    const [pricingLimits, setPricingLimits] = useState<PricingLimitsResponse | null>(null);

    const [masterSetupStatus, setMasterSetupStatus] = useState<{ hasMasterSetup: boolean } | null>(null);
    const [fetchingSetup, setFetchingSetup] = useState(true);

    // Fetch pricing and setup status on auth change
    useEffect(() => {
        if (isAuthenticated) {
            setFetchingSetup(true);
            Promise.all([
                getPricingLimitsAPI(),
                getMasterPasswordStatusAPI()
            ]).then(([limits, status]) => {
                setPricingLimits(limits);
                setMasterSetupStatus(status);
                // Auto-enable symbols if user's plan allows it
                if (limits.canUseSymbols) {
                    setIncludeSymbols(true);
                }
            })
                .catch(logger.error)
                .finally(() => setFetchingSetup(false));
        } else {
            setFetchingSetup(false);
        }
    }, [isAuthenticated]);

    // Fetch master password salt if modal opens
    useEffect(() => {
        if (isSaveModalOpen && !hasMasterPassword) {
            fetchSalt();
        }
    }, [isSaveModalOpen, hasMasterPassword, fetchSalt]);

    const setLoading = (key: LoadingKeys, value: boolean) => {
        setLoadingData((prevState) => ({
            ...prevState,
            [key]: value,
        }));
    };



    const handleGenerate = async () => {
        setLoading('loading', true);
        try {
            // New Zero-Knowledge Flow:
            // 1. Authorize with backend (limits/tier)
            // 2. Generate LOCALLY using CSPRNG
            const newPassword = await generateSecurePassword({
                includeUppercase,
                includeLowercase,
                includeDigits,
                includeSymbols,
                length
            });

            setPassword(newPassword);

            // Update local generation history (session only)
            const updatedPasswords = [newPassword, ...storedPasswords.filter(p => p !== newPassword)];
            setStoredPasswords(updatedPasswords.slice(0, 50));

        } catch (error) {
            console.error("Secure generation failed:", error);
            toaster.create({ title: "Secure generation failed", type: "error" });
        } finally {
            setLoading('loading', false);
        }
    };

    const handleSaveClick = (pwd: string) => {
        if (vaultItems.length >= 10) {
            toaster.create({
                title: "Vault Limit Reached",
                description: "Free tier is limited to 10 stored items. Upgrade to Individual for unlimited storage.",
                type: "warning",
                action: {
                    label: "Upgrade",
                    onClick: () => navigate('/pricing')
                }
            });
            return;
        }
        setPasswordToSave(pwd);
        setMasterPassword(""); // Reset master password input
        setTotpToken(""); // Reset TOTP token
        setRequires2FA(false); // Reset 2FA requirement
        setSelectedProjectId('');
        setNewVarTags('');
        setNewVarFolder('Unassigned');
        setIsSaveModalOpen(true);
    };

    const handleUnlockAndSave = async (directTotpToken?: string) => {
        const tokenToUse = directTotpToken ?? totpToken;
        if (!keyName.trim()) {
            toaster.create({ title: "Key Name is required", type: "error" });
            return;
        }

        if (vaultItems.some(i => i.keyName === keyName)) {
            toaster.create({ title: "Key Name already exists", description: "Please choose a unique name.", type: "error" });
            return;
        }

        // If vault is already unlocked, just save directly
        if (hasMasterPassword) {
            try {
                const project = projects.find(p => p._id === selectedProjectId);
                const extra = {
                    projectId: selectedProjectId || undefined,
                    teamId: project?.teamId,
                    familyId: project?.familyId,
                    tags: newVarTags ? newVarTags.split(',').map(t => t.trim()) : [],
                    folder: newVarFolder || 'Unassigned',
                    secretType: 'password'
                };

                await saveToVault(keyName, passwordToSave, extra);
                setJustSaved(prev => new Set(prev).add(passwordToSave));
                setIsSaveModalOpen(false);
                setKeyName("");
                toaster.create({ title: "Saved to Vault", type: "success" });
            } catch (error) {
                const err = error as { response?: { status?: number } };
                if (err.response?.status === 403) {
                    toaster.create({
                        title: "Vault Limit Reached",
                        description: "Upgrade to store unlimited passwords.",
                        type: "warning",
                        action: {
                            label: "Upgrade",
                            onClick: () => navigate('/pricing')
                        }
                    });
                } else {
                    toaster.create({ title: "Failed to save", type: "error" });
                }
            }
            return;
        }

        // Inline unlock flow
        if (!masterPassword || !masterPasswordSalt) {
            toaster.create({ title: "Please enter your master password", type: "error" });
            return;
        }

        const result = await unlock(masterPassword, masterPasswordSalt, tokenToUse);

        if (result.success && result.vaultKey) {
            try {
                // 6. Now save the password using the vault key
                const project = projects.find(p => p._id === selectedProjectId);
                const extra = {
                    projectId: selectedProjectId || undefined,
                    teamId: project?.teamId,
                    familyId: project?.familyId,
                    tags: newVarTags ? newVarTags.split(',').map(t => t.trim()) : [],
                    folder: newVarFolder || 'Unassigned',
                    secretType: 'password'
                };

                const { encryptedData, iv } = await encryptWithKey(passwordToSave, result.vaultKey);
                await storePasswordAPI(keyName, encryptedData, iv, "AES-GCM", extra);
                refresh();

                setJustSaved(prev => new Set(prev).add(passwordToSave));
                setIsSaveModalOpen(false);
                setKeyName("");
                setMasterPassword("");
                setTotpToken("");

                toaster.create({ title: "Vault unlocked & saved!", description: "Your password is now secured.", type: "success" });
            } catch (error) {
                const err = error as { response?: { status?: number } };
                if (err.response?.status === 403) {
                    toaster.create({
                        title: "Vault Limit Reached",
                        description: "Upgrade to store unlimited passwords.",
                        type: "warning",
                        action: {
                            label: "Upgrade",
                            onClick: () => navigate('/pricing')
                        }
                    });
                } else {
                    toaster.create({ title: "Failed to save", type: "error" });
                }
            }
        } else {
            if (result.error === 'TwoFactorDisabled') {
                toaster.create({
                    title: "Setup 2FA Required",
                    description: "You must enable 2FA to modify your vault.",
                    type: "error"
                });
                navigate('/setup-2fa');
            } else if (result.error === 'TwoFactorRequired') {
                setRequires2FA(true);
                toaster.create({
                    title: "2FA Required",
                    description: "Please enter your 2FA token to proceed",
                    type: "info"
                });
            } else {
                toaster.create({
                    title: "Unlock failed",
                    description: result.error || "Check your master password",
                    type: "error"
                });
            }
        }
    };

    const isSavedInVault = (pwd: string) => {
        // Check if it's in our 'just saved' session set
        return justSaved.has(pwd);
    };

    const filteredHistory = storedPasswords.filter(pwd =>
        pwd && typeof pwd === 'string' && pwd.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredVault = vaultItems.filter(item =>
        item.keyName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const existingFolders = useMemo(() => {
        if (!selectedProjectId) {
            return Array.from(new Set(vaultItems.filter(v => !v.projectId).map(v => v.folder || 'Unassigned')));
        }
        return Array.from(new Set(vaultItems.filter(v => v.projectId === selectedProjectId).map(v => v.folder || 'Unassigned')));
    }, [vaultItems, selectedProjectId]);

    const ConfigToggle = ({ label, active, onClick }: { label: string, active: boolean, onClick: () => void }) => (
        <Button
            size="sm"
            variant={active ? "solid" : "outline"}
            colorPalette={active ? "brand" : "gray"}
            rounded="lg"
            onClick={onClick}
            px={4}
            bg={active ? "brand.600" : "transparent"}
            color={active ? "white" : "fg.muted"}
            borderColor={active ? "brand.600" : "border.subtle"}
            _hover={{
                bg: active ? "brand.700" : "bg.subtle",
                borderColor: active ? "brand.700" : "border.primary",
                color: active ? "white" : "fg.primary"
            }}
            fontWeight={active ? "bold" : "medium"}
            fontSize="xs"
            transition="all 0.2s"
        >
            {label}
        </Button>
    );

    if (isAuthenticated && fetchingSetup) {
        return <LoadSpinner message="Verifying security status..." />;
    }

    const showSetupMissing = isAuthenticated && masterSetupStatus && !masterSetupStatus.hasMasterSetup;

    return (
        <Box minH="100vh" bg="transparent" pb={20}>
            {/* Setup Missing Dialog - Non-dismissible if master setup is missing */}
            <DialogRoot
                open={!!showSetupMissing}
                closeOnEscape={false}
                closeOnInteractOutside={false}
                placement="center"
                motionPreset="slide-in-bottom"
            >
                <DialogContent bg="bg.panel" border="1px solid" borderColor="brand.500/30" shadow="2xl" p={4} rounded="2xl" backdropFilter="blur(10px)">
                    <DialogHeader textAlign="center">
                        <VStack spaceY={2}>
                            <Box p={3} bg="brand.500/10" rounded="full" color="brand.400">
                                <LuShieldCheck size={32} />
                            </Box>
                            <DialogTitle>
                                <GradientText colors={["#fff", "#ccc", "#fff"]} showBorder={false} className="text-xl font-bold">
                                    Security Setup Required
                                </GradientText>
                            </DialogTitle>
                        </VStack>
                    </DialogHeader>
                    <DialogBody textAlign="center">
                        <Text color="fg.muted" fontSize="sm">
                            To use the generator and secure your vault, you must first set up your master password. This acts as your root key for all encryption.
                        </Text>
                    </DialogBody>
                    <DialogFooter justifyContent="center" pt={4}>
                        <Button colorPalette="brand" size="lg" w="full" onClick={() => navigate('/setup-master')}>
                            Complete Setup <LuArrowRight />
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </DialogRoot>
            <Container maxW="2xl" py={{ base: 4, md: 8 }} px={{ base: 4, md: 8 }}>
                <VStack spaceY={{ base: 6, md: 8 }} align="stretch">

                    {/* Simplified Header */}
                    <VStack spaceY={2} align="center" textAlign="center">
                        <Badge colorPalette="brand" variant="outline" rounded="full" px={3} fontSize="xs" fontWeight="bold">
                            Secure Generator
                        </Badge>
                        <Heading size={{ base: "2xl", md: "3xl" }} fontWeight="black" letterSpacing="tight" color="fg.primary">
                            Gener<Box as="span" color="brand.400">ate</Box>
                        </Heading>
                    </VStack>


                    {/* Main Generator Card */}
                    <Box position="relative">
                        <SpotlightCard
                            w="full"
                            rounded="2xl"
                            border="1px solid"
                            borderColor={useColorModeValue("gray.200", "border.subtle")}
                            bg={useColorModeValue("white", "bg.surface")}
                            backdropFilter="blur(20px)"
                            shadow={useColorModeValue("xl", "xl")}
                            transition="box-shadow 0.5s"
                            _hover={{ shadow: "lg" }}
                            spotlightColor="rgba(74, 222, 128, 0.1)"
                        >
                            <VStack spaceY={8} p={6} filter={!isAuthenticated ? "blur(4px)" : "none"} pointerEvents={!isAuthenticated ? "none" : "auto"}>
                                {/* Password Display */}
                                <Box w="full" position="relative">
                                    <Flex
                                        direction="column"
                                        align="center"
                                        justify="center"
                                        minH="120px"
                                        bg="bg.surface"
                                        rounded="xl"
                                        border="1px solid"
                                        borderColor="border.subtle"
                                        p={6}
                                        position="relative"
                                        overflow="hidden"
                                    >
                                        {password && (
                                            <Badge
                                                position="absolute"
                                                top="3"
                                                right="3"
                                                size="sm"
                                                variant="subtle"
                                                colorPalette={getPasswordStrength(password).color.split('.')[0]}
                                            >
                                                {getPasswordStrength(password).label}
                                            </Badge>
                                        )}

                                        <Text
                                            fontSize={{ base: "2xl", md: "4xl" }}
                                            fontFamily="mono"
                                            fontWeight="bold"
                                            letterSpacing="0.05em"
                                            textAlign="center"
                                            wordBreak="break-all"
                                            color="fg.primary"
                                            filter={password ? "none" : "blur(4px)"}
                                            opacity={password ? 1 : 0.5}
                                        >
                                            <DecryptedText animateOn="view" revealDirection="end" text={password || "GenerateKey"} />
                                        </Text>
                                    </Flex>
                                </Box>

                                {/* Main Actions */}
                                {/* Main Actions */}
                                <Grid
                                    templateColumns={{ base: "1fr 1fr", sm: "2fr 1fr 1fr" }}
                                    gap={3}
                                    w="full"
                                >
                                    <GridItem colSpan={{ base: 2, sm: 1 }}>
                                        <Button
                                            w="full"
                                            size="xl"
                                            colorPalette="brand"
                                            onClick={handleGenerate}
                                            disabled={loadingData.loading || !pricingLimits}
                                            rounded="xl"
                                            fontWeight="bold"
                                        >
                                            <LuRefreshCw className={loadingData.loading ? "animate-spin" : ""} />
                                            {loadingData.loading ? "Generating..." : !pricingLimits ? "Loading Limits..." : "Generate New Key"}
                                        </Button>
                                    </GridItem>

                                    {password && (
                                        <>
                                            <GridItem colSpan={1}>
                                                <ClipboardRoot value={password} timeout={2000} onStatusChange={(details) => {
                                                    if (details.copied) toaster.create({ title: "Copied", description: "Password copied to clipboard", type: "success" });
                                                }}>
                                                    <ClipboardTrigger asChild>
                                                        <Button w="full" size="xl" variant="outline" rounded="xl" colorPalette="gray">
                                                            <ClipboardIndicator
                                                                display="flex"
                                                                alignItems="center"
                                                                gap={2}
                                                                copied={
                                                                    <>
                                                                        <LuCheck />
                                                                        Copied
                                                                    </>
                                                                }
                                                            >
                                                                <LuCopy />
                                                                Copy
                                                            </ClipboardIndicator>
                                                        </Button>
                                                    </ClipboardTrigger>
                                                </ClipboardRoot>
                                            </GridItem>

                                            <GridItem colSpan={1}>
                                                <Button
                                                    w="full"
                                                    size="xl"
                                                    variant="outline"
                                                    rounded="xl"
                                                    colorPalette="blue"
                                                    onClick={() => {
                                                        if (!isAuthenticated) {
                                                            toaster.create({ title: "Login Required", description: "You must be logged in to save passwords.", type: "info" });
                                                            navigate('/login');
                                                            return;
                                                        }
                                                        handleSaveClick(password);
                                                    }}
                                                    disabled={isSavedInVault(password)}
                                                >
                                                    {isSavedInVault(password) ? <LuCheck /> : <LuSave />}
                                                    {isSavedInVault(password) ? "Saved" : isAuthenticated ? "Save" : "Login to Save"}
                                                </Button>
                                            </GridItem>
                                        </>
                                    )}
                                </Grid>

                                <Separator borderColor="border.subtle" />

                                {/* Settings (Compact) */}
                                <VStack w="full" align="stretch" spaceY={4}>
                                    <Flex justify="space-between" align="center">
                                        <Text fontSize="sm" fontWeight="medium" color="fg.muted" display="flex" alignItems="center" gap={2}>
                                            <LuSettings2 /> Configuration
                                        </Text>
                                        <Badge variant="surface" colorPalette="gray">{length} chars</Badge>
                                    </Flex>

                                    <Box px={2}>
                                        <Slider
                                            value={[length > (pricingLimits?.maxLength || 128) ? (pricingLimits?.maxLength || 128) : length]}
                                            onValueChange={(details: { value: number[] }) => setLength(details.value[0])}
                                            min={MIN_PASSWORD_LENGTH}
                                            max={pricingLimits?.maxLength || MAX_PASSWORD_LENGTH}
                                            step={1}
                                            colorPalette="brand"
                                            size="md"
                                            thumbSize={{ width: 20, height: 20 }}
                                        />
                                    </Box>

                                    <Flex gap={3} wrap="wrap" justify={{ base: "center", sm: "flex-start" }}>
                                        <ConfigToggle label="A-Z" active={includeUppercase} onClick={() => setIncludeUppercase(!includeUppercase)} />
                                        <ConfigToggle label="a-z" active={includeLowercase} onClick={() => setIncludeLowercase(!includeLowercase)} />
                                        <ConfigToggle label="0-9" active={includeDigits} onClick={() => setIncludeDigits(!includeDigits)} />
                                        <Box position="relative">
                                            <ConfigToggle
                                                label="!@#"
                                                active={includeSymbols}
                                                onClick={() => {
                                                    // Block interaction while limits are loading
                                                    if (!pricingLimits) return;
                                                    if (!pricingLimits.canUseSymbols) {
                                                        toaster.create({
                                                            title: "Pro Feature",
                                                            description: "Advanced symbols are available only on paid plans.",
                                                            type: "info",
                                                            action: { label: "Upgrade", onClick: () => navigate('/pricing') }
                                                        });
                                                        return;
                                                    }
                                                    setIncludeSymbols(!includeSymbols);
                                                }}
                                            />
                                            {(!pricingLimits || !pricingLimits.canUseSymbols) && (
                                                <Badge
                                                    position="absolute"
                                                    top="-2"
                                                    right="-2"
                                                    colorPalette="yellow"
                                                    variant="solid"
                                                    size="xs"
                                                    rounded="full"
                                                >
                                                    {!pricingLimits ? '...' : 'Pro'}
                                                </Badge>
                                            )}
                                        </Box>
                                    </Flex>
                                </VStack>
                            </VStack>
                        </SpotlightCard>

                        {!isAuthenticated && (
                            <Flex
                                position="absolute"
                                top="0"
                                left="0"
                                right="0"
                                bottom="0"
                                align="center"
                                justify="center"
                                zIndex={10}
                                direction="column"
                                gap={4}
                            >
                                <Box p={4} bg="bg.panel" rounded="2xl" border="1px solid" borderColor="brand.500/30" backdropFilter="blur(5px)" textAlign="center" shadow="2xl">
                                    <VStack spaceY={3}>
                                        <Box p={3} bg="brand.500/10" rounded="full" color="brand.400">
                                            <LuLock size={24} />
                                        </Box>
                                        <VStack spaceY={0}>
                                            <Text fontWeight="bold" fontSize="lg" color="fg.primary">Generator is Locked</Text>
                                            <Text fontSize="sm" color="fg.muted">Login to access secure generation</Text>
                                        </VStack>
                                        <Button
                                            size="sm"
                                            colorPalette="brand"
                                            variant="solid"
                                            onClick={() => navigate('/login')}
                                            w="full"
                                        >
                                            Unlock Now
                                        </Button>
                                    </VStack>
                                </Box>
                            </Flex>
                        )}
                    </Box>

                    {/* Integrated Tabs for History & Vault */}
                    <Tabs.Root value={activeTab} onValueChange={(e) => setActiveTab(e.value)} variant="plain" lazyMount unmountOnExit>
                        <Flex justify="space-between" align="center" mb={4} wrap="wrap" gap={4}>
                            <Tabs.List bg="bg.surface" p={1} rounded="xl" border="1px solid" borderColor="border.subtle">
                                <Tabs.Trigger
                                    value="history"
                                    _selected={{ bg: "bg.elevated", color: "fg.primary", shadow: "sm" }}
                                    color="fg.muted"
                                    px={4} py={2} rounded="lg" fontSize="sm" fontWeight="medium" transition="all 0.2s"
                                >
                                    <LuHistory style={{ marginRight: '6px' }} /> History
                                </Tabs.Trigger>
                                {isAuthenticated && (
                                    <Tabs.Trigger
                                        value="vault"
                                        _selected={{ bg: "blue.500/10", color: "blue.400", shadow: "sm" }}
                                        color="fg.muted"
                                        px={4} py={2} rounded="lg" fontSize="sm" fontWeight="medium" transition="all 0.2s"
                                    >
                                        <LuLock style={{ marginRight: '6px' }} /> Vault ({vaultItems.length} {pricingLimits?.vaultLimit !== Infinity && `/ ${pricingLimits?.vaultLimit || 10}`})
                                    </Tabs.Trigger>
                                )}
                            </Tabs.List>

                            <HStack bg="bg.surface" px={3} py={1.5} rounded="lg" border="1px solid" borderColor="border.subtle" width={{ base: "full", sm: "auto" }}>
                                <LuSearch />
                                <Input
                                    placeholder="Search..."
                                    variant="subtle"
                                    size="sm"
                                    border="none"
                                    bg="transparent"
                                    _focus={{ outline: "none" }}
                                    width={{ base: "full", sm: "150px" }}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </HStack>
                        </Flex>

                        {activeTab === "vault" && isAuthenticated && pricingLimits && pricingLimits.vaultLimit !== Infinity && (
                            <VStack w="full" align="stretch" mb={6} spaceY={2}>
                                <Flex justify="space-between" align="baseline">
                                    <Text fontSize="xs" fontWeight="bold" color="fg.muted">VAULT STORAGE USAGE</Text>
                                    <Text fontSize="xs" fontWeight="bold" color={vaultItems.length >= pricingLimits.vaultLimit ? "red.400" : "brand.400"}>
                                        {vaultItems.length >= pricingLimits.vaultLimit ? "LIMIT REACHED" : `${pricingLimits.vaultLimit - vaultItems.length} SLOTS REMAINING`}
                                    </Text>
                                </Flex>
                                <Progress.Root value={vaultItems.length} max={pricingLimits.vaultLimit} colorPalette={vaultItems.length >= pricingLimits.vaultLimit ? "red" : "brand"} size="xs" variant="subtle" rounded="full">
                                    <Progress.Track bg="bg.muted">
                                        <Progress.Range />
                                    </Progress.Track>
                                </Progress.Root>
                            </VStack>
                        )}

                        {activeTab === "vault" && isAuthenticated && pricingLimits && pricingLimits.vaultLimit === Infinity && (
                            <VStack w="full" align="stretch" mb={6} spaceY={2}>
                                <Flex justify="space-between" align="baseline">
                                    <Text fontSize="xs" fontWeight="bold" color="fg.muted">VAULT STORAGE USAGE</Text>
                                    <Badge colorPalette="brand" variant="surface" size="sm" rounded="full">UNLIMITED STORAGE</Badge>
                                </Flex>
                                <Progress.Root value={100} max={100} colorPalette="brand" size="xs" variant="subtle" rounded="full">
                                    <Progress.Track bg="bg.muted">
                                        <Progress.Range />
                                    </Progress.Track>
                                </Progress.Root>
                            </VStack>
                        )}

                        <Tabs.Content value="history">
                            {storedPasswords.length > 0 ? (
                                <SimpleGrid columns={{ base: 1, sm: 2 }} gap={4}>
                                    <AnimatePresence mode="popLayout">
                                        {filteredHistory.map((pwd: string, index: number) => (
                                            <motion.div
                                                key={`${pwd}-${index}`}
                                                layout
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.95 }}
                                            >
                                                <Box p={4} rounded="xl" border="1px solid" borderColor="border.subtle" bg="bg.surface" _hover={{ borderColor: "border.primary", bg: "bg.elevated" }} transition="all 0.2s">
                                                    <Flex justify="space-between" mb={2}>
                                                        <Badge size="sm" variant="surface" colorPalette="gray">{index + 1}</Badge>
                                                        <HStack gap={1}>
                                                            <ClipboardRoot value={pwd}>
                                                                <ClipboardTrigger asChild>
                                                                    <IconButton variant="ghost" size="xs" colorPalette="gray">
                                                                        <ClipboardIndicator copied={<LuCheck />}>
                                                                            <LuCopy />
                                                                        </ClipboardIndicator>
                                                                    </IconButton>
                                                                </ClipboardTrigger>
                                                            </ClipboardRoot>
                                                            <IconButton
                                                                variant="ghost"
                                                                size="xs"
                                                                colorPalette={isSavedInVault(pwd) ? "green" : "gray"}
                                                                onClick={() => !isSavedInVault(pwd) && handleSaveClick(pwd)}
                                                                disabled={isSavedInVault(pwd)}
                                                            >
                                                                {isSavedInVault(pwd) ? <BsHeartFill /> : <BsHeart />}
                                                            </IconButton>
                                                        </HStack>
                                                    </Flex>
                                                    <Text fontFamily="mono" fontSize="sm" color="fg.primary" truncate>{pwd}</Text>
                                                </Box>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </SimpleGrid>
                            ) : (
                                <Box py={12} textAlign="center" border="1px dashed" borderColor="border.subtle" rounded="xl">
                                    <Text color="fg.muted" fontSize="sm">Generate your first key to see history here.</Text>
                                </Box>
                            )}
                            {storedPasswords.length > 0 && (
                                <Button
                                    variant="ghost"
                                    colorPalette="red"
                                    size="sm"
                                    mt={4}
                                    w="full"
                                    onClick={() => setStoredPasswords([])}
                                >
                                    <LuTrash2 /> Clear Session
                                </Button>
                            )}
                        </Tabs.Content>

                        <Tabs.Content value="vault">
                            {vaultItems.length > 0 ? (
                                <SimpleGrid columns={{ base: 1, sm: 2 }} gap={4}>
                                    {filteredVault.slice(0, 4).map((item, index: number) => (
                                        <Box key={`${item._id}-${index}`} p={4} rounded="xl" border="1px solid" borderColor="brand.500/20" bg="bg.muted" _hover={{ borderColor: "brand.primary", bg: "bg.subtle" }} transition="all 0.2s">
                                            <Flex justify="space-between" mb={2}>
                                                <Badge size="sm" variant="solid" colorPalette="brand">ENCRYPTED</Badge>
                                                <Text fontSize="xs" color="fg.muted">{new Date(item.createdAt).toLocaleDateString()}</Text>
                                            </Flex>
                                            <Text fontWeight="bold" color="fg.primary" fontSize="sm" truncate>{item.keyName}</Text>
                                            <Text fontSize="xs" color="fg.muted" mt={1}>Secured in Vault</Text>
                                        </Box>
                                    ))}
                                </SimpleGrid>
                            ) : (
                                <Box py={12} textAlign="center" border="1px dashed" borderColor="border.subtle" rounded="xl" bg="bg.muted">
                                    <Text color="fg.muted" fontSize="sm">No items in your vault yet.</Text>
                                </Box>
                            )}
                        </Tabs.Content>
                    </Tabs.Root>

                </VStack>
            </Container>

            {/* Save Modal */}
            <DialogRoot open={isSaveModalOpen} onOpenChange={(e: DialogOpenChangeDetails) => setIsSaveModalOpen(e.open)}>
                <DialogContent bg="bg.elevated" border="1px solid" borderColor="border.subtle">
                    <DialogHeader>
                        <DialogTitle color="fg.primary">Save to Secure Vault</DialogTitle>
                    </DialogHeader>
                    <DialogBody>
                        <VStack align="stretch" spaceY={4}>
                            <Input
                                placeholder="Name your key (e.g. Finance App)"
                                value={keyName}
                                onChange={(e) => setKeyName(e.target.value)}
                                autoFocus
                                bg="bg.surface"
                                border="1px solid"
                                borderColor="border.subtle"
                                _focus={{ borderColor: "brand.400" }}
                                color="fg.primary"
                            />

                            <Box w="full">
                                <HStack mb={2} color="fg.muted">
                                    <LuLock size={14} />
                                    <Text fontSize="xs" fontWeight="black" textTransform="uppercase" letterSpacing="widest">Project Assignment</Text>
                                </HStack>
                                <NativeSelect.Root size="lg">
                                    <NativeSelect.Field
                                        value={selectedProjectId}
                                        onChange={(e: any) => setSelectedProjectId(e.target.value)}
                                        bg="bg.surface"
                                        rounded="xl"
                                        fontWeight="bold"
                                    >
                                        <option value="">Unassigned Project</option>
                                        {projects.map(p => (
                                            <option key={p._id} value={p._id}>{p.name}</option>
                                        ))}
                                    </NativeSelect.Field>
                                    <NativeSelect.Indicator />
                                </NativeSelect.Root>
                            </Box>

                            <Box w="full">
                                <HStack mb={2} color="fg.muted">
                                    <LuFolder size={14} />
                                    <Text fontSize="xs" fontWeight="black" textTransform="uppercase" letterSpacing="widest">Folder Name</Text>
                                </HStack>
                                <Input
                                    placeholder="e.g. Production, Team Shared"
                                    value={newVarFolder} // I need to add this state
                                    onChange={(e) => setNewVarFolder(e.target.value)}
                                    size="lg"
                                    rounded="xl"
                                    bg="bg.surface"
                                    list="existing-gen-folders"
                                />
                                <datalist id="existing-gen-folders">
                                    {existingFolders.map(f => (
                                        <option key={f} value={f} />
                                    ))}
                                </datalist>
                            </Box>


                            <Input
                                placeholder="Tags (comma separated, e.g. dev, prod)"
                                value={newVarTags}
                                onChange={(e) => setNewVarTags(e.target.value)}
                                bg="bg.surface"
                                border="1px solid"
                                borderColor="border.subtle"
                                _focus={{ borderColor: "brand.400" }}
                                color="fg.primary"
                            />
                            {!hasMasterPassword && (
                                <Box p={3} bg="bg.muted" rounded="lg" border="1px solid" borderColor="brand.500/30">
                                    <HStack spaceX={2} mb={2}>
                                        <LuLock color="var(--chakra-colors-brand-400)" />
                                        <Text fontSize="sm" fontWeight="medium" color="fg.primary">Vault Locked</Text>
                                    </HStack>
                                    <Text fontSize="xs" color="fg.muted" mb={3}>
                                        Enter your master password to unlock and save.
                                    </Text>
                                    <PasswordInput
                                        placeholder="Master Password"
                                        value={masterPassword}
                                        onChange={(e) => setMasterPassword(e.target.value)}
                                        bg="bg.surface"
                                        border="1px solid"
                                        borderColor="border.subtle"
                                        _focus={{ borderColor: "yellow.400" }}
                                        disabled={requires2FA}
                                    />
                                    {requires2FA && (
                                        <Box pt={2}>
                                            <Text fontSize="xs" fontWeight="black" color="brand.400" textTransform="uppercase" letterSpacing="widest" mb={3} textAlign="center">
                                                Enter 2FA Code
                                            </Text>
                                            <Box display="flex" justifyContent="center">
                                                <OTPInput
                                                    length={6}
                                                    value={totpToken}
                                                    onChange={setTotpToken}
                                                    onComplete={(value) => handleUnlockAndSave(value)}
                                                />
                                            </Box>
                                        </Box>
                                    )}
                                </Box>
                            )}
                        </VStack>
                    </DialogBody>
                    <DialogFooter>
                        <Button variant="ghost" size="sm" onClick={() => setIsSaveModalOpen(false)} disabled={isUnlocking}>
                            Cancel
                        </Button>
                        <Button
                            colorPalette={hasMasterPassword ? "brand" : "yellow"}
                            size="sm"
                            onClick={() => handleUnlockAndSave()}
                            disabled={!keyName.trim() || isUnlocking || (!hasMasterPassword && !masterPassword)}
                        >
                            {isUnlocking ? (
                                <><Spinner size="sm" /> Unlocking...</>
                            ) : hasMasterPassword ? (
                                <><LuSave /> Save Key</>
                            ) : requires2FA ? (
                                <><LuLockOpen /> Verify & Save</>
                            ) : (
                                <><LuLockOpen /> Unlock & Save</>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </DialogRoot>

        </Box>
    );
};

export default PWGenerator;
